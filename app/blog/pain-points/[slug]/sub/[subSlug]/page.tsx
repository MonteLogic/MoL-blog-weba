import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import YAML from 'yaml';

interface SubPainPointUpdate {
    file: string;
    description: string;
    date: string;
    demand?: number;
    progress?: number;
}

interface SubPainPoint {
    slug: string;
    title: string;
    description: string;
    demandScore: number;
    progressScore: number;
    tags: string[];
    updates: SubPainPointUpdate[];
}

async function getSubPainPoint(parentSlug: string, subSlug: string): Promise<SubPainPoint | null> {
    try {
        const owner = 'MonteLogic';
        const repo = 'MoL-blog-content';
        const basePath = `posts/categorized/pain-points/${parentSlug}/sub-pain-points`;

        const headers: HeadersInit = {
            'Accept': 'application/vnd.github.v3+json',
        };

        if (process.env.CONTENT_GH_TOKEN) {
            headers['Authorization'] = `Bearer ${process.env.CONTENT_GH_TOKEN}`;
        }

        // Try to fetch the sub pain point file
        const fileUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${basePath}/${subSlug}.yaml`;
        const res = await fetch(fileUrl, { headers, next: { revalidate: 60 } });

        if (!res.ok) {
            // Try .yml extension
            const ymlUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${basePath}/${subSlug}.yml`;
            const ymlRes = await fetch(ymlUrl, { headers, next: { revalidate: 60 } });
            if (!ymlRes.ok) return null;
            
            const ymlData = await ymlRes.json();
            const contentRes = await fetch(ymlData.download_url, { headers, next: { revalidate: 300 } });
            const content = await contentRes.text();
            const data = YAML.parse(content);
            
            return {
                slug: subSlug,
                title: data.title || 'Untitled',
                description: data.description || '',
                demandScore: parseInt(data.demandScore) || 0,
                progressScore: parseInt(data.progressScore) || 0,
                tags: data.tags || [],
                updates: [],
            };
        }

        const fileData = await res.json();
        const contentRes = await fetch(fileData.download_url, { headers, next: { revalidate: 300 } });
        const content = await contentRes.text();
        const data = YAML.parse(content);

        // Fetch updates for this sub pain point
        const updates: SubPainPointUpdate[] = [];
        try {
            const updatesUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${basePath}/${subSlug}/updates`;
            const updatesRes = await fetch(updatesUrl, { headers, next: { revalidate: 60 } });
            if (updatesRes.ok) {
                const updateFiles = await updatesRes.json();
                if (Array.isArray(updateFiles)) {
                    const updatePromises = updateFiles
                        .filter((f: any) => f.name.endsWith('.yaml') || f.name.endsWith('.yml'))
                        .map(async (f: any) => {
                            const uRes = await fetch(f.download_url, { headers, next: { revalidate: 300 } });
                            if (!uRes.ok) return null;
                            const uText = await uRes.text();
                            const uData = YAML.parse(uText);

                            return {
                                file: f.name,
                                description: uData.description || uData.content || '',
                                date: uData.date || new Date().toISOString(),
                                demand: uData.demand !== undefined ? parseFloat(uData.demand) : undefined,
                                progress: uData.progress !== undefined ? parseFloat(uData.progress) : undefined,
                            };
                        });

                    const fetchedUpdates = await Promise.all(updatePromises);
                    fetchedUpdates.forEach(u => {
                        if (u) updates.push(u);
                    });

                    updates.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                }
            }
        } catch (e) {
            // No updates folder
        }

        return {
            slug: subSlug,
            title: data.title || 'Untitled',
            description: data.description || '',
            demandScore: parseInt(data.demandScore) || 0,
            progressScore: parseInt(data.progressScore) || 0,
            tags: data.tags || [],
            updates,
        };
    } catch (error) {
        console.error('Error fetching sub pain point:', error);
        return null;
    }
}

export default async function SubPainPointDetailPage({
    params,
}: {
    params: { slug: string; subSlug: string };
}) {
    const subPainPoint = await getSubPainPoint(params.slug, params.subSlug);

    if (!subPainPoint) {
        notFound();
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <Link
                    href={`/blog/pain-points/${params.slug}`}
                    className="back-link text-accent-indigo"
                >
                    ← Back to Pain Point
                </Link>
            </div>

            <article className="card-blog">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                    <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1 block">Sub Pain Point</span>
                        <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                            {subPainPoint.title}
                        </h1>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                        <span className="px-3 py-1.5 text-sm font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                            Demand: {subPainPoint.demandScore}/10
                        </span>
                        <span className="px-3 py-1.5 text-sm font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                            Progress: {subPainPoint.progressScore}/10
                        </span>
                    </div>
                </div>

                {subPainPoint.description && (
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Description</h2>
                        <p className="leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>
                            {subPainPoint.description}
                        </p>
                    </div>
                )}

                {subPainPoint.tags && subPainPoint.tags.length > 0 && (
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700 mb-8">
                        <div className="flex flex-wrap gap-2">
                            {subPainPoint.tags.map((tag) => (
                                <span key={tag} className="tag-blog">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Updates Section */}
                <div className="mt-8 pt-8 border-t-2 border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Updates</h2>
                        <Link
                            href={`/blog/pain-points/${params.slug}/sub/${params.subSlug}/add-update`}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Update
                        </Link>
                    </div>

                    {subPainPoint.updates && subPainPoint.updates.length > 0 ? (
                        <div className="space-y-6">
                            {subPainPoint.updates.map((update, idx) => (
                                <div key={idx} className="relative pl-8 pb-6 border-l-2 border-slate-200 dark:border-slate-700 last:border-0 last:pb-0">
                                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-300 dark:bg-slate-600 ring-4 ring-white dark:ring-gray-900" />
                                    <div className="flex flex-wrap items-baseline gap-x-2 text-sm text-slate-500 dark:text-slate-400 mb-1">
                                        <span>{new Date(update.date).toLocaleDateString()}</span>
                                        {update.progress !== undefined && update.progress !== 0 && (
                                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${update.progress > 0 ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                                                Progress: {update.progress > 0 ? '+' : ''}{update.progress}
                                            </span>
                                        )}
                                        {update.demand !== undefined && update.demand !== 0 && (
                                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${update.demand > 0 ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'}`}>
                                                Demand: {update.demand > 0 ? '+' : ''}{update.demand}
                                            </span>
                                        )}
                                    </div>
                                    <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                        <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{update.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-slate-500 italic">No updates yet.</p>
                    )}
                </div>
            </article>
        </div>
    );
}
