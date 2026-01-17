import React from 'react';
import Link from 'next/link';
import { auth, currentUser } from '@clerk/nextjs';
import YAML from 'yaml';
import RefreshButton from './refresh-button';
import PainPointsList from './pain-points-list';

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
    
    // Filter for valid directories
    // We exclude specific examples if needed.
    const validFiles = Array.isArray(files) ? files.filter((file: any) => 
      file.type === 'dir'
    ) : [];

    const painPoints: PainPoint[] = [];

    for (const fileItem of validFiles) {
      try {
        const slug = fileItem.name;
        
        // Construct path to expected main YAML file: [slug]/[slug].yaml
        
        // Construct path to expected main YAML file: [slug]/[slug].yaml
        // We assume the file inside has the same name as the folder
        // We try .yaml, then .yml, then .json
        // To be efficient, we can fetch contents of the dir first? Or just try fetch directly.
        // Fetching dir contents is safer to know the extension.
        
        const dirUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}/${slug}`;
        const dirRes = await fetch(dirUrl, { headers, next: { revalidate: 300 } });
        
        if (!dirRes.ok) continue;
        
        const dirFiles = await dirRes.json();
        
        if (!Array.isArray(dirFiles)) continue;
        
        const mainFile = dirFiles.find((f: any) => 
            f.name === `${slug}.yaml` || 
            f.name === `${slug}.yml` || 
            f.name === `${slug}.json` ||
            f.name === `index.yaml`
        );
        
        if (!mainFile) continue;

        // Fetch raw content
        const contentRes = await fetch(mainFile.download_url, {
           headers,
           next: { revalidate: 300 } 
        });
        const content = await contentRes.text();
        
        // Parse content
        const isYaml = mainFile.name.endsWith('.yaml') || mainFile.name.endsWith('.yml');
        const data = isYaml ? YAML.parse(content) : JSON.parse(content);

        // Fetch creation date (first commit date) via GitHub API
        let createdAt = new Date().toISOString(); 
        try {
           const commitsUrl = `https://api.github.com/repos/${owner}/${repo}/commits?path=${path}/${slug}/${mainFile.name}&page=1&per_page=1&order=asc`;
           const commitsRes = await fetch(commitsUrl, {
              headers,
              next: { revalidate: 3600 } 
           });
           if (commitsRes.ok) {
             const commits = await commitsRes.json();
             if (commits && commits.length > 0) {
               createdAt = commits[0].commit.author.date;
             }
           }
        } catch (e) {
           console.warn(`Failed to fetch commits for ${slug}`, e);
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
        console.error(`Error parsing pain point ${fileItem.name}:`, parseError);
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
        <div className="flex flex-col md:flex-row md:items-center gap-4 rounded-lg p-4 mb-8 border border-slate-200 dark:border-slate-700" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <span className="text-xs font-semibold uppercase tracking-wider mb-2 md:mb-0" style={{ color: 'var(--text-muted)' }}>Admin Area</span>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <Link
              href="/blog/pain-points/new"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-indigo-600 bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Pain Point
            </Link>

            <a
              href={addPainPointUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-600 bg-transparent px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <svg
                className="h-4 w-4"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
              Add Pain Point on GitHub
            </a>
          </div>

          <div className="flex md:ml-auto w-full md:w-auto justify-end">
            <RefreshButton />
          </div>
        </div>
      )}

      {/* Pain Points List */}
      <PainPointsList initialPainPoints={painPoints} />
    </div>
  );
}
