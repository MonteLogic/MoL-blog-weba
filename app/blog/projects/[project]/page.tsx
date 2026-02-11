import fs from 'fs';
import path from 'path';
import { auth, currentUser } from '@clerk/nextjs/server';
import matter from 'gray-matter';
import Link from 'next/link';

interface BlogPost {
  slug: string; // Project-relative slug
  frontmatter: {
    title: string;
    date?: string;
    description?: string;
    tags?: string[];
    author?: string;
    status?: string;
    [key: string]: any;
  };
}

// Generate a project-relative slug for a post
function generateProjectRelativeSlug(
  filePath: string,
  projectDir: string,
): string {
  const relativePath = path.relative(projectDir, filePath).replace(/\\/g, '/');
  const ext = path.posix.extname(relativePath);
  const withoutExt = relativePath.slice(0, -ext.length);

  // Replace directory separators with dashes
  let slug = withoutExt.replace(/\//g, '-');

  // Handle index files
  if (slug.endsWith('-index') || slug === 'index') {
    slug = slug.replace(/-?index$/, '') || 'index';
  }

  // Clean up the slug
  slug = slug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return slug || 'post';
}

function formatTitle(namePart: string): string {
  const titleWithoutDate = namePart.replace(/^\d{2}-\d{2}-\d{4}-/, '');
  return titleWithoutDate
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Get posts for a specific project by reading files directly from project directory
async function getProjectPosts(projectSlug: string): Promise<BlogPost[]> {
  const projectDir = path.join(
    process.cwd(),
    'MoL-blog-content/posts/categorized/projects',
    projectSlug,
  );

  if (!fs.existsSync(projectDir)) {
    return [];
  }

  // Recursively find all markdown files in the project directory
  function findMarkdownFiles(dir: string): string[] {
    const files: string[] = [];
    const items = fs.readdirSync(dir, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        files.push(...findMarkdownFiles(fullPath));
      } else if (item.name.endsWith('.md') || item.name.endsWith('.mdx')) {
        files.push(fullPath);
      }
    }
    return files;
  }

  const markdownFiles = findMarkdownFiles(projectDir);
  const posts: BlogPost[] = [];

  for (const filePath of markdownFiles) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const { data } = matter(content);

      const relativePath = path.relative(projectDir, filePath);
      const basename = path.basename(filePath, path.extname(filePath));

      // Generate title from frontmatter or filename
      let title = data['title'];
      if (!title) {
        if (basename === 'index') {
          title = formatTitle(path.basename(path.dirname(filePath)));
        } else {
          title = formatTitle(basename);
        }
      }

      posts.push({
        slug: generateProjectRelativeSlug(filePath, projectDir),
        frontmatter: {
          ...data,
          title,
          status:
            data['status'] === 'public'
              ? 'public'
              : data['status'] === undefined
              ? 'public'
              : 'private',
        },
      });
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
    }
  }

  // Sort by date
  return posts.sort((a, b) => {
    if (a.frontmatter.date && b.frontmatter.date) {
      return (
        new Date(b.frontmatter.date).getTime() -
        new Date(a.frontmatter.date).getTime()
      );
    }
    return 0;
  });
}

function canViewPost(
  userRole: string | undefined,
  postStatus: string,
): boolean {
  if (postStatus === 'public') {
    return true;
  }
  return (
    userRole === 'admin' || userRole === 'Admin' || userRole === 'Contributor'
  );
}

