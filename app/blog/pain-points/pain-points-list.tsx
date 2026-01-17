'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';

interface PainPoint {
  slug: string;
  title: string;
  inconvenience: string;
  workaround: string;
  limitation: string;
  demandScore: number;
  progressScore: number;
  createdAt: string;
  lastUpdated?: string;
  tags: string[];
}

export default function PainPointsList({ initialPainPoints }: { initialPainPoints: PainPoint[] }) {
  const [sortBy, setSortBy] = useState<'date' | 'demand' | 'progress' | 'lastUpdated'>('date');

  const sortedPainPoints = useMemo(() => {
    return [...initialPainPoints].sort((a, b) => {
      if (sortBy === 'demand') {
        const diff = b.demandScore - a.demandScore;
        if (diff !== 0) return diff;
      }
      if (sortBy === 'progress') {
         const diff = b.progressScore - a.progressScore;
         if (diff !== 0) return diff;
      }
      if (sortBy === 'lastUpdated') {
        // Prioritize items that have updates
        const aHasUpdate = !!a.lastUpdated;
        const bHasUpdate = !!b.lastUpdated;
        
        // If one has update and other doesn't, prioritize the one with update
        if (aHasUpdate && !bHasUpdate) return -1;
        if (!aHasUpdate && bHasUpdate) return 1;
        
        // Both have updates - sort by most recent
        if (aHasUpdate && bHasUpdate) {
          const aTime = new Date(a.lastUpdated!).getTime();
          const bTime = new Date(b.lastUpdated!).getTime();
          return bTime - aTime;
        }
        
        // Neither has updates - fall through to createdAt sort
      }
      // Default to date sort (newest first) as secondary or primary sort
      if (a.createdAt && b.createdAt) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return 0;
    });
  }, [initialPainPoints, sortBy]);

  return (
    <div>
      <div className="flex flex-wrap justify-end gap-2 mb-6">
        <span className="text-sm font-medium self-center mr-2" style={{ color: 'var(--text-muted)' }}>Sort by:</span>
        <button
          onClick={() => setSortBy('lastUpdated')}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            sortBy === 'lastUpdated'
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-900'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          Last Updated
        </button>
        <button
          onClick={() => setSortBy('demand')}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            sortBy === 'demand'
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-900'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          Most Demand
        </button>
        <button
          onClick={() => setSortBy('progress')}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            sortBy === 'progress'
              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-900'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          Most Progress
        </button>
        <button
          onClick={() => setSortBy('date')}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            sortBy === 'date'
              ? 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          Newest
        </button>
      </div>

      <div className="grid gap-6">
        {sortedPainPoints.map((painPoint) => (
          <Link 
            key={painPoint.slug} 
            href={`/blog/pain-points/${painPoint.slug}`}
            className="block group"
          >
            <article className="card-blog h-full hover:border-accent-purple/50 hover:shadow-md transition-all">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-3">
                <h2 className="text-xl font-semibold group-hover:text-accent-purple transition-colors" style={{ color: 'var(--text-primary)' }}>
                  {painPoint.title}
                </h2>
                <div className="flex gap-2 flex-shrink-0 self-start sm:self-auto">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                    Demand: {painPoint.demandScore}/10
                  </span>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                    Progress: {painPoint.progressScore}/10
                  </span>
                </div>
              </div>
              
              {painPoint.inconvenience && (
                <div className="mb-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Inconvenience</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {painPoint.inconvenience}
                  </p>
                </div>
              )}

              {painPoint.limitation && (
                <div className="mb-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Limitation</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {painPoint.limitation}
                  </p>
                </div>
              )}
              
              {painPoint.workaround && (
                <div className="mb-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Workaround</h3>
                  <p className="text-sm leading-relaxed italic" style={{ color: 'var(--text-secondary)' }}>
                    {painPoint.workaround}
                  </p>
                </div>
              )}
              
              {painPoint.createdAt && (
                <div className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                  {new Date(painPoint.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              )}

              {painPoint.tags && painPoint.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {painPoint.tags.map((tag) => (
                    <span
                      key={tag}
                      className="tag-blog"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-4 flex items-center text-accent-indigo text-sm font-medium opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                View Details <span className="ml-1">→</span>
              </div>
            </article>
          </Link>
        ))}

        {sortedPainPoints.length === 0 && (
          <div className="col-span-full text-center py-12 rounded-xl border border-slate-200 dark:border-slate-700" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
            <p>No pain points found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
