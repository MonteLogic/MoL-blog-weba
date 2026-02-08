import { auth, currentUser } from '@clerk/nextjs/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import YAML from 'yaml';
import SubPainPointsTabs from './sub-pain-points-tabs';

interface PainPointUpdate {
  file: string;
  description: string;
  date: string;
  demand?: number;
  progress?: number;
  source: string; // "main" or sub pain point slug
}

interface SubPainPoint {
  slug: string;
  title: string;
  description: string;
  demandScore: number;
  progressScore: number;
  tags: string[];
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
  subPainPoints: SubPainPoint[];
}

// Type for GitHub API file/directory entries
interface GitHubFile {
  name: string;
  type: 'file' | 'dir';
  downloadUrl: string | null;
}

// Helper to clamp values between 0 and 10
function clamp(val: number): number {
  return Math.min(10, Math.max(0, val));
}

// Fetch directory contents from GitHub
async function fetchDirectoryContents(
  owner: string,
  repo: string,
  path: string,
  headers: HeadersInit,
): Promise<GitHubFile[] | null> {
  try {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    const res = await fetch(url, { headers, next: { revalidate: 60 } });
    if (!res.ok) {
      return null;
    }
    const data = await res.json();
    if (Array.isArray(data)) {
      return data as GitHubFile[];
    }
    return null;
  } catch (_e) {
    return null;
  }
}

// Fetch and parse main content file
async function fetchMainContent(
  contentUrl: string,
  filePath: string,
  headers: HeadersInit,
  slug: string,
): Promise<Record<string, unknown> | null> {
  try {
    const contentRes = await fetch(contentUrl, {
      headers,
      next: { revalidate: 300 },
    });
    if (!contentRes.ok) {
      return null;
    }
    const content = await contentRes.text();
    const isYaml = filePath.endsWith('.yaml') || filePath.endsWith('.yml');
    return isYaml ? YAML.parse(content) : JSON.parse(content);
  } catch (_e) {
    console.warn(`[PainPointDetail] malformed content for ${slug}`);
    return null;
  }
}

// Fetch updates from a specific updates directory
async function fetchUpdatesFromDirectory(
  owner: string,
  repo: string,
  updatesPath: string,
  headers: HeadersInit,
  source: string,
): Promise<PainPointUpdate[]> {
  const updates: PainPointUpdate[] = [];
  try {
    const files = await fetchDirectoryContents(
      owner,
      repo,
      updatesPath,
      headers,
    );
    if (!files) {
      return updates;
    }

    const yamlFiles = files.filter(
      (f) => f.name.endsWith('.yaml') || f.name.endsWith('.yml'),
    );

    const updatePromises = yamlFiles.map(async (f) => {
      if (!f.downloadUrl) {
        return null;
      }
      const uRes = await fetch(f.downloadUrl, {
        headers,
        next: { revalidate: 300 },
      });
      if (!uRes.ok) {
        return null;
      }
      const uText = await uRes.text();
      const uData = YAML.parse(uText);

      return {
        file: f.name,
        description: uData.description || uData.content || '',
        date: uData.date || new Date().toISOString(),
        demand:
          uData.demand !== undefined
            ? Number.parseFloat(uData.demand)
            : undefined,
        progress:
          uData.progress !== undefined
            ? Number.parseFloat(uData.progress)
            : undefined,
        source,
      };
    });

    const fetchedUpdates = await Promise.all(updatePromises);
    for (const u of fetchedUpdates) {
      if (u) {
        updates.push(u);
      }
    }
  } catch (_e) {
    // No updates folder or other error, ignore
  }
  return updates;
}

