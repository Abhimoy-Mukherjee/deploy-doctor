# Deploy Doctor 🩺

**An AI agent that diagnoses failed deployments and, where it's safe to, fixes them automatically — via a real pull request.**

Built for the First Commit hackathon (AWS-sponsored) | Ship It track

---

## The Problem

Every developer has lost time to a cryptic deployment failure — a wall of raw logs,
no clear root cause, and 10-15 minutes of manual digging before finding the fix.
This happens constantly, on every team, at every scale, and it's almost entirely
manual today.

## What Deploy Doctor Does

Deploy Doctor watches a CI/CD pipeline (GitHub Actions). The moment a deployment
fails, it:

1. **Automatically pulls the failure log** — no copy-pasting into a chat window
2. **Diagnoses the root cause** using Amazon Bedrock, classifying the failure and
   citing the specific evidence in the log
3. **Proposes a specific, actionable fix**
4. **When the fix is a safe, single environment-variable change and confidence is
   high** — automatically opens a pull request with the fix applied. Every other
   case gets a diagnosis and suggestion, correctly withheld from auto-fixing.

A standalone frontend also lets anyone paste a log and get the same diagnosis
on demand, without needing a CI pipeline set up at all.

## Is This a New Idea?

No, and we want to be upfront about that. Tools like CodeRabbit's pipeline
remediation, TierZero, and various "self-healing CI" agents already exist in
this space. We're not claiming to have invented AI-assisted failure diagnosis.

What we focused on instead:

- **Deployment/infrastructure-specific failures** — missing env vars, port
  conflicts, OOM kills, failed health checks, container crash loops — rather
  than generic code/test failures, which is where most existing tools focus
- **An explicit, conservative automation policy**: Deploy Doctor only opens a
  PR when confidence is high AND the fix is a single, safe env var change.
  Every other diagnosis (build failures, dependency conflicts, resource limits,
  ambiguous logs) is surfaced to a human, never guessed at. We think knowing
  when *not* to automate is as important as the automation itself.
- **Built end-to-end on Amazon Bedrock, Lambda, and API Gateway**, including
  working through several real, undocumented rough edges of that stack (see
  What We Learned below)

## Why This Isn't Just "Paste an Error Into an AI Chat"

| | Copy-pasting into an AI chat | Deploy Doctor |
|---|---|---|
| **Trigger** | A human has to notice and remember to check | Fires automatically the instant CI fails |
| **Output** | A chat response a human must read and manually apply | A structured diagnosis, and for safe cases, an actual draft PR |
| **Judgment** | Human decides every time whether to trust it | System has an explicit, auditable rule for what it will and won't auto-fix |
| **Where it lives** | A tab someone has to remember to open | Directly in the GitHub workflow that failed |

## Architecture

```
GitHub Actions (deploy step fails)
        |
        v
  Diagnose step  --->  API Gateway  --->  Lambda (diagnose.py)
        |                                        |
        |                                        v
        |                                Amazon Bedrock
        |                             (Amazon Nova Lite)
        |                                        |
        v                                        v
  Workflow summary                    Structured diagnosis
  (always shown)                (category, root cause, evidence,
        |                        suggested fix, confidence, auto_fix)
        v
  If auto_fix present + confidence high:
  branch -> patch config -> commit -> open PR
  (requires human review, never auto-merges)
```

A separate, standalone **frontend** calls the same API directly, for on-demand
diagnosis outside of any CI pipeline.

## Tech Stack

- **AWS Lambda** — hosts the diagnosis logic
- **API Gateway** — public HTTP endpoint (`POST /diagnose`)
- **Amazon Bedrock** — foundation model inference (currently Amazon Nova Lite)
- **GitHub Actions** — automatic failure detection, diagnosis trigger, and
  auto-PR creation via the `gh` CLI
- **[Planned, not built]** DynamoDB for cross-run failure pattern tracking

## Live Demo

- **API endpoint:** `https://x89gw8o4t3.execute-api.ap-south-1.amazonaws.com/diagnose`
- **Frontend:** _link here once deployed_
- **Demo video:** _link here once recorded_
- **Example automated runs:** see the Actions tab of this repo —
  `Demo Deploy Pipeline` (env var fix) and
  `Demo Deploy Pipeline (Port Conflict)` (port value fix) both show the full
  automated flow, including the resulting pull requests

