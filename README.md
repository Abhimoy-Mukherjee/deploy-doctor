# Deploy Doctor 🩺

**An AI agent that diagnoses failed deployments and proposes fixes — automatically, the moment they happen.**

Built for the First Commit hackathon (AWS-sponsored) | Ship It track

---

## The Problem

Every developer has lost time to a cryptic deployment failure — a wall of raw logs,
no clear root cause, and 15-20 minutes of manual digging through Stack Overflow
before finding the fix. This happens constantly on every team, at every scale,
and it's almost entirely manual today.

## What Deploy Doctor Does

Deploy Doctor watches your CI/CD pipeline. The moment a deployment fails, it:

1. **Automatically pulls the failure logs** — no copy-pasting into a chat window
2. **Diagnoses the root cause** using a foundation model on Amazon Bedrock, trained
   via prompt engineering to classify failures and cite specific evidence
3. **Proposes a specific, actionable fix** — not generic advice
4. **[In progress] Opens a draft PR** with the fix for high-confidence diagnoses

## Why This Isn't Just "Paste an Error Into Claude"

This is the question every judge should ask, so we're answering it directly:

| | Copy-pasting into an AI chat | Deploy Doctor |
|---|---|---|
| **Trigger** | A human has to notice the failure and remember to check | Fires automatically the instant CI fails |
| **Context** | Only what the human bothers to paste | Pulls the actual log + relevant config automatically |
| **Output** | A chat response a human must read and manually apply | Structured diagnosis + (planned) an actual draft PR |
| **Memory** | None — every incident starts from zero | [Planned] Tracks recurring failure patterns per repo over time |
| **Where it lives** | A tab someone has to remember to open | Directly in your GitHub workflow |

The value isn't the AI call — it's the automation and integration around it that
a one-off chat conversation can never replicate.

## Architecture

```
GitHub Actions (failed workflow)
        |
        v
  GitHub Webhook  --->  API Gateway  --->  Lambda (diagnose.py)
                                                  |
                                                  v
                                          Amazon Bedrock
                                       (Nova Lite / Claude)
                                                  |
                                                  v
                                        Structured diagnosis
                                       (category, root cause,
                                        evidence, fix, confidence)
```

## Tech Stack

- **AWS Lambda** — hosts the diagnosis logic
- **API Gateway** — public HTTP endpoint (`POST /diagnose`)
- **Amazon Bedrock** — foundation model inference (Nova Lite, migrating to Claude)
- **GitHub Actions + Webhooks** — automatic failure detection and log retrieval
- **[Planned] DynamoDB** — diagnosis history and failure pattern tracking

## Live Demo

- **API endpoint:** `https://x89gw8o4t3.execute-api.ap-south-1.amazonaws.com/diagnose`
- **Demo video:** _link here once recorded_

## Project Structure

```
deploy-doctor/
├── src/
│   ├── diagnose.py          # Core Bedrock diagnosis logic
│   └── lambda_handler.py    # API Gateway <-> Lambda adapter
├── webhooks/
│   └── github_webhook.py    # GitHub Actions failure listener
├── infrastructure/
│   └── template.yaml        # AWS SAM template (Lambda + API Gateway)
├── sample_logs/             # Test fixtures covering 6 real failure categories
├── docs/
│   └── ARCHITECTURE.md
└── README.md
```

## What We Learned

_Fill this in as you go — judges score this explicitly. Be specific:
first Bedrock integration, first Lambda deploy, debugging AWS Marketplace
subscription issues, region/inference-profile quirks, etc._

## Team

- [Your name] — AI/core diagnosis logic, AWS infra
- [Teammate] — Frontend
- [Teammate] — (backup/other contributions)

## Local Setup

```bash
pip install -r requirements.txt
aws configure
python3 src/diagnose.py sample_logs/02_missing_env_var_crash.log
```