// Fetch sub pain points and their updates
async function fetchSubPainPointDetails(
  owner: string,
  repo: string,
  basePath: string,
  slug: string,
  headers: HeadersInit,
): Promise<{ subPainPoints: SubPainPoint[]; updates: PainPointUpdate[] }> {
  const subPainPoints: SubPainPoint[] = [];
  const updates: PainPointUpdate[] = [];

  try {
    const subPath = `${basePath}/${slug}/sub-pain-points`;
    const subFiles = await fetchDirectoryContents(
      owner,
      repo,
      subPath,
      headers,
    );
    if (!subFiles) {
      return { subPainPoints, updates };
    }

    const subDirs = subFiles.filter((f) => f.type === 'dir');
    const subYamlFiles = subFiles.filter(
      (f) => f.name.endsWith('.yaml') || f.name.endsWith('.yml'),
    );

    // Process YAML files as sub pain points (flat structure)
    const subPromises = subYamlFiles.map(async (f) => {
      if (!f.downloadUrl) {
        return null;
      }
      const sRes = await fetch(f.downloadUrl, {
        headers,
        next: { revalidate: 300 },
      });
      if (!sRes.ok) {
        return null;
      }
      const sText = await sRes.text();
      const sData = YAML.parse(sText);
      const subSlug = f.name.replace(/\.(yaml|yml)$/, '');

      return {
        slug: subSlug,
        title: sData.title || 'Untitled',
        description: sData.description || '',
        demandScore: Number.parseInt(sData.demandScore) || 0,
        progressScore: Number.parseInt(sData.progressScore) || 0,
        tags: sData.tags || [],
      };
    });

    const fetchedSubs = await Promise.all(subPromises);
    for (const s of fetchedSubs) {
      if (s) {
        subPainPoints.push(s);
      }
    }

    // For each sub pain point directory, fetch its updates
    for (const subDir of subDirs) {
      const subUpdatesPath = `${subPath}/${subDir.name}/updates`;
      const subUpdates = await fetchUpdatesFromDirectory(
        owner,
        repo,
        subUpdatesPath,
        headers,
        subDir.name,
      );
      updates.push(...subUpdates);
    }
  } catch (_e) {
    // No sub-pain-points folder or other error, ignore
  }

  return { subPainPoints, updates };
}

// Fetch creation date via commits
async function fetchCreationDate(
  owner: string,
  repo: string,
  filePath: string,
  headers: HeadersInit,
  slug: string,
): Promise<string> {
  try {
    const commitsUrl = `https://api.github.com/repos/${owner}/${repo}/commits?path=${filePath}&page=1&per_page=1&order=asc`;
    const commitsRes = await fetch(commitsUrl, {
      headers,
      next: { revalidate: 3600 },
    });
    if (commitsRes.ok) {
      const commits = await commitsRes.json();
      if (commits && commits.length > 0) {
        return commits[0].commit.author.date;
      }
    }
  } catch (_e) {
    console.warn(`Failed to fetch commits for ${slug}`);
  }
  return new Date().toISOString();
}

// Calculate current scores from base data and updates
function calculateCurrentScores(
  data: Record<string, unknown>,
  updates: PainPointUpdate[],
): { demandScore: number; progressScore: number } {
  let currentDemandScore =
    Number.parseInt(
      String(
        data[
          'on a scale of 1 - 10 how badly would you want the solution to your paint point'
        ] ?? '0',
      ),
    ) || 0;
  let currentProgressScore =
    Number.parseInt(
      String(
        data[
          "how much progress have the tech you or someone you're working has gone to fixing the pain point"
        ] ?? '0',
      ),
    ) || 0;

  for (const u of updates.filter((update) => update.source === 'main')) {
    if (u.demand !== undefined) {
      currentDemandScore += u.demand;
    }
    if (u.progress !== undefined) {
      currentProgressScore += u.progress;
    }
  }

  return {
    demandScore: clamp(currentDemandScore),
    progressScore: clamp(currentProgressScore),
  };
}

