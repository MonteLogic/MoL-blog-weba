import React from 'react';
import Link from 'next/link';
import { auth, currentUser } from '@clerk/nextjs';
import { notFound } from 'next/navigation';
import YAML from 'yaml';

interface PainPointUpdate {
    file: string;
    description: string;
    date: string;
}

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
  updates: PainPointUpdate[];
}

async function getPainPoint(slug: string): Promise<PainPoint | null> {
  try {
    const owner = 'MonteLogic';
    const repo = 'MoL-blog-content';
    const basePath = 'posts/categorized/pain-points';
    
    // Attempt to fetch as YAML first, then JSON (since we support both)
    // We try to guess the extension or check the directory. 
    // A more robust way is to list files and find the match, but for a detail page 
    // checking specific extensions is faster if we assume convention.
    // However, listing first ensures we get the right file extension.
    
    const headers: HeadersInit = {
      'Accept': 'application/vnd.github.v3+json',
    };
    
    if (process.env.CONTENT_GH_TOKEN) {
      headers['Authorization'] = `Bearer ${process.env.CONTENT_GH_TOKEN}`;
    }

    // logic:
    // 1. Try to fetch as directory: posts/categorized/pain-points/[slug]/
    // 2. If valid dir, look for [slug].yaml or [slug].yml or index.yaml inside.
    // 3. fetch updates from [slug]/updates/

    let contentUrl: string | null = null;
    let filePath: string | null = null;
    let isDir = false;

    // Check directory existence and contents
    try {
        const dirUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${basePath}/${slug}`; // Check if slug is a dir
        const dirRes = await fetch(dirUrl, { headers, next: { revalidate: 60 } });
        
        if (dirRes.ok) {
            const dirFiles = await dirRes.json();
            if (Array.isArray(dirFiles)) {
                 // It is a directory. Find the main file.
                 // Expected: [slug].yaml
                 const mainFile = dirFiles.find((f: any) => 
                     f.name === `${slug}.yaml` || 
                     f.name === `${slug}.yml` || 
                     f.name === `index.yaml` ||
                     f.name === `${slug}.json` // Support migrated json too
                 );
                 if (mainFile) {
                     contentUrl = mainFile.download_url;
                     filePath = `${basePath}/${slug}/${mainFile.name}`;
                     isDir = true;
                 }
            }
        }
    } catch(e) { /* ignore */ }

    if (!contentUrl || !filePath) return null;

    // Fetch Main Content
    const contentRes = await fetch(contentUrl, { headers, next: { revalidate: 300 } });
    
    if (!contentRes.ok) return null;
    const content = await contentRes.text();
    const isYaml = filePath.endsWith('.yaml') || filePath.endsWith('.yml');
    const data = isYaml ? YAML.parse(content) : JSON.parse(content);

    // Fetch Updates if isDir (Always true now, but keep check for safety)
    const updates: PainPointUpdate[] = [];
    if (isDir) {
        try {
            const updatesUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${basePath}/${slug}/updates`;
            const updatesRes = await fetch(updatesUrl, { headers, next: { revalidate: 60 } });
            if (updatesRes.ok) {
                const updateFiles = await updatesRes.json();
                if (Array.isArray(updateFiles)) {
                    // Fetch each update content
                    // Parallel fetch
                    const updatePromises = updateFiles
                        .filter((f: any) => f.name.endsWith('.yaml') || f.name.endsWith('.yml'))
                        .map(async (f: any) => {
                             const uRes = await fetch(f.download_url, { headers, next: { revalidate: 300 } });
                             if (!uRes.ok) return null;
                             const uText = await uRes.text();
                             const uData = YAML.parse(uText);
                             
                             // Get date from file creation or frontmatter
                             return {
                                 file: f.name,
                                 description: uData.description || uData.content || '',
                                 date: uData.date || new Date().toISOString() // Fallback
                             };
                        });
                    
                    const fetchedUpdates = await Promise.all(updatePromises);
                    fetchedUpdates.forEach(u => {
                        if (u) updates.push(u);
                    });
                    
                    // Sort updates by date descending
                    updates.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                }
            }
        } catch (e) {
            // No updates folder or other error, ignore
        }
    }

    // Fetch creation date via commits
    let createdAt = new Date().toISOString();
    try {
        const commitsUrl = `https://api.github.com/repos/${owner}/${repo}/commits?path=${filePath}&page=1&per_page=1&order=asc`;
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
        console.warn(`Failed to fetch commits for ${slug}`);
    }

    return {
        slug,
        title: data.title || 'Untitled Pain Point',
        inconvenience: data['how does it inconvience you'] || '',
        workaround: data['what have you done as a workaround'] || '',
        limitation: data['how does this pain point limit what you want to do'] || '',
        demandScore: parseInt(data['on a scale of 1 - 10 how badly would you want the solution to your paint point']) || 0,
        progressScore: parseInt(data['how much progress have the tech you or someone you\'re working has gone to fixing the pain point']) || 0,
        createdAt: createdAt,
        tags: data.tags || [],
        updates: updates,
    };
  } catch (error) {
    console.error('Error fetching pain point:', error);
    return null;
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
  
  // GitHub URL for editing this pain point (guessing .yaml as default/modern standard)
  const editOnGitHubUrl = `https://github.com/MonteLogic/MoL-blog-content/blob/main/posts/categorized/pain-points/${params.slug}/${params.slug}.yaml`;

  // Add Update URL:
  // new/main/posts/categorized/pain-points/[slug]/updates/new?filename=update-YYYY-MM-DD.yaml
  // We need to encode the value as well for a template
  const updateDate = new Date().toISOString().split('T')[0];
  const updateTemplate = `date: "${updateDate}"
description: "Describe the update here..."
`;
  const addUpdateUrl = `https://github.com/MonteLogic/MoL-blog-content/new/main/posts/categorized/pain-points/${params.slug}/updates?filename=update-${updateDate}.yaml&value=${encodeURIComponent(updateTemplate)}`;

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
             <span className="px-3 py-1.5 text-sm font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                Demand: {painPoint.demandScore}/10
             </span>
             <span className="px-3 py-1.5 text-sm font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                Progress: {painPoint.progressScore}/10
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

        {painPoint.inconvenience && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Inconvenience</h2>
            <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {painPoint.inconvenience}
            </p>
          </div>
        )}

        {painPoint.limitation && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Limitation</h2>
            <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {painPoint.limitation}
            </p>
          </div>
        )}

        {painPoint.workaround && (
            <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Workaround</h2>
            <p className="leading-relaxed italic" style={{ color: 'var(--text-secondary)' }}>
                {painPoint.workaround}
            </p>
            </div>
        )}

        {painPoint.tags && painPoint.tags.length > 0 && (
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700 mb-8">
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

        {/* Updates Section */}
        {(painPoint.updates && painPoint.updates.length > 0) || true ? (
            <div className="mt-8 pt-8 border-t-2 border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Updates</h2>
                     <a 
                        href={addUpdateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
                     >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Update
                     </a>
                </div>

                {painPoint.updates && painPoint.updates.length > 0 ? (
                    <div className="space-y-6">
                        {painPoint.updates.map((update, idx) => (
                            <div key={idx} className="relative pl-8 pb-6 border-l-2 border-slate-200 dark:border-slate-700 last:border-0 last:pb-0">
                                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-300 dark:bg-slate-600 ring-4 ring-white dark:ring-gray-900" />
                                <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                                    {new Date(update.date).toLocaleDateString()}
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
        ) : null}

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
