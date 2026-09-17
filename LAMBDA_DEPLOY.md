# Deploy Doctor - Lambda Deployment Guide

This wraps `diagnose.py`'s `diagnose_log()` function behind an API, so the
frontend (or a GitHub webhook) can POST a log and get back a diagnosis.

## Files involved
- `diagnose.py` - the core Bedrock logic (owned by [teammate doing AI/prompt work])
- `lambda_handler.py` - thin wrapper that adapts it for API Gateway (this file)

## Step 1: Package the Lambda deployment
Lambda needs boto3 bundled if you're not using the AWS-provided runtime that
already includes it (Python 3.12+ runtimes on Lambda DO include boto3 by
default, so you may not even need to bundle it - check by testing first).

```bash
mkdir lambda_package
cp src/diagnose.py src/lambda_handler.py lambda_package/
cd lambda_package
zip -r ../deploy_doctor_lambda.zip .
```

## Step 2: Create the Lambda function (console)
1. AWS Console -> Lambda -> Create function
2. Runtime: Python 3.12 (or latest available)
3. Region: ap-south-1 (Mumbai) - MUST match where Bedrock access is set up
4. Upload `deploy_doctor_lambda.zip` under Code source
5. Set the Handler to: `lambda_handler.lambda_handler`

## Step 3: IAM permissions
The Lambda's execution role needs Bedrock invoke permissions. Attach the
`AmazonBedrockFullAccess` policy to the Lambda's execution role (found under
Configuration -> Permissions -> Role name -> opens IAM -> Add permissions).

## Step 4: Increase timeout
Default Lambda timeout is 3 seconds - too short for an LLM call.
Configuration -> General configuration -> Edit -> set Timeout to 30 seconds.

## Step 5: Set up API Gateway
1. API Gateway -> Create API -> HTTP API (simpler than REST API for this)
2. Add integration -> Lambda -> select your function
3. Add route: POST /diagnose
4. Deploy -> note the Invoke URL, e.g. https://abc123.execute-api.ap-south-1.amazonaws.com

## Step 6: Test it
```bash
curl -X POST https://<your-invoke-url>/diagnose \
  -H "Content-Type: application/json" \
  -d '{"log_content": "paste a sample log here"}'
```

You should get back the same JSON diagnosis shape the local script produces.

## Notes for the frontend teammate
- Endpoint: POST /diagnose
- Request body: `{"log_content": "<raw log text>"}`
- Success response (200): `{"category": ..., "root_cause": ..., "evidence": ..., "suggested_fix": ..., "confidence": ...}`
- Error response (400/500): `{"error": "...", "detail": "..."}`
- CORS is already enabled in the Lambda response headers, so browser fetch() calls should work directly.
