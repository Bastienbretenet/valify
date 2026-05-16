"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { z } from "zod";
import {
  getProject,
  getCalls,
  createCall,
  updateCall,
  deleteCall,
  deleteProject,
  testCall,
  getErrorMessage,
  type Project,
  type Call,
} from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

const DEFAULT_EXPECTED_FIELDS = `{"field_name":{"type":"string","required":true,"description":"..."}}`;
const FIXED_RETURN_SCHEMA = `{"valid":"boolean","missing":"array<string>","extracted":"object","suggested_reply":"string|null","confidence":"float"}`;

function isValidJson(s: string): boolean {
  try {
    JSON.parse(s);
    return true;
  } catch {
    return false;
  }
}

const callSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  expected_fields: z.string().refine(isValidJson, { message: "Must be valid JSON" }),
  return_schema: z.string(),
  system_prompt: z.string().optional(),
});

type CallFormValues = z.infer<typeof callSchema>;
type FieldErrors = Partial<Record<keyof CallFormValues, string>>;

function emptyForm(): CallFormValues {
  return {
    name: "",
    description: "",
    expected_fields: DEFAULT_EXPECTED_FIELDS,
    return_schema: FIXED_RETURN_SCHEMA,
    system_prompt: "",
  };
}

function callToForm(c: Call): CallFormValues {
  return {
    name: c.name,
    description: c.description ?? "",
    expected_fields: JSON.stringify(c.expected_fields, null, 2),
    return_schema: FIXED_RETURN_SCHEMA,
    system_prompt: c.system_prompt ?? "",
  };
}

function validateForm(values: CallFormValues): FieldErrors {
  const result = callSchema.safeParse(values);
  if (result.success) return {};
  const errors: FieldErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0] as keyof CallFormValues;
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}

interface CallFormProps {
  initial: CallFormValues;
  submitLabel: string;
  submitting: boolean;
  serverError: string | null;
  onSubmit: (values: CallFormValues) => void;
  onCancel: () => void;
}

