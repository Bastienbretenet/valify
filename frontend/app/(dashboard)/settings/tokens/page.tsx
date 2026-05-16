"use client";

import { useEffect, useState } from "react";
import {
  getTokens, createToken, deleteToken,
  getOrgSettings, updateOrgSettings,
  getErrorMessage,
  LLM_MODELS,
  type ApiToken, type ApiTokenCreated,
} from "@/lib/api";

export default function TokensPage() {
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [llmModel, setLlmModel] = useState<string>("");
  const [savingModel, setSavingModel] = useState(false);
  const [modelSaved, setModelSaved] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [newToken, setNewToken] = useState<ApiTokenCreated | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Promise.all([getTokens(), getOrgSettings()])
      .then(([t, s]) => { setTokens(t); setLlmModel(s.llm_model); })
      .catch(() => setError("Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  async function handleModelChange(model: string) {
    setLlmModel(model);
    setSavingModel(true);
    setModelSaved(false);
    try {
      await updateOrgSettings(model);
      setModelSaved(true);
      setTimeout(() => setModelSaved(false), 2000);
    } finally {
      setSavingModel(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setCreating(true);
    try {
      const token = await createToken({ name });
      setNewToken(token);
      setTokens((prev) => [token, ...prev]);
      setShowForm(false);
      setName("");
    } catch (err: unknown) {
      setFormError(getErrorMessage(err, "Failed to create token"));
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string, tokenName: string) {
    if (!confirm(`Revoke token "${tokenName}"?`)) return;
    await deleteToken(id).catch(() => {});
    setTokens((prev) => prev.filter((t) => t.id !== id));
    if (newToken?.id === id) setNewToken(null);
  }

  async function handleCopy() {
    if (!newToken) return;
    await navigator.clipboard.writeText(newToken.token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h2 className="text-lg font-medium mb-1">LLM Model</h2>
        <p className="text-text-muted text-sm mb-3">Model used for all validation calls in your organization.</p>
        <div className="flex items-center gap-3">
          <select
            value={llmModel}
            onChange={(e) => handleModelChange(e.target.value)}
            disabled={savingModel || loading}
            className="border border-border rounded-md px-3 py-2 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
          >
            {LLM_MODELS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          {savingModel && <span className="text-xs text-text-muted">Saving…</span>}
          {modelSaved && <span className="text-xs text-green-600">Saved</span>}
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">API Tokens</h1>
          <p className="text-text-muted text-sm mt-1">
            Use these tokens to authenticate calls to{" "}
            <code className="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">POST /v1/validate</code>
          </p>
        </div>
        <button
          onClick={() => { setShowForm((v) => !v); setNewToken(null); }}
          className="bg-primary hover:bg-primary-hover text-white rounded-md px-4 py-2 text-sm font-medium transition-colors"
        >
          {showForm ? "Cancel" : "New token"}
        </button>
      </div>

      {newToken && (
        <div className="border border-green-200 bg-green-50 rounded-lg p-4 mb-6">
          <p className="text-sm font-medium text-green-800 mb-2">
            Token created — copy it now, it won't be shown again.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 font-mono text-xs bg-white border border-green-200 rounded px-3 py-2 overflow-x-auto">
              {newToken.token}
            </code>
            <button
              onClick={handleCopy}
              className="shrink-0 border border-green-300 rounded-md px-3 py-2 text-xs font-medium hover:bg-green-100 transition-colors"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="border border-border rounded-lg p-5 mb-6 flex flex-col gap-4 bg-surface-muted"
        >
          <div className="flex flex-col gap-1">
            <label htmlFor="token-name" className="text-sm font-medium">
              Token name
            </label>
            <input
              id="token-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-surface"
              placeholder="production"
            />
          </div>
          {formError && (
            <p className="text-sm text-danger bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {formError}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={creating}
              className="bg-primary hover:bg-primary-hover text-white rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
            >
              {creating ? "Creating…" : "Create"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="border border-border rounded-md px-4 py-2 text-sm font-medium hover:bg-border transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading && <p className="text-text-muted text-sm">Loading…</p>}
      {error && <p className="text-danger text-sm">{error}</p>}

      {!loading && !error && tokens.length === 0 && (
        <div className="border border-border rounded-lg p-10 text-center text-text-muted text-sm">
          No tokens yet.
        </div>
      )}

      {tokens.length > 0 && (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 pr-4 font-medium text-text-muted">Name</th>
              <th className="text-left py-2 pr-4 font-medium text-text-muted">Status</th>
              <th className="text-left py-2 pr-4 font-medium text-text-muted">Last used</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {tokens.map((t) => (
              <tr key={t.id} className="border-b border-border last:border-0">
                <td className="py-3 pr-4 font-medium">{t.name}</td>
                <td className="py-3 pr-4">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      t.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-surface-muted text-text-muted"
                    }`}
                  >
                    {t.is_active ? "Active" : "Revoked"}
                  </span>
                </td>
                <td className="py-3 pr-4 text-text-muted">
                  {t.last_used_at
                    ? new Date(t.last_used_at).toLocaleDateString()
                    : "Never"}
                </td>
                <td className="py-3 text-right">
                  <button
                    onClick={() => handleDelete(t.id, t.name)}
                    className="text-text-muted hover:text-danger transition-colors"
                  >
                    Revoke
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
