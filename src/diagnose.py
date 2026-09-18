import boto3
import json
import sys
import argparse
import time

REGION = "ap-south-1"
MODEL_ID = "apac.amazon.nova-lite-v1:0"

SYSTEM_PROMPT = """You are Deploy Doctor, an expert DevOps diagnostician. You will be given raw \
deployment/build/runtime logs from a failed deployment. Your job is to:

1. Identify the ROOT CAUSE of the failure (not just what error appeared, but WHY it happened)
2. Classify the failure into one category: build_failure, missing_config, port_conflict, \
health_check_failure, resource_limit, dependency_conflict, or other
3. Propose a SPECIFIC, ACTIONABLE fix - not generic advice. If you can suggest an exact \
config change, command, or code fix, do so.
4. Rate your confidence (high/medium/low) in this diagnosis based on how clear the logs are.
5. If (and ONLY if) your confidence is "high" AND the fix can be fully expressed as a \
single environment variable change, also propose an auto-fix. This applies whenever the \
correct fix is either adding a new environment variable (e.g. a missing API key or config \
value) or changing the value of an existing one (e.g. resolving a port conflict by picking \
a different port). It does NOT apply to fixes that require code changes, dependency version \
changes, infrastructure/resource changes, or anything that can't be expressed as one \
environment variable name and value. If these conditions aren't met, set auto_fix to null.

Respond ONLY in valid JSON with this exact structure, no other text:
{
  "category": "<one of the categories above>",
  "root_cause": "<1-2 sentence plain-English explanation of WHY this happened>",
  "evidence": "<the specific log line(s) that point to this cause>",
  "suggested_fix": "<specific, actionable fix - include exact commands/config/code where possible>",
  "confidence": "<high|medium|low>",
  "auto_fix": {"env_var_name": "<NAME>", "action": "<add|update>", "value": "<the value to set>"} or null
}"""

def _normalize_diagnosis(d: dict) -> dict:
    key_aliases = {
        "suggestd_fix": "suggested_fix",
        "suggest_fix": "suggested_fix",
        "suggestedfix": "suggested_fix",
        "fix": "suggested_fix",
        "rootcause": "root_cause",
        "root-cause": "root_cause",
        "cause": "root_cause",
    }
    for wrong_key, correct_key in key_aliases.items():
        if wrong_key in d and correct_key not in d:
            d[correct_key] = d.pop(wrong_key)

    defaults = {
        "category": "other",
        "root_cause": "N/A",
        "evidence": "N/A",
        "suggested_fix": "N/A",
        "confidence": "low",
        "auto_fix": None,
    }
    for key, default_value in defaults.items():
        d.setdefault(key, default_value)

    if isinstance(d.get("auto_fix"), dict):
        af = d["auto_fix"]
        if "placeholder_value" in af and "value" not in af:
            af["value"] = af.pop("placeholder_value")
        af.setdefault("action", "add")
        af.setdefault("value", "")
        if "env_var_name" not in af:
            d["auto_fix"] = None

    return d


def diagnose_log(log_content: str, max_retries: int = 3) -> dict:
    client = boto3.client("bedrock-runtime", region_name=REGION)

    body = {
        "system": [{"text": SYSTEM_PROMPT}],
        "messages": [
            {
                "role": "user",
                "content": [{"text": f"Here is the deployment failure log:\n\n{log_content}"}],
            }
        ],
        "inferenceConfig": {"maxTokens": 1000, "temperature": 0.3},
    }

    last_error = None
    for attempt in range(1, max_retries + 1):
        try:
            response = client.invoke_model(
                modelId=MODEL_ID,
                body=json.dumps(body),
                contentType="application/json",
                accept="application/json",
            )
            break
        except client.exceptions.ThrottlingException as e:
            last_error = e
            if attempt < max_retries:
                wait = 2 ** attempt
                print(f"  [retry {attempt}/{max_retries}] Throttled, waiting {wait}s...")
                time.sleep(wait)
                continue
            raise
    else:
        raise last_error
    response_body = json.loads(response["body"].read())
    raw_text = response_body["output"]["message"]["content"][0]["text"]
    cleaned = raw_text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("```")[1]
        if cleaned.startswith("json"):
            cleaned = cleaned[4:]
    cleaned = cleaned.strip()

    try:
        return _normalize_diagnosis(json.loads(cleaned))
    except json.JSONDecodeError:
        return {
            "category": "other",
            "root_cause": "Could not parse model response as JSON",
            "evidence": "",
            "suggested_fix": "",
            "confidence": "low",
            "auto_fix": None,
            "_raw_response": raw_text,
        }


def print_diagnosis(diagnosis: dict, log_filename: str):
    print(f"\n{'=' * 60}")
    print(f"  Deploy Doctor Diagnosis: {log_filename}")
    print(f"{'=' * 60}")
    print(f"  Category:    {diagnosis.get('category', 'unknown')}")
    print(f"  Confidence:  {diagnosis.get('confidence', 'unknown')}")
    print(f"\n  Root Cause:\n    {diagnosis.get('root_cause', 'N/A')}")
    print(f"\n  Evidence:\n    {diagnosis.get('evidence', 'N/A')}")
    print(f"\n  Suggested Fix:\n    {diagnosis.get('suggested_fix', 'N/A')}")
    if "_raw_response" in diagnosis:
        print(f"\n  [!] Raw model response (JSON parse failed):\n{diagnosis['_raw_response']}")
    print(f"{'=' * 60}\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Diagnose a failed deployment log using Bedrock")
    parser.add_argument("logfile", help="Path to the deployment log file")
    args = parser.parse_args()

    with open(args.logfile, "r") as f:
        log_content = f.read()

    print(f"Sending {args.logfile} to Bedrock for diagnosis...")
    diagnosis = diagnose_log(log_content)
    print_diagnosis(diagnosis, args.logfile)