function CallForm({ initial, submitLabel, submitting, serverError, onSubmit, onCancel }: CallFormProps) {
  const [values, setValues] = useState<CallFormValues>(initial);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [jsonTouched, setJsonTouched] = useState<Record<"expected_fields" | "return_schema", boolean>>({
    expected_fields: false,
    return_schema: false,
  });

  function set(field: keyof CallFormValues) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setValues((p) => ({ ...p, [field]: e.target.value }));
  }

  function setJson(field: "expected_fields" | "return_schema") {
    return (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setValues((p) => ({ ...p, [field]: e.target.value }));
      setJsonTouched((p) => ({ ...p, [field]: true }));
    };
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateForm(values);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setJsonTouched({ expected_fields: true, return_schema: true });
      return;
    }
    setErrors({});
    onSubmit(values);
  }

  const inputCls =
    "border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-surface w-full";
  const errorCls = "text-xs text-danger mt-1";

  function jsonFieldCls(field: "expected_fields" | "return_schema") {
    if (!jsonTouched[field]) return `${inputCls} font-mono text-xs`;
    const valid = isValidJson(values[field]);
    return `${inputCls} font-mono text-xs ${
      valid
        ? "border-green-500 focus:ring-green-500"
        : "border-red-400 focus:ring-red-400"
    }`;
  }

  return (
    <form onSubmit={handleSubmit} className="border border-border rounded-lg p-5 mb-6 flex flex-col gap-4 bg-surface-muted">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Name</label>
        <input
          type="text"
          required
          value={values.name}
          onChange={set("name")}
          className={inputCls}
          placeholder="validate-booking"
        />
        {errors.name && <p className={errorCls}>{errors.name}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">
          Description <span className="text-text-muted font-normal">(optional)</span>
        </label>
        <textarea
          rows={2}
          value={values.description}
          onChange={set("description")}
          className={inputCls}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">
          Expected fields <span className="text-text-muted font-normal text-xs">(JSON)</span>
        </label>
        <textarea
          rows={4}
          value={values.expected_fields}
          onChange={setJson("expected_fields")}
          className={jsonFieldCls("expected_fields")}
          spellCheck={false}
        />
        {jsonTouched.expected_fields && !isValidJson(values.expected_fields) && (
          <p className={errorCls}>Invalid JSON</p>
        )}
        {errors.expected_fields && isValidJson(values.expected_fields) && (
          <p className={errorCls}>{errors.expected_fields}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">
          Return schema <span className="text-text-muted font-normal text-xs">(fixed)</span>
        </label>
        <textarea
          rows={4}
          value={FIXED_RETURN_SCHEMA}
          readOnly
          disabled
          className={`${inputCls} font-mono text-xs opacity-50 cursor-not-allowed`}
          spellCheck={false}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">
          System prompt <span className="text-text-muted font-normal">(optional)</span>
        </label>
        <textarea
          rows={4}
          value={values.system_prompt}
          onChange={set("system_prompt")}
          className={inputCls}
          placeholder="You are a validation assistant…"
        />
      </div>

      {serverError && (
        <p className="text-sm text-danger bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {serverError}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="bg-primary hover:bg-primary-hover text-white rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
        >
          {submitting ? `${submitLabel}…` : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="border border-border rounded-md px-4 py-2 text-sm font-medium hover:bg-border transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function CallTestPanel({ projectSlug, call, onClose }: { projectSlug: string; call: Call; onClose: () => void }) {
  const [prompt, setPrompt] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleTest(e: React.FormEvent) {
    e.preventDefault();
    setRunning(true);
    setResult(null);
    setError(null);
    try {
      const res = await testCall(projectSlug, call.slug, prompt);
      setResult(res);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Test failed"));
    } finally {
      setRunning(false);
    }
  }

  const inputCls =
    "border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-surface w-full";

  return (
    <form onSubmit={handleTest} className="border border-border rounded-lg p-5 mb-2 flex flex-col gap-4 bg-surface-muted">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-medium text-sm">{call.name}</span>
          <span className="ml-2 text-xs text-text-muted font-mono">{call.slug}</span>
        </div>
        <button type="button" onClick={onClose} className="text-sm text-text-muted hover:text-text transition-colors">
          ✕ Close
        </button>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">
          Test prompt <span className="text-text-muted font-normal text-xs">Client prompt to validate</span>
        </label>
        <textarea
          rows={4}
          required
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className={inputCls}
          placeholder="I want to book a flight from Paris to Tokyo on June 12th…"
        />
      </div>

      {error && (
        <p className="text-sm text-danger bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={running || !prompt.trim()}
          className="bg-primary hover:bg-primary-hover text-white rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
        >
          {running ? "Running…" : "Run test"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="border border-border rounded-md px-4 py-2 text-sm font-medium hover:bg-border transition-colors"
        >
          Cancel
        </button>
      </div>

      {result && (
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wide">Result</p>
          <pre className="bg-[#1e1e2e] text-[#cdd6f4] text-xs font-mono p-4 rounded-lg leading-relaxed whitespace-pre-wrap break-all">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </form>
  );
}

type TabId = "curl" | "python" | "javascript";

const TAB_LABELS: Record<TabId, string> = {
  curl: "cURL",
  python: "Python",
  javascript: "JavaScript",
};

function buildSnippet(tab: TabId, projectSlug: string, callSlug: string, apiUrl: string): string {
  const body = JSON.stringify(
    { api_token: "YOUR_API_TOKEN", project: projectSlug, call: callSlug, prompt: "Prompt to validate" },
    null,
    2
  );

  const bodyCompact = JSON.stringify({ api_token: "YOUR_API_TOKEN", project: projectSlug, call: callSlug, prompt: "Prompt to validate" });

  if (tab === "curl") {
    return `curl -X POST ${apiUrl}/v1/validate \\
  -H "Content-Type: application/json" \\
  -d '${bodyCompact}'`;
  }

  if (tab === "python") {
    return `import httpx

response = httpx.post(
    "${apiUrl}/v1/validate",
    json=${body
      .replace(/^/gm, "    ")
      .trim()},
)
print(response.json())`;
  }

  return `const response = await fetch("${apiUrl}/v1/validate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(${body.replace(/^/gm, "  ").trim()}),
});
const data = await response.json();
console.log(data);`;
}

function ApiUsageSection({ projectSlug, call }: { projectSlug: string; call: Call }) {
  const [activeTab, setActiveTab] = useState<TabId>("curl");
  const [copied, setCopied] = useState(false);
  const apiUrl = API_URL;

  const snippet = buildSnippet(activeTab, projectSlug, call.slug, apiUrl);

  const copy = useCallback(async () => {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [snippet]);

  return (
    <div className="mt-4 rounded-lg border border-border overflow-hidden">
      <div className="flex items-center justify-between bg-[#1e1e2e] px-4 py-2 border-b border-white/10">
        <div className="flex gap-1">
          {(Object.keys(TAB_LABELS) as TabId[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 text-xs rounded font-mono transition-colors ${
                activeTab === tab
                  ? "bg-white/15 text-white"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/80 transition-colors font-mono"
        >
          {copied ? (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              copied
            </>
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              copy
            </>
          )}
        </button>
      </div>
      <pre className="bg-[#1e1e2e] text-[#cdd6f4] text-xs font-mono p-4 leading-relaxed whitespace-pre-wrap break-all">
        {snippet}
      </pre>
      <div className="bg-[#1e1e2e] border-t border-white/10 px-4 py-2">
        <p className="text-xs text-white/30 font-mono">POST {apiUrl}/v1/validate</p>
      </div>
    </div>
  );
}

function formToPayload(values: CallFormValues): Partial<Call> {
  return {
    name: values.name,
    description: values.description || undefined,
    expected_fields: JSON.parse(values.expected_fields),
    return_schema: JSON.parse(FIXED_RETURN_SCHEMA),
    system_prompt: values.system_prompt || undefined,
  };
}

export default function ProjectDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [editingCallSlug, setEditingCallSlug] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const [testingCallSlug, setTestingCallSlug] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getProject(slug), getCalls(slug)])
      .then(([p, c]) => { setProject(p); setCalls(c); })
      .catch(() => setError("Failed to load project"))
      .finally(() => setLoading(false));
  }, [slug]);

  async function handleCreate(values: CallFormValues) {
    setCreateError(null);
    setCreating(true);
    try {
      const call = await createCall(slug, formToPayload(values));
      setCalls((prev) => [call, ...prev]);
      setShowCreateForm(false);
    } catch (err: unknown) {
      setCreateError(getErrorMessage(err, "Failed to create call"));
    } finally {
      setCreating(false);
    }
  }

  async function handleUpdate(callSlug: string, values: CallFormValues) {
    setUpdateError(null);
    setUpdating(true);
    try {
      const updated = await updateCall(slug, callSlug, formToPayload(values));
      setCalls((prev) => prev.map((c) => (c.slug === callSlug ? updated : c)));
      setEditingCallSlug(null);
    } catch (err: unknown) {
      setUpdateError(getErrorMessage(err, "Failed to update call"));
    } finally {
      setUpdating(false);
    }
  }

  async function handleDeleteCall(callSlug: string) {
    if (!confirm(`Delete call "${callSlug}"?`)) return;
    await deleteCall(slug, callSlug).catch(() => {});
    setCalls((prev) => prev.filter((c) => c.slug !== callSlug));
  }

  async function handleDeleteProject() {
    if (!confirm(`Delete project "${project?.name}"? This cannot be undone.`)) return;
    await deleteProject(slug).catch(() => {});
    router.push("/projects");
  }

  if (loading) return <p className="text-text-muted text-sm">Loading…</p>;
  if (error || !project) return <p className="text-danger text-sm">{error ?? "Project not found"}</p>;

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <button
          onClick={() => router.push("/dashboard/projects")}
          className="text-text-muted text-sm hover:text-text transition-colors mb-3"
        >
          ← Projects
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{project.name}</h1>
            <span className="text-xs font-mono text-text-muted">{project.slug}</span>
            {project.description && (
              <p className="text-sm text-text-muted mt-1">{project.description}</p>
            )}
          </div>
          <button onClick={handleDeleteProject} className="text-sm text-danger hover:underline">
            Delete project
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium">Calls</h2>
        <button
          onClick={() => { setShowCreateForm((v) => !v); setCreateError(null); }}
          className="bg-primary hover:bg-primary-hover text-white rounded-md px-4 py-2 text-sm font-medium transition-colors"
        >
          {showCreateForm ? "Cancel" : "New call"}
        </button>
      </div>

      {showCreateForm && (
        <CallForm
          initial={emptyForm()}
          submitLabel="Create"
          submitting={creating}
          serverError={createError}
          onSubmit={handleCreate}
          onCancel={() => { setShowCreateForm(false); setCreateError(null); }}
        />
      )}

      {calls.length === 0 && (
        <div className="border border-border rounded-lg p-10 text-center text-text-muted text-sm">
          No calls yet. Create your first one.
        </div>
      )}

      {calls.length > 0 && (
        <div className="flex flex-col gap-2">
          {calls.map((c) =>
            editingCallSlug === c.slug ? (
              <div key={c.id} className="border border-primary rounded-lg p-2">
                <CallForm
                  initial={callToForm(c)}
                  submitLabel="Save"
                  submitting={updating}
                  serverError={updateError}
                  onSubmit={(values) => handleUpdate(c.slug, values)}
                  onCancel={() => { setEditingCallSlug(null); setUpdateError(null); }}
                />
              </div>
            ) : testingCallSlug === c.slug ? (
              <div key={c.id} className="border border-border rounded-lg overflow-hidden">
                <CallTestPanel
                  projectSlug={slug}
                  call={c}
                  onClose={() => setTestingCallSlug(null)}
                />
              </div>
            ) : (
              <div key={c.id} className="border border-border rounded-lg overflow-hidden">
                <div className="px-5 py-4 flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">{c.name}</span>
                    <span className="ml-2 text-xs text-text-muted font-mono">{c.slug}</span>
                    {c.description && (
                      <p className="text-sm text-text-muted mt-1">{c.description}</p>
                    )}
                  </div>
                  <div className="flex gap-3 shrink-0 ml-4">
                    <button
                      onClick={() => setTestingCallSlug(c.slug)}
                      className="text-sm text-text-muted hover:text-text transition-colors"
                    >
                      Test
                    </button>
                    <button
                      onClick={() => { setEditingCallSlug(c.slug); setUpdateError(null); }}
                      className="text-sm text-text-muted hover:text-text transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCall(c.slug)}
                      className="text-sm text-text-muted hover:text-danger transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="px-5 pb-5">
                  <p className="text-xs text-text-muted mb-2 font-medium uppercase tracking-wide">Usage</p>
                  <ApiUsageSection projectSlug={slug} call={c} />
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
