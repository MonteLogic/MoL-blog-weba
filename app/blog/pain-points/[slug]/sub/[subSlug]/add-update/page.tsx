'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AddSubPainPointUpdatePage({
    params,
}: {
    params: { slug: string; subSlug: string };
}) {
    const router = useRouter();
    const [formData, setFormData] = useState({
        description: '',
        progress: 0,
        demand: 0,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'description' ? value : Number(value)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            const res = await fetch(`/api/pain-points/${params.slug}/sub/${params.subSlug}/updates`, {
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

            // Success - redirect back to sub pain point detail page
            router.push(`/blog/pain-points/${params.slug}/sub/${params.subSlug}`);
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
                <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Add Update</h1>
                <Link href={`/blog/pain-points/${params.slug}/sub/${params.subSlug}`} className="text-accent-indigo hover:underline">
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
                        Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        name="description"
                        rows={4}
                        required
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Describe what changed or what progress was made..."
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-accent-indigo focus:outline-none focus:ring-1 focus:ring-accent-indigo dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                            Progress Delta (-10 to +10)
                        </label>
                        <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                            Positive = progress made, Negative = setback
                        </p>
                        <input
                            type="number"
                            name="progress"
                            min="-10"
                            max="10"
                            value={formData.progress}
                            onChange={handleChange}
                            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-accent-indigo focus:outline-none focus:ring-1 focus:ring-accent-indigo dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                            Demand Delta (-10 to +10)
                        </label>
                        <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                            Positive = more urgent, Negative = less urgent
                        </p>
                        <input
                            type="number"
                            name="demand"
                            min="-10"
                            max="10"
                            value={formData.demand}
                            onChange={handleChange}
                            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-accent-indigo focus:outline-none focus:ring-1 focus:ring-accent-indigo dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        />
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="rounded-md bg-green-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isSubmitting ? 'Saving...' : 'Save Update'}
                    </button>
                </div>
            </form>
        </div>
    );
}
