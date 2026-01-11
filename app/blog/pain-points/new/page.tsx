
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Process tags
      const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(Boolean);

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
    <div className="max-w-2xl mx-auto py-10 px-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Add Pain Point</h1>
        <Link href="/blog/pain-points" className="text-accent-indigo hover:underline">
          Cancel
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            required
            value={formData.title}
            onChange={handleChange}
            placeholder="I cannot..."
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-accent-indigo focus:outline-none focus:ring-1 focus:ring-accent-indigo dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
            How does it inconvenience you?
          </label>
          <textarea
            name="inconvenience"
            rows={3}
            value={formData.inconvenience}
            onChange={handleChange}
            placeholder="I have to..."
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-accent-indigo focus:outline-none focus:ring-1 focus:ring-accent-indigo dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
            Workaround
          </label>
          <textarea
            name="workaround"
            rows={3}
            value={formData.workaround}
            onChange={handleChange}
            placeholder="I have done..."
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-accent-indigo focus:outline-none focus:ring-1 focus:ring-accent-indigo dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>

        <div>
           <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
            Limitation
          </label>
          <textarea
            name="limitation"
            rows={3}
            value={formData.limitation}
            onChange={handleChange}
            placeholder="I am limited by..."
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-accent-indigo focus:outline-none focus:ring-1 focus:ring-accent-indigo dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
              How much do YOU want to a solution this Pain Point? (1-10)
            </label>
            <input
              type="number"
              name="demandScore"
              min="1"
              max="10"
              value={formData.demandScore}
              onChange={handleChange}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-accent-indigo focus:outline-none focus:ring-1 focus:ring-accent-indigo dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
              Progress Score (0-10)
            </label>
            <input
              type="number"
              name="progressScore"
              min="0"
              max="10"
              value={formData.progressScore}
              onChange={handleChange}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-accent-indigo focus:outline-none focus:ring-1 focus:ring-accent-indigo dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
            Tags (comma separated)
          </label>
          <input
            type="text"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            placeholder="ux, performance, bug"
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-accent-indigo focus:outline-none focus:ring-1 focus:ring-accent-indigo dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-accent-indigo px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Saving...' : 'Save Pain Point'}
          </button>
        </div>
      </form>
    </div>
  );
}