async function getPainPoint(slug: string): Promise<PainPoint | null> {
  try {
    const owner = process.env['NEXT_PUBLIC_GITHUB_OWNER'];
    const repo = process.env['NEXT_PUBLIC_GITHUB_REPO'];

    if (!owner || !repo) {
      console.error(
        'GitHub configuration not complete (owner or repo missing)',
      );
      return null;
    }

    const basePath = 'posts/categorized/pain-points';
    const headers: HeadersInit = {
      Accept: 'application/vnd.github.v3+json',
    };

    if (process.env['CONTENT_GH_TOKEN']) {
      headers['Authorization'] = `Bearer ${process.env['CONTENT_GH_TOKEN']}`;
    }

    // Check directory existence and contents
    const dirFiles = await fetchDirectoryContents(
      owner,
      repo,
      `${basePath}/${slug}`,
      headers,
    );

    if (!dirFiles) {
      return null;
    }

    const mainFile = dirFiles.find(
      (f) =>
        f.name === `${slug}.yaml` ||
        f.name === `${slug}.yml` ||
        f.name === 'index.yaml' ||
        f.name === `${slug}.json`,
    );

    if (!mainFile || !mainFile.downloadUrl) {
      return null;
    }

    const contentUrl = mainFile.downloadUrl;
    const filePath = `${basePath}/${slug}/${mainFile.name}`;

    // Fetch Main Content
    const data = await fetchMainContent(contentUrl, filePath, headers, slug);
    if (!data) {
      return null;
    }

    // Fetch Main Pain Point Updates
    const mainUpdates = await fetchUpdatesFromDirectory(
      owner,
      repo,
      `${basePath}/${slug}/updates`,
      headers,
      'main',
    );

    // Fetch Sub Pain Points and their updates
    const { subPainPoints, updates: subUpdates } =
      await fetchSubPainPointDetails(owner, repo, basePath, slug, headers);

    // Combine all updates
    const allUpdates = [...mainUpdates, ...subUpdates];

    // Sort all updates by date descending
    allUpdates.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    // Fetch creation date via commits
    const createdAt = await fetchCreationDate(
      owner,
      repo,
      filePath,
      headers,
      slug,
    );

    // Calculate current scores
    const { demandScore, progressScore } = calculateCurrentScores(
      data,
      allUpdates,
    );

    return {
      slug,
      title: String(data['title'] || 'Untitled Pain Point'),
      inconvenience: String(data['how does it inconvience you'] || ''),
      workaround: String(data['what have you done as a workaround'] || ''),
      limitation: String(
        data['how does this pain point limit what you want to do'] || '',
      ),
      demandScore,
      progressScore,
      createdAt,
      tags: (data['tags'] as string[]) || [],
      updates: allUpdates,
      subPainPoints,
    };
  } catch (error) {
    console.error('Error fetching pain point:', error);
    return null;
  }
}

