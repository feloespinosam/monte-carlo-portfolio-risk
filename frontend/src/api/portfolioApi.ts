import { API_BASE } from "../constants/portfolio";
import type {
  AnalysisRequestPayload,
  AnalysisResponse,
} from "../types/api";

const getErrorDetail = (payload: unknown): string | null => {
  if (!payload || typeof payload !== "object" || !("detail" in payload)) {
    return null;
  }

  const detail = (payload as { detail: unknown }).detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (
          item &&
          typeof item === "object" &&
          "msg" in item &&
          typeof (item as { msg: unknown }).msg === "string"
        ) {
          return (item as { msg: string }).msg;
        }
        return JSON.stringify(item);
      })
      .join("; ");
  }

  return null;
};

const parseApiError = async (response: Response): Promise<string> => {
  const body: unknown = await response.json().catch(() => null);
  const fallback = response.statusText || `HTTP ${response.status}`;
  return getErrorDetail(body) ?? fallback;
};

export async function analyzePortfolio(
  payload: AnalysisRequestPayload,
): Promise<AnalysisResponse> {
  const response = await fetch(`${API_BASE}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Analysis Error: ${await parseApiError(response)}`);
  }

  return response.json() as Promise<AnalysisResponse>;
}
