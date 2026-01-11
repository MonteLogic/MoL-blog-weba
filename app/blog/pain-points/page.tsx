import React from 'react';
import Link from 'next/link';
import { auth, currentUser } from '@clerk/nextjs';
import YAML from 'yaml';

interface PainPoint {
  slug: string;
  title: string;
  inconvenience: string;
  workaround: string;
  limitation: string;
  demandScore: number;
  progressScore: number;
  createdAt: string;
  tags: string[];
}

async function getPainPoints(): Promise<PainPoint[]> {
  try {
    const owner = 'MonteLogic';
    const repo = 'MoL-blog-content';
    const path = 'posts/categorized/pain-points';
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

    // Prepare headers for higher rate limits
    const headers: HeadersInit = {
      'Accept': 'application/vnd.github.v3+json',
    };
    
    if (process.env.CONTENT_GH_TOKEN) {
      headers['Authorization'] = `Bearer ${process.env.CONTENT_GH_TOKEN}`;
    }

    // Fetch list of files from GitHub
    const res = await fetch(apiUrl, {
      headers,
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      if (res.status === 404) {
         console.log('GitHub path not found:', path);
         return [];
      }
      console.error('Failed to fetch from GitHub:', res.statusText);
      return [];
    }

    const files = await res.json();
    
    // Filter for valid files and exclude examples
    const examples = ['slow-page-load.json', 'mobile-navigation-issues.json'];
    const validFiles = Array.isArray(files) ? files.filter((file: any) => 
      (file.name.endsWith('.yaml') || file.name.endsWith('.yml') || file.name.endsWith('.json')) &&
      !examples.includes(file.name)
    ) : [];

    const painPoints: PainPoint[] = [];

    for (const fileItem of validFiles) {
      try {
        // Fetch raw content
        // fileItem.download_url contains the raw content URL
        const contentRes = await fetch(fileItem.download_url, {
           headers,
           next: { revalidate: 300 } // Cache content files a bit longer
        });
        const content = await contentRes.text();
        
        // Parse content
        const isYaml = fileItem.name.endsWith('.yaml') || fileItem.name.endsWith('.yml');
        const data = isYaml ? YAML.parse(content) : JSON.parse(content);
        
        const slug = fileItem.name.replace(/\.(yaml|yml|json)$/, '');

        // Fetch creation date (first commit date) via GitHub API
        let createdAt = new Date().toISOString(); 
        try {
           const commitsUrl = `https://api.github.com/repos/${owner}/${repo}/commits?path=${path}/${fileItem.name}&page=1&per_page=1&order=asc`;
           const commitsRes = await fetch(commitsUrl, {
              headers,
              next: { revalidate: 3600 } // Commit history rarely changes for creation date
           });
           if (commitsRes.ok) {
             const commits = await commitsRes.json();
             if (commits && commits.length > 0) {
               createdAt = commits[0].commit.author.date;
             }
           }
        } catch (e) {
           console.warn(`Failed to fetch commits for ${fileItem.name}`, e);
        }

        painPoints.push({
          slug,
          title: data.title || 'Untitled Pain Point',
          inconvenience: data['how does it inconvience you'] || '',
          workaround: data['what have you done as a workaround'] || '',
          limitation: data['how does this pain point limit what you want to do'] || '',
          demandScore: parseInt(data['on a scale of 1 - 10 how badly would you want the solution to your paint point']) || 0,
          progressScore: parseInt(data['how much progress have the tech you or someone you\'re working has gone to fixing the pain point']) || 0,
          createdAt: createdAt,
          tags: data.tags || [],
        });
      } catch (parseError) {
        console.error(`Error parsing remote file ${fileItem.name}:`, parseError);
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
    console.error('Error fetching pain points:', error);
    return [];
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
  
  // GitHub URL for creating a new pain point with pre-filled YAML template
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
  const addPainPointUrl = `https://github.com/MonteLogic/MoL-blog-content/new/main/posts/categorized/pain-points?filename=pain-point-name-1.yaml&value=${encodeURIComponent(template)}`;

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