## How Someone Else Would Actually Use This

Being honest about the current scope:

- **Diagnosis works for anyone, immediately** — it's a plain HTTP API. Any
  CI system (not just GitHub Actions) can POST a failure log to it and get a
  structured diagnosis back.
- **Auto-PR creation is demonstrated on our own repo.** It's coupled to our
  demo app's config file path (`demo-app/.env.example`) right now. Generalizing
  it — e.g. packaging it as a reusable GitHub Action that takes a config file
  path as an input — is the natural next step, not yet built.
- To try diagnosis-only on your own repo today, copy the "Diagnose failure"
  step from `.github/workflows/demo-deploy.yml`, point `DEPLOY_DOCTOR_API_URL`
  at our endpoint (or your own deployment of this code), and adapt the log
  source to your actual failing step.

## Project Structure

```
deploy-doctor/
├── src/
│   ├── diagnose.py              # Core Bedrock diagnosis logic
│   └── lambda_handler.py        # API Gateway <-> Lambda adapter
├── .github/workflows/
│   ├── demo-deploy.yml              # Staged env-var failure -> diagnosis -> auto-PR
│   └── demo-deploy-port-conflict.yml # Staged port conflict -> diagnosis -> auto-PR
├── demo-app/
│   └── .env.example              # Target file for the demo's auto-fix PRs
├── infrastructure/
│   └── template.yaml             # AWS SAM template (Lambda + API Gateway, IaC)
├── sample_logs/                  # Test fixtures covering 6 real failure categories
├── docs/
│   ├── ARCHITECTURE.md
│   └── FRONTEND_GUIDE.md         # API contract handed to the frontend teammate
└── README.md
```

## What We Learned

This was, honestly, a weekend of learning AWS the hard way as much as it was
building a feature:

- **Bedrock model access changed recently** — AWS retired the old manual
  "Model access" request flow; models are now available automatically, but
  newer models require an *inference profile ID* (a region-prefixed model ID
  like `apac.amazon.nova-lite-v1:0`) for on-demand invocation, not the bare
  model ID. Cost us a few failed calls to figure out.
- **AWS Marketplace subscriptions and RuPay cards don't mix.** Anthropic
  models on Bedrock go through AWS Marketplace, which requires a payment
  instrument capable of cross-border/USD billing. A RuPay-only card caused
  every invocation to silently trigger-and-terminate a Marketplace
  subscription (visible in Marketplace > Manage subscriptions - 11 terminated
  subscriptions before we diagnosed it). We worked around this by using
  Amazon's own Nova model, which doesn't require a Marketplace subscription.
- **`continue-on-error: true` breaks `failure()`, not just error propagation.**
  We initially gated our diagnosis step on `if: failure()`, which never fired,
  because `continue-on-error` suppresses the job-level failure signal that
  `failure()` checks. Fixed by checking the specific step's `outcome` instead.
- **GitHub Actions has two separate permission gates for PR creation** — the
  `permissions:` block in the workflow YAML, and a repo-level setting
  ("Allow GitHub Actions to create and approve pull requests") that's off by
  default even when the YAML grants write access. Both are required.
- **LLM JSON output isn't 100% schema-reliable, even with explicit
  instructions.** We caught a live case where the model returned
  `"suggestd_fix"` instead of `"suggested_fix"` - a single misspelled key that
  would have silently broken our downstream parsing. Fixed with a defensive
  normalization layer that maps known key variants back to the expected
  schema, rather than trusting the model's output blindly.

## Team

- Abhimoy Mukherjee — AI/diagnosis logic, AWS infrastructure, GitHub Actions automation
- [Teammate 1] — Lambda handler, deployment guide, SAM template
- [Teammate 2] — Frontend

## Local Setup

```bash
pip install -r requirements.txt
aws configure  # needs Bedrock invoke permissions
python3 src/diagnose.py sample_logs/02_missing_env_var_crash.log
```