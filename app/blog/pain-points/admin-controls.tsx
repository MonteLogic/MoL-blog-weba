'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import RefreshButton from './refresh-button';
import { checkIsAdmin } from './actions';

export default function AdminControls() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkIsAdmin()
      .then(setIsAdmin)
      .catch((err) => {
        console.error('Failed to check admin status:', err);
        setIsAdmin(false);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || !isAdmin) return null;

  const template = `# Pain Point Title - be descriptive
title: "I cannot [insert text here]"

# Pain Point Description
# What is the Pain Point in detail?
how does it inconvience you: "I have to [insert text here]"

what have you done as a workaround: "I have [insert text here]."

how does this pain point limit what you want to do: "I am limited to/by [insert text here]."  


# Pain Point personal affect. 
on a scale of 1 - 10 how badly would you want the solution to your paint point: [insert number 1-10 here]

# Progress on pain Point, 0 - 10
how much progress have the tech you or someone you're working has gone to fixing the pain point: [insert number 0-10]

# Tags for categorization (e.g., ux, performance, bug, feature-request)
tags:
  - [tag1]
  - [tag2]
  - [tag3]
`;
  const addPainPointUrl = `https://github.com/MonteLogic/MoL-blog-content/new/main/posts/categorized/pain-points?filename=pain-point-name-1.yaml&value=${encodeURIComponent(
    template,
  )}`;

  return (
    <div
      className="mb-8 flex flex-col gap-4 rounded-lg border border-slate-200 p-4 dark:border-slate-700 md:flex-row md:items-center"
      style={{ backgroundColor: 'var(--bg-secondary)' }}
    >
      <span
        className="mb-2 text-xs font-semibold uppercase tracking-wider md:mb-0"
        style={{ color: 'var(--text-muted)' }}
      >
        Admin Area
      </span>

      <div className="flex w-full flex-col gap-4 sm:flex-row md:w-auto">
        <Link
          href="/blog/pain-points/new"
          className="inline-flex items-center justify-center gap-2 rounded-md border border-indigo-600 bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Pain Point
        </Link>

        <a
          href={addPainPointUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-600 bg-transparent px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <svg
            className="h-4 w-4"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              clipRule="evenodd"
            />
          </svg>
          Add Pain Point on GitHub
        </a>
      </div>

      <div className="flex w-full justify-end md:ml-auto md:w-auto">
        <RefreshButton />
      </div>
    </div>
  );
}