function formatProjectName(slug: string): string {
  if (slug.includes('-')) {
    return slug
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  return slug.replace(/([A-Z])/g, ' $1').trim();
}

function getProjectInfo(projectSlug: string): {
  name?: string;
  description?: string;
} {
  const infoPath = path.join(
    process.cwd(),
    'MoL-blog-content/posts/categorized/projects',
    projectSlug,
    'info.json',
  );

  if (!fs.existsSync(infoPath)) {
    return {};
  }

  try {
    const infoContent = fs.readFileSync(infoPath, 'utf-8');
    const info = JSON.parse(infoContent);
    return {
      name: info.project,
      description: info.description,
    };
  } catch (error) {
    console.error(`Error reading info.json for ${projectSlug}:`, error);
    return {};
  }
}

interface Props {
  params: {
    project: string;
  };
  searchParams: {
    page?: string;
  };
}

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ project: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { project } = await params;
  const resolvedSearchParams = await searchParams;
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

  const projectInfo = getProjectInfo(project);
  const projectName = projectInfo.name ?? formatProjectName(project);
  const projectDescription = projectInfo.description;
  const allPosts = await getProjectPosts(project);
  const canManagePosts =
    userRole === 'admin' || userRole === 'Admin' || userRole === 'Contributor';
  const githubOwner = process.env['NEXT_PUBLIC_GITHUB_OWNER'] ?? 'MonteLogic';
  const githubRepo =
    process.env['NEXT_PUBLIC_GITHUB_REPO'] ?? 'MoL-blog-content';
  const postTemplate = `---\ntitle: "New Project Post"\ndate: "${
    new Date().toISOString().split('T')[0]
  }"\ndescription: "Describe this post"\ntags: []\nstatus: "private"\n---\n\nStart writing here...\n`;
  const addPostUrl = `https://github.com/${githubOwner}/${githubRepo}/new/main/posts/categorized/projects/${project}?filename=new-post.md&value=${encodeURIComponent(
    postTemplate,
  )}`;
  const editProjectUrl = `https://github.com/${githubOwner}/${githubRepo}/edit/main/posts/categorized/projects/${project}/info.json`;

  // Filter posts based on user permissions
  const projectPosts = allPosts.filter((post) =>
    canViewPost(userRole, post.frontmatter.status || 'private'),
  );

  // Pagination
  const page =
    typeof resolvedSearchParams.page === 'string'
      ? Number.parseInt(resolvedSearchParams.page, 10)
      : 1;
  const postsPerPage = 5;
  const totalPages = Math.ceil(projectPosts.length / postsPerPage);

  const startIndex = (page - 1) * postsPerPage;
  const endIndex = startIndex + postsPerPage;
  const currentPosts = projectPosts.slice(startIndex, endIndex);

  if (currentPosts.length === 0) {
    return (
      <div className="mx-auto max-w-4xl">
        <h1
          className="mb-8 text-3xl font-bold"
          style={{ color: 'var(--text-primary)' }}
        >
          {projectName}
        </h1>
        {projectDescription && (
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
            {projectDescription}
          </p>
        )}
        <div className="card-blog">
          {projectPosts.length === 0 ? (
            <>
              <p style={{ color: 'var(--text-primary)' }}>
                No posts found in this project.
              </p>
              {canManagePosts && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={`/blog/projects/${project}/new`}
                    className="inline-flex items-center justify-center gap-2 rounded-md border border-indigo-600 bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
                  >
                    Add Post
                  </Link>
                  <a
                    href={addPostUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-600 bg-transparent px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    Add Post on GitHub
                  </a>
                  <a
                    href={editProjectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-600 bg-transparent px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    Edit Project
                  </a>
                </div>
              )}
              <Link
                href="/blog/projects"
                className="back-link text-accent-indigo mt-4 inline-block"
              >
                ← Back to Projects
              </Link>
            </>
          ) : (
            <p style={{ color: 'var(--text-primary)' }}>
              No posts found on this page.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <h1
          className="text-3xl font-bold"
          style={{ color: 'var(--text-primary)' }}
        >
          {projectName}
        </h1>
        {projectDescription && (
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {projectDescription}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/blog/projects" className="back-link text-accent-indigo">
            ← All Projects
          </Link>
          {canManagePosts && (
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/blog/projects/${project}/new`}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-indigo-600 bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
              >
                Add Post
              </Link>
              <a
                href={addPostUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-600 bg-transparent px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Add Post on GitHub
              </a>
              <a
                href={editProjectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-600 bg-transparent px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Edit Project
              </a>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {currentPosts.map((post: BlogPost) => (
          <Link
            key={post.slug}
            href={`/blog/projects/${project}/${post.slug}`}
            className="block"
          >
            <article className="card-blog group cursor-pointer">
              <div className="flex items-start justify-between">
                <h2
                  className="mb-3 text-xl font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <span className="group-hover:text-accent-purple transition-colors">
                    {post.frontmatter.title}
                  </span>
                </h2>

                {(userRole === 'admin' ||
                  userRole === 'Admin' ||
                  userRole === 'Contributor') && (
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      post.frontmatter.status === 'public'
                        ? 'badge-public'
                        : 'badge-private'
                    }`}
                  >
                    {post.frontmatter.status}
                  </span>
                )}
              </div>

              {post.frontmatter.description && (
                <p className="mb-3" style={{ color: 'var(--text-secondary)' }}>
                  {post.frontmatter.description}
                </p>
              )}

              {post.frontmatter.date && (
                <div
                  className="mb-3 text-sm"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {new Date(post.frontmatter.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              )}

              {post.frontmatter.tags && post.frontmatter.tags.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {post.frontmatter.tags.map((tag) => (
                    <span key={tag} className="tag-blog">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="pt-2">
                <span className="back-link text-accent-indigo group-hover:gap-2">
                  Read more<span aria-hidden="true">→</span>
                </span>
              </div>
            </article>
          </Link>
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center space-x-4">
          {page > 1 ? (
            <Link
              href={`?page=${page - 1}`}
              className="bg-accent-purple hover:bg-accent-purple/90 rounded-lg px-4 py-2 font-medium text-white transition-colors"
            >
              Previous
            </Link>
          ) : (
            <span
              className="rounded-lg border border-slate-200 px-4 py-2 font-medium dark:border-slate-700"
              style={{
                color: 'var(--text-muted)',
                backgroundColor: 'var(--bg-secondary)',
              }}
            >
              Previous
            </span>
          )}

          <span style={{ color: 'var(--text-muted)' }}>
            Page {page} of {totalPages}
          </span>

          {page < totalPages ? (
            <Link
              href={`?page=${page + 1}`}
              className="bg-accent-purple hover:bg-accent-purple/90 rounded-lg px-4 py-2 font-medium text-white transition-colors"
            >
              Next
            </Link>
          ) : (
            <span
              className="rounded-lg border border-slate-200 px-4 py-2 font-medium dark:border-slate-700"
              style={{
                color: 'var(--text-muted)',
                backgroundColor: 'var(--bg-secondary)',
              }}
            >
              Next
            </span>
          )}
        </div>
      )}
    </div>
  );
}
