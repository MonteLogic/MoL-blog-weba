'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ChangeEvent, FormEvent } from 'react';
import { useMemo, useState } from 'react';

type FormState = {
  project: string;
  description: string;
};

function slugifyProjectName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\x00-\x7F]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function NewProjectForm() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormState>({
    project: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const projectSlug = useMemo(
    () => slugifyProjectName(formData.project),
    [formData.project],
  );

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project: formData.project.trim(),
          description: formData.description.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create project');
      }

      router.push('/blog/projects');
      router.refresh();
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1
          className="text-3xl font-bold"
          style={{ color: 'var(--text-primary)' }}
        >
          Add Project
        </h1>
        <Link
          href="/blog/projects"
          className="text-accent-indigo hover:underline"
        >
          Cancel
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="project"
            className="mb-1 block text-sm font-medium"
            style={{ color: 'var(--text-primary)' }}
          >
            Project Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="project"
            id="project"
            required
            value={formData.project}
            onChange={handleChange}
            placeholder="Project name"
            className="focus:border-accent-indigo focus:ring-accent-indigo w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
          <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            Folder: posts/categorized/projects/{projectSlug || 'project-name'}
            /info.json
          </p>
        </div>

        <div>
          <label
            htmlFor="description"
            className="mb-1 block text-sm font-medium"
            style={{ color: 'var(--text-primary)' }}
          >
            Describe what you are doing in the project
          </label>
          <textarea
            name="description"
            id="description"
            rows={4}
            value={formData.description}
            onChange={handleChange}
            placeholder="Short summary of the project goals and work"
            className="focus:border-accent-indigo focus:ring-accent-indigo w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-accent-indigo rounded-md px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save Project'}
          </button>
        </div>
      </form>
    </div>
  );
}
