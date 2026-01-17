'use client';

import React from 'react';
import Link from 'next/link';

interface SubPainPoint {
    slug: string;
    title: string;
    description: string;
    demandScore: number;
    progressScore: number;
    tags: string[];
}

interface SubPainPointsListProps {
    subPainPoints: SubPainPoint[];
    parentSlug: string;
}

export default function SubPainPointsTabs({ subPainPoints, parentSlug }: SubPainPointsListProps) {
    return (
        <div>
            {/* Add Button */}
            <div className="flex justify-end mb-4">
                <Link
                    href={`/blog/pain-points/${parentSlug}/add-sub-pain-point`}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Sub Pain Point
                </Link>
            </div>

            {/* Sub Pain Points List */}
            {subPainPoints.length > 0 ? (
                <div className="space-y-3">
                    {subPainPoints.map((sub) => (
                        <Link 
                            key={sub.slug} 
                            href={`/blog/pain-points/${parentSlug}/sub/${sub.slug}`}
                            className="block"
                        >
                            <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden hover:border-accent-indigo hover:shadow-md transition-all">
                                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                        {sub.title}
                                    </span>
                                    <div className="flex items-center gap-3">
                                        <div className="flex gap-2">
                                            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                                Demand: {sub.demandScore}/10
                                            </span>
                                            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                                                Progress: {sub.progressScore}/10
                                            </span>
                                        </div>
                                        <svg 
                                            className="w-5 h-5 text-slate-400"
                                            fill="none" 
                                            viewBox="0 0 24 24" 
                                            stroke="currentColor"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-center">
                    <p className="text-slate-500 italic">No sub pain points yet.</p>
                </div>
            )}
        </div>
    );
}
