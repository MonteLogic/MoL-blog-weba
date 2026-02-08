'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface EditProjectPostFormProps {
  projectSlug: string;
  postSlug: string;
}

interface PostPayload {
  title: string;
  description?: string;
  date?: string;
  tags?: string[];
  status?: string;
  content: string;
  relativePath: string;
}

export default function EditProjectPostForm({
  projectSlug,
  postSlug,
}: EditProjectPostFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    tags: '',
    status: 'private',
    content: '',
  });
  const [relativePath, setRelativePath] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    const loadPost = async () => {
      try {
        const res = await fetch(
          `/api/projects/${projectSlug}/posts/${postSlug}`,
        );
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to load post');
        }
        const data = await res.json();
        const frontmatter = data.frontmatter || {};
        setFormData({
          title: frontmatter.title || '',
          description: frontmatter.description || '',
          date: frontmatter.date || '',
          tags: Array.isArray(frontmatter.tags)
            ? frontmatter.tags.join(', ')
            : '',
          status: frontmatter.status || 'private',
          content: data.content || '',
        });
        setRelativePath(data.relativePath);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Failed to load post');
      } finally {
        setIsLoading(false);
      }
    };

    loadPost();
  }, [projectSlug, postSlug]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
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
      const tagsArray = formData.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);

      const payload: PostPayload = {
        title: formData.title,
        description: formData.description,
        date: formData.date || undefined,
        tags: tagsArray,
        status: formData.status,
        content: formData.content,
        relativePath,
      };

      const res = await fetch(
        `/api/projects/${projectSlug}/posts/${postSlug}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update post');
      }

      router.push(`/blog/projects/${projectSlug}/${postSlug}`);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <p style={{ color: 'var(--text-secondary)' }}>Loading post...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1
          className="text-3xl font-bold"
          style={{ color: 'var(--text-primary)' }}
        >
          Edit Post
        </h1>
        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {currentTime.toLocaleString()}
        </div>
        <Link
          href={`/blog/projects/${projectSlug}/${postSlug}`}
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
            className="focus:border-accent-indigo focus:ring-accent-indigo w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>

        <div>
          <label
            className="mb-1 block text-sm font-medium"
            style={{ color: 'var(--text-primary)' }}
          >
            Description
          </label>
          <textarea
            name="description"
            rows={2}
            value={formData.description}
            onChange={handleChange}
            className="focus:border-accent-indigo focus:ring-accent-indigo w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label
              className="mb-1 block text-sm font-medium"
              style={{ color: 'var(--text-primary)' }}
            >
              Date
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="focus:border-accent-indigo focus:ring-accent-indigo w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label
              className="mb-1 block text-sm font-medium"
              style={{ color: 'var(--text-primary)' }}
            >
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="focus:border-accent-indigo focus:ring-accent-indigo w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
              <option value="private">Private</option>
              <option value="public">Public</option>
            </select>
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
            placeholder="nextjs, feature, update"
            className="focus:border-accent-indigo focus:ring-accent-indigo w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>

        <div>
          <label
            className="mb-1 block text-sm font-medium"
            style={{ color: 'var(--text-primary)' }}
          >
            Content
          </label>
          <textarea
            name="content"
            rows={10}
            value={formData.content}
            onChange={handleChange}
            className="focus:border-accent-indigo focus:ring-accent-indigo w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-accent-indigo rounded-md px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
