import { DiagnosisResponse } from '../types/diagnosis';

const API_ENDPOINT = 'https://x89gw8o4t3.execute-api.ap-south-1.amazonaws.com/diagnose';

export async function requestDiagnosis(logContent: string): Promise<DiagnosisResponse> {
  const trimmed = logContent.trim();
  if (!trimmed) {
    throw new Error("Missing or empty 'log_content' field. Please paste or upload a deployment log.");
  }

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ log_content: trimmed }),
    });

    if (!response.ok) {
      let message = `Server responded with status ${response.status}`;
      try {
        const errJson = await response.json();
        if (errJson.error) {
          message = errJson.error;
        }
      } catch {
        // Fallback to HTTP status text
      }
      throw new Error(message);
    }

    const data = (await response.json()) as DiagnosisResponse;
    return data;
  } catch (err: any) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error("Unable to reach the diagnosis API. Please check your network connection.");
    }
    throw err;
  }
}
