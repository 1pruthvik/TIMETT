export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://tempus-backend-g36k.onrender.com").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly detail?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function friendlyApiError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401 || error.status === 403) return "Your session has expired. Please sign in again.";
    if (error.status === 409) return "This change conflicts with data that is already in use.";
    if (error.status && error.status >= 500) return "The scheduling server could not complete that request. Please try again.";
    return error.message;
  }
  return "Tempus cannot reach the scheduling server. Check that it is running, then try again.";
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init.headers },
    });
  } catch (error) {
    throw new ApiError("Tempus cannot reach the scheduling server.", undefined, error);
  }

  const contentType = response.headers.get("content-type") || "";
  const payload: unknown = contentType.includes("application/json")
    ? await response.json().catch(() => null)
    : await response.text().catch(() => "");

  if (!response.ok) {
    const detail = typeof payload === "object" && payload !== null && "detail" in payload
      ? (payload as { detail?: unknown }).detail
      : undefined;
    throw new ApiError(
      typeof detail === "string" ? detail : "Tempus could not complete that request.",
      response.status,
      detail,
    );
  }
  return payload as T;
}

export function institutionId(): number {
  if (typeof window === "undefined") return 1;
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return Number(user.institution_id) || 1;
  } catch {
    return 1;
  }
}
