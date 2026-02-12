'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type React from 'react';
import { useState } from 'react';

export default function NewPainPointPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    inconvenience: '',
    workaround: '',
    limitation: '',
    demandScore: 5,
    progressScore: 0,
    tags: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Process tags
      const tagsArray = formData.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const payload = {
        ...formData,
        tags: tagsArray,
        demandScore: Number(formData.demandScore),
        progressScore: Number(formData.progressScore),
      };

      const res = await fetch('/api/pain-points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create pain point');
      }

      // Success
      router.push('/blog/pain-points');
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
          Add Pain Point
        </h1>
        <Link
          href="/blog/pain-points"
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
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            required
            value={formData.title}
            onChange={handleChange}
            placeholder="I cannot..."
            className="focus:border-accent-indigo focus:ring-accent-indigo w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>

        <div>
          <label
            className="mb-1 block text-sm font-medium"
            style={{ color: 'var(--text-primary)' }}
          >
            How does it inconvenience you?
          </label>
          <textarea
            name="inconvenience"
            rows={3}
            value={formData.inconvenience}
            onChange={handleChange}
            placeholder="I have to..."
            className="focus:border-accent-indigo focus:ring-accent-indigo w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>

        <div>
          <label
            htmlFor="workaround"
            className="mb-1 block text-sm font-medium"
            style={{ color: 'var(--text-primary)' }}
          >
            Workaround
          </label>
          <textarea
            id="workaround"
            name="workaround"
            rows={3}
            value={formData.workaround}
            onChange={handleChange}
            placeholder="I have done..."
            className="focus:border-accent-indigo focus:ring-accent-indigo w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>

        <div>
          <label
            htmlFor="limitation"
            className="mb-1 block text-sm font-medium"
            style={{ color: 'var(--text-primary)' }}
          >
            Limitation
          </label>
          <textarea
            id="limitation"
            name="limitation"
            rows={3}
            value={formData.limitation}
            onChange={handleChange}
            placeholder="I haven't fixed this because..."
            className="focus:border-accent-indigo focus:ring-accent-indigo w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label
              className="mb-1 block text-sm font-medium"
              style={{ color: 'var(--text-primary)' }}
            >
              How much do YOU want to a solution this Pain Point? (1-10)
            </label>
            <input
              type="number"
              name="demandScore"
              min="1"
              max="10"
              value={formData.demandScore}
              onChange={handleChange}
              className="focus:border-accent-indigo focus:ring-accent-indigo w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label
              className="mb-1 block text-sm font-medium"
              style={{ color: 'var(--text-primary)' }}
            >
              Progress Score (0-10)
            </label>
            <input
              type="number"
              name="progressScore"
              min="0"
              max="10"
              value={formData.progressScore}
              onChange={handleChange}
              className="focus:border-accent-indigo focus:ring-accent-indigo w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div>
          <label
            className="mb-1 block text-sm font-medium"
            style={{ color: 'var(--text-primary)' }}
          >
            Tags (comma separated)
          </label>
          <input
            type="text"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            placeholder="ux, performance, bug"
            className="focus:border-accent-indigo focus:ring-accent-indigo w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-accent-indigo rounded-md px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save Pain Point'}
          </button>
        </div>
      </form>
    </div>
  );
}
