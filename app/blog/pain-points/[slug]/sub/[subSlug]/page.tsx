import Link from 'next/link';
import { notFound } from 'next/navigation';
import YAML from 'yaml';

interface SubPainPointUpdate {
  file: string;
  description: string;
  date: string;
  demand?: number;
  progress?: number;
}

interface SubPainPoint {
  slug: string;
  title: string;
  description: string;
  demandScore: number;
  progressScore: number;
  tags: string[];
  updates: SubPainPointUpdate[];
}

async function getSubPainPoint(
  parentSlug: string,
  subSlug: string,
): Promise<SubPainPoint | null> {
  try {
    const owner = process.env['NEXT_PUBLIC_GITHUB_OWNER'] ?? 'MonteLogic';
    const repo = process.env['NEXT_PUBLIC_GITHUB_REPO'] ?? 'MoL-blog-content';

    if (!owner || !repo) {
      console.error(
        'GitHub configuration not complete (owner or repo missing)',
      );
      return null;
    }

    const basePath = `posts/categorized/pain-points/${parentSlug}/sub-pain-points`;

    const headers: HeadersInit = {
      Accept: 'application/vnd.github.v3+json',
    };

    if (process.env['CONTENT_GH_TOKEN']) {
      headers['Authorization'] = `Bearer ${process.env['CONTENT_GH_TOKEN']}`;
    }

    // Try to fetch the sub pain point file
    const fileUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${basePath}/${subSlug}.yaml`;
    const res = await fetch(fileUrl, { headers, next: { revalidate: 60 } });

    if (!res.ok) {
      // Try .yml extension
      const ymlUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${basePath}/${subSlug}.yml`;
      const ymlRes = await fetch(ymlUrl, { headers, next: { revalidate: 60 } });
      if (!ymlRes.ok) return null;

      const ymlData = await ymlRes.json();
      const contentRes = await fetch(ymlData.download_url, {
        headers,
        next: { revalidate: 300 },
      });
      const content = await contentRes.text();
      const data = YAML.parse(content);

      return {
        slug: subSlug,
        title: data.title || 'Untitled',
        description: data.description || '',
        demandScore: Number.parseInt(data.demandScore) || 0,
        progressScore: Number.parseInt(data.progressScore) || 0,
        tags: data.tags || [],
        updates: [],
      };
    }

    const fileData = await res.json();
    const contentRes = await fetch(fileData.download_url, {
      headers,
      next: { revalidate: 300 },
    });
    const content = await contentRes.text();
    const data = YAML.parse(content);

    // Fetch updates for this sub pain point
    const updates: SubPainPointUpdate[] = [];
    try {
      const updatesUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${basePath}/${subSlug}/updates`;
      const updatesRes = await fetch(updatesUrl, {
        headers,
        next: { revalidate: 60 },
      });
      if (updatesRes.ok) {
        const updateFiles = await updatesRes.json();
        if (Array.isArray(updateFiles)) {
          const updatePromises = updateFiles
            .filter(
              (f: any) => f.name.endsWith('.yaml') || f.name.endsWith('.yml'),
            )
            .map(async (f: any) => {
              const uRes = await fetch(f.download_url, {
                headers,
                next: { revalidate: 300 },
              });
              if (!uRes.ok) return null;
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
              };
            });

          const fetchedUpdates = await Promise.all(updatePromises);
          fetchedUpdates.forEach((u) => {
            if (u) updates.push(u);
          });

          updates.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
          );
        }
      }
    } catch (e) {
      // No updates folder
    }

    return {
      slug: subSlug,
      title: data.title || 'Untitled',
      description: data.description || '',
      demandScore: Number.parseInt(data.demandScore) || 0,
      progressScore: Number.parseInt(data.progressScore) || 0,
      tags: data.tags || [],
      updates,
    };
  } catch (error) {
    console.error('Error fetching sub pain point:', error);
    return null;
  }
}

export default async function SubPainPointDetailPage({
  params,
}: {
  params: Promise<{ slug: string; subSlug: string }>;
}) {
  const { slug, subSlug } = await params;
  const subPainPoint = await getSubPainPoint(slug, subSlug);

  if (!subPainPoint) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <Link
          href={`/blog/pain-points/${slug}`}
          className="back-link text-accent-indigo"
        >
          ← Back to Pain Point
        </Link>
      </div>

      <article className="card-blog">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Sub Pain Point
            </span>
            <h1
              className="text-3xl font-bold"
              style={{ color: 'var(--text-primary)' }}
            >
              {subPainPoint.title}
            </h1>
          </div>
          <div className="flex flex-shrink-0 gap-2">
            <span className="rounded-full bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
              Demand: {subPainPoint.demandScore}/10
            </span>
            <span className="rounded-full bg-purple-100 px-3 py-1.5 text-sm font-medium text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
              Progress: {subPainPoint.progressScore}/10
            </span>
          </div>
        </div>

        {subPainPoint.description && (
          <div className="mb-6">
            <h2
              className="mb-2 text-lg font-semibold"
              style={{ color: 'var(--text-primary)' }}
            >
              Description
            </h2>
            <p
              className="whitespace-pre-wrap leading-relaxed"
              style={{ color: 'var(--text-secondary)' }}
            >
              {subPainPoint.description}
            </p>
          </div>
        )}

        {subPainPoint.tags && subPainPoint.tags.length > 0 && (
          <div className="mb-8 border-t border-slate-200 pt-4 dark:border-slate-700">
            <div className="flex flex-wrap gap-2">
              {subPainPoint.tags.map((tag) => (
                <span key={tag} className="tag-blog">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Updates Section */}
        <div className="mt-8 border-t-2 border-slate-100 pt-8 dark:border-slate-800">
          <div className="mb-6 flex items-center justify-between">
            <h2
              className="text-2xl font-bold"
              style={{ color: 'var(--text-primary)' }}
            >
              Updates
            </h2>
            <Link
              href={`/blog/pain-points/${slug}/sub/${subSlug}/add-update`}
              className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
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
              Add Update
            </Link>
          </div>

          {subPainPoint.updates && subPainPoint.updates.length > 0 ? (
            <div className="space-y-6">
              {subPainPoint.updates.map((update, idx) => (
                <div
                  key={idx}
                  className="relative border-l-2 border-slate-200 pb-6 pl-8 last:border-0 last:pb-0 dark:border-slate-700"
                >
                  <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-slate-300 ring-4 ring-white dark:bg-slate-600 dark:ring-gray-900" />
                  <div className="mb-1 flex flex-wrap items-baseline gap-x-2 text-sm text-slate-500 dark:text-slate-400">
                    <span>{new Date(update.date).toLocaleDateString()}</span>
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
      </article>
    </div>
  );
}
