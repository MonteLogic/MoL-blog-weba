import React from 'react';
import Link from 'next/link';
import YAML from 'yaml';
import PainPointsList from './pain-points-list';
import AdminControls from './admin-controls';

// Force static generation for this page (unless revalidation triggers)
// We rely on fetch-level revalidate tags, but removing dynamic auth calls ensures it CAN be static.

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

async function getPainPoints(): Promise<PainPoint[]> {
  try {
    const owner = process.env['NEXT_PUBLIC_GITHUB_OWNER'];
    const repo = process.env['NEXT_PUBLIC_GITHUB_REPO'];

    if (!owner || !repo) {
      console.error(
        'GitHub configuration not complete (owner or repo missing)',
      );
      return [];
    }

    const path = 'posts/categorized/pain-points';
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

    // Prepare headers for higher rate limits
    const headers: HeadersInit = {
      Accept: 'application/vnd.github.v3+json',
    };

    if (process.env['CONTENT_GH_TOKEN']) {
      headers['Authorization'] = `Bearer ${process.env['CONTENT_GH_TOKEN']}`;
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
    const validFiles = Array.isArray(files)
      ? files.filter((file: any) => file.type === 'dir')
      : [];

    // Process all pain points in parallel
    const painPointsResults = await Promise.all(
      validFiles.map(async (fileItem: any) => {
        try {
          const slug = fileItem.name;
          const dirUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}/${slug}`;
          const updatesUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}/${slug}/updates`;

          // Fetch directory listing and check for updates folder simultaneously
          const [dirRes, updatesRes] = await Promise.all([
            fetch(dirUrl, { headers, next: { revalidate: 300 } }),
            fetch(updatesUrl, { headers, next: { revalidate: 300 } }),
          ]);

          if (!dirRes.ok) return null;

          const dirFiles = await dirRes.json();
          if (!Array.isArray(dirFiles)) return null;

          const mainFile = dirFiles.find(
            (f: any) =>
              f.name === `${slug}.yaml` ||
              f.name === `${slug}.yml` ||
              f.name === `${slug}.json` ||
              f.name === `index.yaml`,
          );

          if (!mainFile) return null;

          // Start parallel independent fetches for content, commits, and update details

          // 1. Main Content
          const contentPromise = fetch(mainFile.download_url, {
            headers,
            next: { revalidate: 300 },
          }).then((r) => r.text());

          // 2. Commits (Creation Date)
          const commitsUrl = `https://api.github.com/repos/${owner}/${repo}/commits?path=${path}/${slug}/${mainFile.name}&page=1&per_page=1&order=asc`;
          const commitsPromise = fetch(commitsUrl, {
            headers,
            next: { revalidate: 3600 },
          }).then((r) => (r.ok ? r.json() : []));

          // 3. Last Updated Date
          const lastUpdatedPromise = (async () => {
            if (!updatesRes.ok) return undefined;
            try {
              const updateFiles = await updatesRes.json();
              if (Array.isArray(updateFiles) && updateFiles.length > 0) {
                // Parallel fetch all update files content to find dates
                const datePromises = updateFiles
                  .filter(
                    (f: any) =>
                      f.name.endsWith('.yaml') || f.name.endsWith('.yml'),
                  )
                  .map(async (uFile: any) => {
                    try {
                      const uRes = await fetch(uFile.download_url, {
                        headers,
                        next: { revalidate: 300 },
                      });
                      if (uRes.ok) {
                        const uText = await uRes.text();
                        const uData = YAML.parse(uText);
                        return uData.date;
                      }
                    } catch {
                      return null;
                    }
                  });

                const dates = (await Promise.all(datePromises)).filter(Boolean);
                if (dates.length > 0) {
                  dates.sort(
                    (a: string, b: string) =>
                      new Date(b).getTime() - new Date(a).getTime(),
                  );
                  return dates[0];
                }
              }
            } catch {
              return undefined;
            }
            return undefined;
          })();

          // Wait for all data
          const [content, commits, lastUpdated] = await Promise.all([
            contentPromise,
            commitsPromise,
            lastUpdatedPromise,
          ]);

          // Parse content
          let data;
          try {
            const isYaml =
              mainFile.name.endsWith('.yaml') || mainFile.name.endsWith('.yml');
            data = isYaml ? YAML.parse(content) : JSON.parse(content);
          } catch (e) {
            console.warn(
              `[PainPoints] Skipped malformed file "${mainFile.name}" in "${slug}". Parse error:`,
              e instanceof Error ? e.message : String(e),
            );
            return null;
          }

          let createdAt = new Date().toISOString();
          if (commits && commits.length > 0) {
            createdAt = commits[0].commit.author.date;
          }

          return {
            slug,
            title: data.title || 'Untitled Pain Point',
            inconvenience: data['how does it inconvience you'] || '',
            workaround: data['what have you done as a workaround'] || '',
            limitation:
              data['how does this pain point limit what you want to do'] || '',
            demandScore:
              parseInt(
                data[
                  'on a scale of 1 - 10 how badly would you want the solution to your paint point'
                ],
              ) || 0,
            progressScore:
              parseInt(
                data[
                  "how much progress have the tech you or someone you're working has gone to fixing the pain point"
                ],
              ) || 0,
            createdAt: createdAt,
            lastUpdated: lastUpdated,
            tags: data.tags || [],
          } as PainPoint;
        } catch (parseError) {
          console.error(
            `Error processing pain point ${fileItem.name}:`,
            parseError,
          );
          return null;
        }
      }),
    );

    const validPainPoints = painPointsResults.filter(
      (p): p is PainPoint => p !== null,
    );

    // Sort by date (newest first)
    return validPainPoints.sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
      return 0;
    });
  } catch (error) {
    console.error('Error fetching pain points:', error);
    return [];
  }
}

export default async function PainPointsPage() {
  const painPoints = await getPainPoints();

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <h1
          className="text-3xl font-bold"
          style={{ color: 'var(--text-primary)' }}
        >
          Pain Points
        </h1>
        <Link href="/blog" className="back-link text-accent-indigo">
          ← Back to Blog
        </Link>
      </div>

      {/* Admin Area - Loaded Client-Side to keep page static */}
      <AdminControls />

      {/* Pain Points List */}
      <PainPointsList initialPainPoints={painPoints} />
    </div>
  );
}
