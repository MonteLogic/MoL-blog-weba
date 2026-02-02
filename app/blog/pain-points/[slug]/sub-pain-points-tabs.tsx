'use client';

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

export default function SubPainPointsTabs({
  subPainPoints,
  parentSlug,
}: SubPainPointsListProps) {
  return (
    <div>
      {/* Add Button */}
      <div className="mb-4 flex justify-end">
        <Link
          href={`/blog/pain-points/${parentSlug}/add-sub-pain-point`}
          className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <title>Add</title>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
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
              <div className="hover:border-accent-indigo overflow-hidden rounded-lg border border-slate-200 transition-all hover:shadow-md dark:border-slate-700">
                <div className="flex items-center justify-between bg-slate-50 p-4 transition-colors hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800">
                  <span
                    className="font-medium"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {sub.title}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-2">
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                        Demand: {sub.demandScore}/10
                      </span>
                      <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                        Progress: {sub.progressScore}/10
                      </span>
                    </div>
                    <svg
                      className="h-5 w-5 text-slate-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <title>View sub pain point details</title>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center dark:border-slate-700 dark:bg-slate-800/50">
          <p className="italic text-slate-500">No sub pain points yet.</p>
        </div>
      )}
    </div>
  );
}
