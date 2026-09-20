# Deploy Doctor

**An AI agent that diagnoses failed deployments and, where it's genuinely safe to, fixes them automatically through a real pull request.**

Built for the First Commit hackathon (AWS-sponsored), Ship It track.

---

## The problem

Every developer has lost time to a cryptic deployment failure: a wall of raw logs, no obvious root cause, and ten or fifteen minutes of manual digging before you find the actual fix. It happens on every team, at every scale, and almost all of that digging is still done by hand today.

## What Deploy Doctor does

Deploy Doctor watches a CI/CD pipeline (GitHub Actions right now). The moment a deployment fails, it:

1. Pulls the failure log automatically, with no copy-pasting into a chat window
2. Diagnoses the root cause using Amazon Bedrock, classifying the failure and pointing to the exact evidence in the log
3. Proposes a specific, actionable fix rather than generic advice
4. If the fix is a safe, single environment-variable change and the model is genuinely confident, opens a pull request with the fix already applied
5. In every other case, opens a GitHub issue instead, laying out the diagnosis for a human to review, rather than guessing at a fix it isn't sure about

A standalone frontend also lets anyone paste a log and get the same diagnosis on demand, without needing a CI pipeline set up at all.

## Is this a new idea?

No, tools like CodeRabbit's pipeline remediation, TierZero, and a handful of "self-healing CI" agents already work in this space, and most of them are paid products. We're not claiming to have invented AI-assisted failure diagnosis.

What we tried to do differently:

- Focus specifically on deployment and infrastructure failures: missing env vars, port conflicts, OOM kills, failed health checks, container crash loops, rather than the generic code or test failures most existing tools are built around
- Build an explicit, conservative automation policy. Deploy Doctor only opens a PR when confidence is high and the fix is a single, safe environment-variable change. Every other diagnosis, whether it's a build failure, a dependency conflict, a resource limit issue, or just an ambiguous log, gets surfaced to a human through an issue instead of a guess. We think knowing when not to automate matters as much as the automation itself, and we made that policy visible rather than just a claim in a README.
- Build it end to end on Amazon Bedrock, Lambda, API Gateway, and AWS Amplify, including working through several real, undocumented rough edges in that stack along the way.

## Why this isn't just pasting an error into an AI chat

| | Copy-pasting into an AI chat | Deploy Doctor |
|---|---|---|
| Trigger | A human has to notice and remember to check | Fires automatically the instant CI fails |
| Output | A chat response someone has to read and manually apply | A structured diagnosis, and for safe cases, an actual PR |
| Judgment | The human decides every time whether to trust it | The system has an explicit, auditable rule for what it will and won't touch on its own |
| Where it lives | A tab someone has to remember to open | Directly inside the GitHub workflow that failed |

## Architecture

```
GitHub Actions (deploy step fails)
        |
        v
  Diagnose step (times itself) ---> API Gateway ---> Lambda (diagnose.py)
        |                                                   |
        |                                                   v
        |                                           Amazon Bedrock
        |                                        (Amazon Nova Lite)
        |                                                   |
        v                                                   v
  Workflow summary                             Structured diagnosis
  (always shown, with                    (category, root cause, evidence,
   elapsed time vs. the                   suggested fix, confidence, auto_fix)
   10-15 min manual baseline)
        |
        v
  High confidence + safe env-var fix?
        |                    |
       yes                   no
        |                    |
        v                    v
  branch, patch config,   open a GitHub issue
  commit, open a PR       with the full diagnosis
  (needs human review,    for a human to review
   never auto-merges)
```

A separate, standalone frontend (built with React and Vite, hosted on AWS Amplify) calls the same API directly, for diagnosis on demand outside of any CI pipeline.

## Tech stack

- AWS Lambda hosts the diagnosis logic
- API Gateway exposes it as a public HTTP endpoint, `POST /diagnose`
- Amazon Bedrock handles the actual model inference, currently on Amazon Nova Lite
- AWS Amplify hosts the frontend
- GitHub Actions handles failure detection, triggers diagnosis, and opens the PR or issue via the `gh` CLI

## Live demo

- API endpoint: `https://x89gw8o4t3.execute-api.ap-south-1.amazonaws.com/diagnose`
- Frontend: `https://main.d15jp270cb0pij.amplifyapp.com/`
- Example automated runs: see the Actions tab of this repo. `Demo Deploy Pipeline` shows the env-var fix path, and `Demo Deploy Pipeline (Port Conflict)` shows the port-value fix path, both including the resulting pull requests.

## How someone else would actually use this


