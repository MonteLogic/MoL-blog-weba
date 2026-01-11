'use client';

import React, { useTransition } from 'react';
import { revalidatePainPoints } from '../../actions';
import { useRouter } from 'next/navigation';

export default function RefreshButton() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleRefresh = () => {
    startTransition(async () => {
      try {
        await revalidatePainPoints();
        router.refresh();
      } catch (error) {
        console.error("Failed to refresh:", error); 
      }
    });
  };

  return (
    <button
      onClick={handleRefresh}
      disabled={isPending}
      className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto"
    >
      <svg
        className={`h-4 w-4 ${isPending ? 'animate-spin' : ''}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
      {isPending ? 'Refreshing...' : 'Refresh'}
    </button>
  );
}
