import React from 'react';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import { auth, currentUser } from '@clerk/nextjs';
import { notFound } from 'next/navigation';

interface PainPointData {
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in-progress' | 'resolved';
  createdAt: string;
  tags: string[];
  details?: string;
  stepsToReproduce?: string[];
  proposedSolution?: string;
}

async function getPainPoint(slug: string): Promise<PainPointData | null> {
  try {
    const filePath = path.join(process.cwd(), 'MoL-blog-content/posts/categorized/pain-points', `${slug}.json`);
    
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error reading pain point:', error);
    return null;
  }
}

function getSeverityBadgeClass(severity: string): string {
  switch (severity) {
    case 'critical':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    case 'high':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'low':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  }
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'resolved':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    case 'in-progress':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    case 'open':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  }
}

export default async function PainPointDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const { userId } = auth();
  let userRole: string | undefined;

  if (userId) {
    try {
      const user = await currentUser();
      userRole = user?.privateMetadata?.role as string;
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  }

  const painPoint = await getPainPoint(params.slug);

  if (!painPoint) {
    notFound();
  }

  const isAdmin = userRole === 'admin' || userRole === 'Admin';
  
  // GitHub URL for editing this pain point
  const editOnGitHubUrl = `https://github.com/MonteLogic/MoL-blog-content/edit/main/posts/categorized/pain-points/${params.slug}.json`;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <Link 
          href="/blog/pain-points"
          className="back-link text-accent-indigo"
        >
          ← Back to Pain Points
        </Link>
      </div>

      <article className="card-blog">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {painPoint.title}
          </h1>
          <div className="flex gap-2 flex-shrink-0">
            <span className={`px-3 py-1.5 text-sm font-medium rounded-full ${getSeverityBadgeClass(painPoint.severity)}`}>
              {painPoint.severity}
            </span>
            <span className={`px-3 py-1.5 text-sm font-medium rounded-full ${getStatusBadgeClass(painPoint.status)}`}>
              {painPoint.status}
            </span>
          </div>
        </div>

        {painPoint.createdAt && (
          <div className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
            Created: {new Date(painPoint.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
        )}

        {painPoint.description && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Description</h2>
            <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {painPoint.description}
            </p>
          </div>
        )}

        {painPoint.details && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Details</h2>
            <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {painPoint.details}
            </p>
          </div>
        )}

        {painPoint.stepsToReproduce && painPoint.stepsToReproduce.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Steps to Reproduce</h2>
            <ol className="list-decimal list-inside space-y-1" style={{ color: 'var(--text-secondary)' }}>
              {painPoint.stepsToReproduce.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
          </div>
        )}

        {painPoint.proposedSolution && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Proposed Solution</h2>
            <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {painPoint.proposedSolution}
            </p>
          </div>
        )}

        {painPoint.tags && painPoint.tags.length > 0 && (
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
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
          </div>
        )}

        {/* Admin Area */}
        {isAdmin && (
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-4">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Admin</span>
              <a
                href={editOnGitHubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md border border-gray-700 bg-gray-800/50 px-3 py-1.5 text-sm text-gray-300 transition-colors hover:border-gray-600 hover:bg-gray-800 hover:text-white"
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
                Edit on GitHub
              </a>
            </div>
          </div>
        )}
      </article>
    </div>
  );
}
