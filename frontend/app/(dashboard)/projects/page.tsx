"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getProjects, createProject, getErrorMessage, type Project } from "@/lib/api";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    getProjects()
      .then(setProjects)
      .catch(() => setError("Failed to load projects"))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setCreating(true);
    try {
      const project = await createProject({ name: newName, description: newDesc || undefined });
      setProjects((prev) => [project, ...prev]);
      setShowForm(false);
      setNewName("");
      setNewDesc("");
    } catch (err: unknown) {
      setFormError(getErrorMessage(err, "Failed to create project"));
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Projects</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-primary hover:bg-primary-hover text-white rounded-md px-4 py-2 text-sm font-medium transition-colors"
        >
          {showForm ? "Cancel" : "New project"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="border border-border rounded-lg p-5 mb-6 flex flex-col gap-4 bg-surface-muted"
        >
          <div className="flex flex-col gap-1">
            <label htmlFor="proj-name" className="text-sm font-medium">
              Name
            </label>
            <input
              id="proj-name"
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-surface"
              placeholder="my-project"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="proj-desc" className="text-sm font-medium">
              Description <span className="text-text-muted font-normal">(optional)</span>
            </label>
            <input
              id="proj-desc"
              type="text"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-surface"
              placeholder="What this project validates"
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

      {!loading && !error && projects.length === 0 && (
        <div className="border border-border rounded-lg p-10 text-center text-text-muted text-sm">
          No projects yet. Create your first one.
        </div>
      )}

      {projects.length > 0 && (
        <div className="flex flex-col gap-2">
          {projects.map((p) => (
            <Link
              key={p.id}
              href={`/projects/${p.slug}`}
              className="border border-border rounded-lg px-5 py-4 hover:border-primary transition-colors group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium group-hover:text-primary transition-colors">
                    {p.name}
                  </span>
                  <span className="ml-2 text-xs text-text-muted font-mono">{p.slug}</span>
                </div>
                <span className="text-text-muted text-sm">→</span>
              </div>
              {p.description && (
                <p className="text-sm text-text-muted mt-1">{p.description}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
