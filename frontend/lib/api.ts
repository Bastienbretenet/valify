const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type ApiError = { detail?: string | { msg?: string }[] };

export function getErrorMessage(err: unknown, fallback: string): string {
  const e = err as ApiError;
  if (Array.isArray(e?.detail)) return (e.detail[0] as { msg?: string })?.msg ?? fallback;
  return (e?.detail as string) ?? fallback;
}

export async function apiFetch<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  if (res.status === 401) {
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw error;
  }
  if (res.status === 204) return null as T;
  return res.json();
}

// Auth
export const authRegister = (body: { full_name: string; email: string; password: string; organization_name: string }) =>
  apiFetch("/auth/register", { method: "POST", body: JSON.stringify(body) });

export const authLogin = (body: { email: string; password: string }) =>
  apiFetch("/auth/login", { method: "POST", body: JSON.stringify(body) });

export const authLogout = () =>
  apiFetch("/auth/logout", { method: "POST" });

export const authMe = () =>
  apiFetch<{ id: string; email: string; full_name: string; org_id: string }>("/auth/me");

// Projects
export type Project = { id: string; name: string; slug: string; description: string | null; created_at: string };

export const getProjects = () => apiFetch<Project[]>("/projects");
export const createProject = (body: { name: string; description?: string }) =>
  apiFetch<Project>("/projects", { method: "POST", body: JSON.stringify(body) });
export const getProject = (slug: string) => apiFetch<Project>(`/projects/${slug}`);
export const deleteProject = (slug: string) =>
  apiFetch(`/projects/${slug}`, { method: "DELETE" });

// Calls
export type Call = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  expected_fields: Record<string, unknown>;
  return_schema: Record<string, unknown>;
  system_prompt: string | null;
  created_at: string;
};

export const getCalls = (projectSlug: string) =>
  apiFetch<Call[]>(`/projects/${projectSlug}/calls`);
export const createCall = (projectSlug: string, body: Partial<Call>) =>
  apiFetch<Call>(`/projects/${projectSlug}/calls`, { method: "POST", body: JSON.stringify(body) });
export const updateCall = (projectSlug: string, callSlug: string, body: Partial<Call>) =>
  apiFetch<Call>(`/projects/${projectSlug}/calls/${callSlug}`, { method: "PUT", body: JSON.stringify(body) });
export const deleteCall = (projectSlug: string, callSlug: string) =>
  apiFetch(`/projects/${projectSlug}/calls/${callSlug}`, { method: "DELETE" });
export const testCall = (projectSlug: string, callSlug: string, prompt: string) =>
  apiFetch<Record<string, unknown>>(`/projects/${projectSlug}/calls/${callSlug}/test`, {
    method: "POST",
    body: JSON.stringify({ prompt }),
  });

// Org settings
export const LLM_MODELS = [
    "mistralai/ministral-8b-2512",
    "google/gemini-2.0-flash-lite-001"
] as const;
export type LlmModel = (typeof LLM_MODELS)[number];

export const getOrgSettings = () => apiFetch<{ llm_model: string }>("/tokens/settings");
export const updateOrgSettings = (llm_model: string) =>
  apiFetch<{ llm_model: string }>("/tokens/settings", { method: "PATCH", body: JSON.stringify({ llm_model }) });

// Tokens
export type ApiToken = {
  id: string;
  name: string;
  last_used_at: string | null;
  is_active: boolean;
  created_at: string;
};
export type ApiTokenCreated = ApiToken & { token: string };

export const getTokens = () => apiFetch<ApiToken[]>("/tokens");
export const createToken = (body: { name: string }) =>
  apiFetch<ApiTokenCreated>("/tokens", { method: "POST", body: JSON.stringify(body) });
export const deleteToken = (id: string) =>
  apiFetch(`/tokens/${id}`, { method: "DELETE" });
