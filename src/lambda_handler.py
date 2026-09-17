"""
Response (JSON):
{
    "category": "...",
    "root_cause": "...",
    "evidence": "...",
    "suggested_fix": "...",
    "confidence": "..."
}
"""

import json
from diagnose import diagnose_log


def lambda_handler(event, context):
    try:
        body = json.loads(event.get("body", "{}"))
    except json.JSONDecodeError:
        return _response(400, {"error": "Invalid JSON in request body"})

    log_content = body.get("log_content")
    if not log_content or not log_content.strip():
        return _response(400, {"error": "Missing or empty 'log_content' field"})

    try:
        diagnosis = diagnose_log(log_content)
        return _response(200, diagnosis)
    except Exception as e:
        print(f"Error diagnosing log: {e}")
        return _response(500, {"error": "Failed to diagnose log", "detail": str(e)})


def _response(status_code: int, body: dict):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
        "body": json.dumps(body),
    }
