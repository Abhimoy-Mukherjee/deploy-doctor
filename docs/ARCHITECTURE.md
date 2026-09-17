# Architecture

## Flow

1. A deployment fails in GitHub Actions (build failure, crash, health check failure, etc.)
2. A GitHub webhook fires on workflow failure, sending the run details to our webhook listener
3. The webhook listener (`webhooks/github_webhook.py`) fetches the actual failure logs
   via the GitHub API
4. It forwards the log content to our API Gateway endpoint (`POST /diagnose`)
5. API Gateway invokes the `deploy-doctor-diagnose` Lambda function
6. The Lambda function (`src/diagnose.py`) sends the log to Amazon Bedrock with a
   structured system prompt, requesting a JSON diagnosis
7. Bedrock (currently Amazon Nova Lite; migrating to Claude once payment setup is
   finalized) returns a structured diagnosis: category, root cause, evidence,
   suggested fix, and confidence level
8. The diagnosis is returned to the webhook listener, which posts it as a comment
   on the failed workflow run / commit (and, for high-confidence fixes, opens a
   draft PR)

## Why Lambda + API Gateway (not a long-running server)

Deployment failures are bursty and unpredictable — most of the time there's zero
traffic. A serverless architecture means we pay nothing when idle and scale
automatically during a burst of failures (e.g. a bad commit that breaks multiple
services at once), which fits the actual usage pattern of this problem far better
than a persistently running server would.

## Why Bedrock over a direct API call to a model provider

Using Bedrock keeps everything inside the AWS account boundary — no separate API
key management, unified IAM permissions, and access to swap models (Nova, Claude,
etc.) without changing our integration code, just the model ID.

## Region choice

All resources are deployed in `ap-south-1` (Mumbai) for lower latency from India
and full Bedrock model availability.

## Known limitations / honest tradeoffs

- Currently using Amazon Nova Lite instead of Claude due to an AWS Marketplace
  payment instrument issue specific to RuPay cards (documented in our learnings) —
  this is being resolved and is a one-line model ID swap once fixed
- No persistent diagnosis history yet (DynamoDB integration planned but not
  built due to time constraints)
- Confidence-gated auto-PR creation is a stretch goal, not guaranteed to ship