export default async function PainPointDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { userId } = await auth();
  let userRole: string | undefined;

  if (userId) {
    try {
      const user = await currentUser();
      userRole = user?.privateMetadata?.['role'] as string;
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  }

  const painPoint = await getPainPoint(slug);

  if (!painPoint) {
    notFound();
  }

  const isAdmin = userRole === 'admin' || userRole === 'Admin';

  // GitHub URL for editing this pain point
  const owner = process.env['NEXT_PUBLIC_GITHUB_OWNER'];
  const repo = process.env['NEXT_PUBLIC_GITHUB_REPO'];
  const editOnGitHubUrl =
    owner && repo
      ? `https://github.com/${owner}/${repo}/blob/main/posts/categorized/pain-points/${slug}/${slug}.yaml`
      : null;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <Link href="/blog/pain-points" className="back-link text-accent-indigo">
          ← Back to Pain Points
        </Link>
      </div>

      <article className="card-blog">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <h1
            className="text-3xl font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            {painPoint.title}
          </h1>
          <div className="flex flex-shrink-0 gap-2">
            <span className="rounded-full bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
              Demand: {painPoint.demandScore}/10
            </span>
            <span className="rounded-full bg-purple-100 px-3 py-1.5 text-sm font-medium text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
              Progress: {painPoint.progressScore}/10
            </span>
          </div>
        </div>

        {painPoint.createdAt && (
          <div className="mb-6 text-sm" style={{ color: 'var(--text-muted)' }}>
            Created:{' '}
            {new Date(painPoint.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
        )}

        {painPoint.inconvenience && (
          <div className="mb-6">
            <h2
              className="mb-2 text-lg font-semibold"
              style={{ color: 'var(--text-primary)' }}
            >
              Inconvenience
            </h2>
            <p
              className="leading-relaxed"
              style={{ color: 'var(--text-secondary)' }}
            >
              {painPoint.inconvenience}
            </p>
          </div>
        )}

        {painPoint.limitation && (
          <div className="mb-6">
            <h2
              className="mb-2 text-lg font-semibold"
              style={{ color: 'var(--text-primary)' }}
            >
              Limitation
            </h2>
            <p
              className="leading-relaxed"
              style={{ color: 'var(--text-secondary)' }}
            >
              {painPoint.limitation}
            </p>
          </div>
        )}

        {painPoint.workaround && (
          <div className="mb-6">
            <h2
              className="mb-2 text-lg font-semibold"
              style={{ color: 'var(--text-primary)' }}
            >
              Workaround
            </h2>
            <p
              className="italic leading-relaxed"
              style={{ color: 'var(--text-secondary)' }}
            >
              {painPoint.workaround}
            </p>
          </div>
        )}

        {painPoint.tags && painPoint.tags.length > 0 && (
          <div className="mb-8 border-t border-slate-200 pt-4 dark:border-slate-700">
            <div className="flex flex-wrap gap-2">
              {painPoint.tags.map((tag) => (
                <span key={tag} className="tag-blog">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Sub Pain Points Section - Tabbed */}
        <div className="mt-8 border-t-2 border-slate-100 pt-8 dark:border-slate-800">
          <h2
            className="mb-4 text-2xl font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            Sub Pain Points
          </h2>
          <SubPainPointsTabs
            subPainPoints={painPoint.subPainPoints}
            parentSlug={slug}
          />
        </div>

        {/* Updates Section - Shows ALL updates */}
        <div className="mt-8 border-t-2 border-slate-100 pt-8 dark:border-slate-800">
          <div className="mb-6 flex items-center justify-between">
            <h2
              className="text-2xl font-bold"
              style={{ color: 'var(--text-primary)' }}
            >
              All Updates
            </h2>
            <Link
              href={`/blog/pain-points/${slug}/add-update`}
              className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <title>Add</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Update
            </Link>
          </div>

          {painPoint.updates && painPoint.updates.length > 0 ? (
            <div className="space-y-6">
              {painPoint.updates.map((update) => (
                <div
                  key={`${update.source}-${update.date}-${update.file}`}
                  className="relative border-l-2 border-slate-200 pb-6 pl-8 last:border-0 last:pb-0 dark:border-slate-700"
                >
                  <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-slate-300 ring-4 ring-white dark:bg-slate-600 dark:ring-gray-900" />
                  <div className="mb-1 flex flex-wrap items-baseline gap-x-2 text-sm text-slate-500 dark:text-slate-400">
                    <span>{new Date(update.date).toLocaleDateString()}</span>
                    {update.source !== 'main' && (
                      <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400">
                        Sub: {update.source}
                      </span>
                    )}
                    {update.progress !== undefined && update.progress !== 0 && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          update.progress > 0
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}
                      >
                        Progress: {update.progress > 0 ? '+' : ''}
                        {update.progress}
                      </span>
                    )}
                    {update.demand !== undefined && update.demand !== 0 && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          update.demand > 0
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                        }`}
                      >
                        Demand: {update.demand > 0 ? '+' : ''}
                        {update.demand}
                      </span>
                    )}
                  </div>
                  <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800/50">
                    <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                      {update.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="italic text-slate-500">No updates yet.</p>
          )}
        </div>

        {/* Admin Area */}
        {isAdmin && editOnGitHubUrl && (
          <div className="mt-8 border-t border-slate-200 pt-6 dark:border-slate-700">
            <div className="flex items-center gap-4">
              <span
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--text-muted)' }}
              >
                Admin
              </span>
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