- Diagnosis works for anyone, right away. It's a plain HTTP API, so any CI system, not just GitHub Actions, can POST a failure log to it and get a structured diagnosis back.
- Auto-PR creation is demonstrated on our own repo and is currently coupled to our demo app's config file path (`demo-app/.env.example`). Generalizing that, for instance by packaging it as a reusable GitHub Action that takes a config file path as input, is the natural next step, but it isn't built yet.
- To try diagnosis-only on your own repo today, copy the "Diagnose failure" step out of `.github/workflows/demo-deploy.yml`, point `DEPLOY_DOCTOR_API_URL` at our endpoint (or your own deployment of this code), and point it at your own failing step's log output instead of our staged one.

## Project structure

```
deploy-doctor/
├── src/
│   ├── diagnose.py                    Core Bedrock diagnosis logic
│   └── lambda_handler.py              API Gateway to Lambda adapter
├── frontend_ui/                       React + Vite frontend, deployed on Amplify
├── .github/workflows/
│   ├── demo-deploy.yml                Staged env-var failure, diagnosis, auto-PR or issue
│   └── demo-deploy-port-conflict.yml  Staged port conflict, same flow
├── demo-app/
│   └── .env.example                   Target file for the demo's auto-fix PRs
├── infrastructure/
│   └── template.yaml                  AWS SAM template for Lambda and API Gateway
├── sample_logs/                       Test fixtures covering six real failure categories
├── docs/
│   ├── ARCHITECTURE.md
│   └── FRONTEND_GUIDE.md              API contract used to build the frontend
├── LAMBDA_DEPLOY.md                   Manual Lambda deployment notes
└── README.md
```

## What we learned

Honestly, this was as much a weekend of learning AWS the hard way as it was building a feature.

Bedrock's model access flow changed recently. AWS retired the old manual "Model access" request step, so models are available automatically now, but newer models need an inference profile ID, a region-prefixed model identifier like `apac.amazon.nova-lite-v1:0`, to be invoked on demand. The bare model ID doesn't work anymore, and it cost us a few failed calls to figure that out.

AWS Marketplace subscriptions and RuPay cards don't get along. Anthropic's models on Bedrock go through AWS Marketplace, which needs a payment method capable of cross-border billing. With only a RuPay card on file, every invocation silently tried and failed to subscribe, which we only found by noticing eleven terminated Marketplace subscriptions sitting in the account. We worked around it by switching to Amazon's own Nova model, which doesn't route through Marketplace at all.

`continue-on-error: true` quietly breaks `failure()`. We first gated our diagnosis step on `if: failure()`, and it never ran, because `continue-on-error` suppresses the job-level failure signal that `failure()` checks. Switching to the specific step's own `outcome` fixed it.

GitHub Actions has two separate permission gates for opening pull requests: the `permissions` block in the workflow file, and a repo-level setting, "Allow GitHub Actions to create and approve pull requests," that's off by default even once the workflow file grants write access. Missing either one fails silently in slightly different ways.

LLM output isn't fully reliable even when you ask for strict JSON. We caught the model returning `suggestd_fix` instead of `suggested_fix` in one live response, a single misspelled key that would have quietly broken everything downstream. We fixed the immediate case with a normalization layer that maps known key variants back to the expected schema, but a related and more interesting bug showed up later: our own markdown-fence-stripping code broke whenever the model's suggested fix contained its own nested code block, because we were splitting on every triple-backtick in the text instead of just the outer one.

The more important version of that same lesson came from testing the frontend against an OOM failure. The same log, sent twice, came back once with `auto_fix: null` and once with an auto-fix suggesting an environment variable called `MEMORY_LIMIT`, which wouldn't actually change anything in a real deployment, since memory limits are platform configuration, not application environment variables. That told us two things: the model isn't perfectly consistent even on classification-style decisions, and instructing it correctly in the prompt isn't enough on its own for something this consequential. We lowered the temperature to reduce the inconsistency, and, more importantly, added a hard rule in code that forces `auto_fix` to null for the resource-limit category regardless of what the model returns. We'd rather have a system that behaves predictably in the cases that matter than one that trusts the model's judgment all the way down.

## Team

- Abhimoy Mukherjee: AI and diagnosis logic, AWS infrastructure, GitHub Actions automation
- Vidya Kumari: Lambda handler, deployment guide, SAM template
- Aayod Kurothe: Frontend

## Local setup

```bash
pip install -r requirements.txt
aws configure  # needs Bedrock invoke permissions
python3 src/diagnose.py sample_logs/02_missing_env_var_crash.log
```