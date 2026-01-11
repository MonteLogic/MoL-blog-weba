import React from 'react';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import { auth, currentUser } from '@clerk/nextjs';

interface PainPoint {
  slug: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in-progress' | 'resolved';
  createdAt: string;
  tags: string[];
}

async function getPainPoints(): Promise<PainPoint[]> {
  try {
    const painPointsDir = path.join(process.cwd(), 'MoL-blog-content/posts/categorized/pain-points');
    
    if (!fs.existsSync(painPointsDir)) {
      console.log('Pain points directory not found:', painPointsDir);
      return [];
    }

    const files = fs.readdirSync(painPointsDir).filter(file => file.endsWith('.json'));
    
    const painPoints: PainPoint[] = [];
    
    for (const file of files) {
      try {
        const filePath = path.join(painPointsDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(content);
        
        // Generate slug from filename (remove .json extension)
        const slug = file.replace('.json', '');
        
        painPoints.push({
          slug,
          title: data.title || 'Untitled Pain Point',
          description: data.description || '',
          severity: data.severity || 'medium',
          status: data.status || 'open',
          createdAt: data.createdAt || '',
          tags: data.tags || [],
        });
      } catch (parseError) {
        console.error(`Error parsing pain point file ${file}:`, parseError);
      }
    }

    // Sort by date (newest first)
    return painPoints.sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return 0;
    });
  } catch (error) {
    console.error('Error reading pain points:', error);
    return [];
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

export default async function PainPointsPage() {
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

  const painPoints = await getPainPoints();
  const isAdmin = userRole === 'admin' || userRole === 'Admin';
  
  // GitHub URL for creating a new pain point with pre-filled template
  const today = new Date().toISOString().split('T')[0];
  const template = JSON.stringify({
    title: "",
    description: "",
    severity: "medium",
    status: "open",
    createdAt: today,
    tags: []
  }, null, 4);
  const addPainPointUrl = `https://github.com/MonteLogic/MoL-blog-content/new/main/posts/categorized/pain-points?filename=new-pain-point.json&value=${encodeURIComponent(template)}`;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Pain Points</h1>
        <Link 
          href="/blog"
          className="back-link text-accent-indigo"
        >
          ← Back to Blog
        </Link>
      </div>

      {/* Admin Area */}
      {isAdmin && (
        <div className="flex items-center gap-4 rounded-lg p-4 mb-8 border border-slate-200 dark:border-slate-700" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Admin Area</span>
          <a
            href={addPainPointUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md border border-green-600 bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Pain Point
          </a>
        </div>
      )}

      {/* Pain Points List */}
      <div className="grid gap-6">
        {painPoints.map((painPoint) => (
          <Link 
            key={painPoint.slug} 
            href={`/blog/pain-points/${painPoint.slug}`}
            className="block group"
          >
            <article className="card-blog h-full hover:border-accent-purple/50 hover:shadow-md transition-all">
              <div className="flex items-start justify-between gap-4 mb-3">
                <h2 className="text-xl font-semibold group-hover:text-accent-purple transition-colors" style={{ color: 'var(--text-primary)' }}>
                  {painPoint.title}
                </h2>
                <div className="flex gap-2 flex-shrink-0">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityBadgeClass(painPoint.severity)}`}>
                    {painPoint.severity}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(painPoint.status)}`}>
                    {painPoint.status}
                  </span>
                </div>
              </div>
              
              {painPoint.description && (
                <p className="text-sm mb-3 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {painPoint.description}
                </p>
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

        {painPoints.length === 0 && (
          <div className="col-span-full text-center py-12 rounded-xl border border-slate-200 dark:border-slate-700" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
            <p>No pain points found.</p>
            {isAdmin && (
              <p className="mt-2 text-sm">
                <a href={addPainPointUrl} target="_blank" rel="noopener noreferrer" className="text-accent-indigo hover:underline">
                  Add your first pain point →
                </a>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
