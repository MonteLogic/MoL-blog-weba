'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AddUpdateForm({ slug }: { slug: string }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    description: '',
    progress: 0,
    demand: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'description' ? value : Number(value),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/pain-points/${slug}/updates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add update');
      }

      // Success - redirect back to detail page
      router.push(`/blog/pain-points/${slug}`);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Something went wrong');
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
          Add Update
        </h1>
        <Link
          href={`/blog/pain-points/${slug}`}
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
            className="mb-1 block text-sm font-medium"
            style={{ color: 'var(--text-primary)' }}
          >
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            name="description"
            rows={4}
            required
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe what changed or what progress was made..."
            className="focus:border-accent-indigo focus:ring-accent-indigo w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label
              className="mb-1 block text-sm font-medium"
              style={{ color: 'var(--text-primary)' }}
            >
              Progress Delta (-10 to +10)
            </label>
            <p className="mb-2 text-xs" style={{ color: 'var(--text-muted)' }}>
              Positive = progress made, Negative = setback
            </p>
            <input
              type="number"
              name="progress"
              min="-10"
              max="10"
              value={formData.progress}
              onChange={handleChange}
              className="focus:border-accent-indigo focus:ring-accent-indigo w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label
              className="mb-1 block text-sm font-medium"
              style={{ color: 'var(--text-primary)' }}
            >
              Demand Delta (-10 to +10)
            </label>
            <p className="mb-2 text-xs" style={{ color: 'var(--text-muted)' }}>
              Positive = more urgent, Negative = less urgent
            </p>
            <input
              type="number"
              name="demand"
              min="-10"
              max="10"
              value={formData.demand}
              onChange={handleChange}
              className="focus:border-accent-indigo focus:ring-accent-indigo w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-green-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save Update'}
          </button>
        </div>
      </form>
    </div>
  );
}
