import React from 'react';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { MDXRemote } from 'next-mdx-remote/rsc';
import rehypePrettyCode from 'rehype-pretty-code';
import remarkGfm from 'remark-gfm';
import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';

interface ProjectPostParams {
  project: string;
  post: string;
}

interface Frontmatter {
  title: string;
  date?: string;
  description?: string;
  tags?: string[];
  author?: string;
  status?: string;
  [key: string]: any;
}

// Format a name into a readable title
function formatTitle(namePart: string): string {
  const titleWithoutDate = namePart.replace(/^\d{2}-\d{2}-\d{4}-/, '');
  return titleWithoutDate
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Check if user can view post
function canViewPost(
  userRole: string | undefined,
  postStatus: string | undefined,
): boolean {
  const effectiveStatus = postStatus === 'public' ? 'public' : 'private';
  if (effectiveStatus === 'public') return true;
  return (
    userRole === 'admin' || userRole === 'Admin' || userRole === 'Contributor'
  );
}

// MDX configuration
const mdxComponents = {};
const mdxProcessingOptions = {
  remarkPlugins: [remarkGfm],
  rehypePlugins: [[rehypePrettyCode, { theme: 'github-dark' }]],
};

// Find the markdown file for a project post
function findProjectPostFile(
  projectSlug: string,
  postSlug: string,
): string | null {
  const projectDir = path.join(
    process.cwd(),
    'MoL-blog-content/posts/categorized/projects',
    projectSlug,
  );

  if (!fs.existsSync(projectDir)) {
    return null;
  }

  // Recursively search for markdown files in the project directory
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

  // Generate slug for each file and find match
  for (const filePath of markdownFiles) {
    const relativePath = path.relative(projectDir, filePath);
    const fileSlug = generatePostSlug(relativePath);

    if (fileSlug === postSlug) {
      return filePath;
    }
  }

  return null;
}

// Generate a slug for a post file relative to project directory
function generatePostSlug(relativePath: string): string {
  const normalized = relativePath.replace(/\\/g, '/');
  const ext = path.posix.extname(normalized);
  const withoutExt = normalized.slice(0, -ext.length);

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

// Get all posts for a project (for generateStaticParams)
function getProjectPosts(
  projectSlug: string,
): Array<{ slug: string; filePath: string }> {
  const projectDir = path.join(
    process.cwd(),
    'MoL-blog-content/posts/categorized/projects',
    projectSlug,
  );

  if (!fs.existsSync(projectDir)) {
    return [];
  }

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

  return markdownFiles.map((filePath) => {
    const relativePath = path.relative(projectDir, filePath);
    return {
      slug: generatePostSlug(relativePath),
      filePath,
    };
  });
}

// Generate static params for all project posts
export async function generateStaticParams(): Promise<ProjectPostParams[]> {
  const projectsDir = path.join(
    process.cwd(),
    'MoL-blog-content/posts/categorized/projects',
  );

  if (!fs.existsSync(projectsDir)) {
    return [];
  }

  const items = fs.readdirSync(projectsDir, { withFileTypes: true });
  const params: ProjectPostParams[] = [];

  for (const item of items) {
    if (!item.isDirectory()) continue;

    const projectSlug = item.name;
    const posts = getProjectPosts(projectSlug);

    for (const post of posts) {
      params.push({
        project: projectSlug,
        post: post.slug,
      });
    }
  }

  return params;
}

// Project Post Page Component
export default async function ProjectPostPage({
  params,
}: {
  params: Promise<ProjectPostParams>;
}) {
  const { project: projectSlug, post: postSlug } = await params;
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

  // Find the markdown file
  const filePath = findProjectPostFile(projectSlug, postSlug);

  if (!filePath) {
    notFound();
  }

  try {
    const source = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(source);
    const frontmatter = data as Frontmatter;

    // Default title if not present
    if (!frontmatter.title) {
      const basename = path.basename(filePath, path.extname(filePath));
      frontmatter.title = formatTitle(
        basename === 'index' ? path.basename(path.dirname(filePath)) : basename,
      );
    }

    // Check access permissions
    if (!canViewPost(userRole, frontmatter.status)) {
      redirect('/blog/projects');
    }

    const isMdx = filePath.endsWith('.mdx');
    const projectName = formatTitle(projectSlug);

    // GitHub URL for admin
    const relativePath = path.relative(process.cwd(), filePath);
    return (
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Link
              href={`/blog/projects/${projectSlug}`}
              className="back-link text-accent-indigo"
            >
              ← Back to {projectName}
            </Link>
          </div>
        </div>

        <article className="prose-blog max-w-none">
          <header className="border-cream-300 mb-12 border-b pb-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <h1 className="text-charcoal text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">
                {frontmatter.title}
              </h1>
              {(userRole === 'admin' ||
                userRole === 'Admin' ||
                userRole === 'Contributor') &&
                frontmatter.status && (
                  <span
                    className={`mt-1 self-start whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium sm:mt-0 ${
                      frontmatter.status === 'public'
                        ? 'badge-public'
                        : 'badge-private'
                    }`}
                  >
                    {frontmatter.status}
                  </span>
                )}
            </div>
            {frontmatter.description && (
              <p className="text-charcoal-light mt-4 text-xl leading-relaxed">
                {frontmatter.description}
              </p>
            )}
            <div className="text-charcoal-muted mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              {frontmatter.date && (
                <span>
                  {new Date(frontmatter.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              )}
              {frontmatter.author && <span>By {frontmatter.author}</span>}
              <Link
                href={`/blog/projects/${projectSlug}`}
                className="text-accent-indigo hover:text-accent-purple transition-colors hover:underline"
              >
                {projectName} Project
              </Link>
            </div>
            {frontmatter.tags && frontmatter.tags.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {frontmatter.tags.map((tag: string) => (
                  <span key={tag} className="tag-blog">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </header>
          <div className="mdx-content">
            {isMdx ? (
              // @ts-ignore
              <MDXRemote
                source={content}
                components={mdxComponents}
                // @ts-ignore
                options={{ mdxOptions: mdxProcessingOptions }}
              />
            ) : (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
            )}
          </div>
        </article>
      </div>
    );
  } catch (error: any) {
    console.error(
      `Error rendering project post "${projectSlug}/${postSlug}":`,
      error.message,
    );
    return (
      <div className="mx-auto max-w-3xl text-center">
        <div className="mb-6">
          <Link
            href={`/blog/projects/${projectSlug}`}
            className="back-link text-accent-indigo"
          >
            ← Back to project
          </Link>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-8">
          <h1 className="mb-4 text-2xl font-bold text-red-600">Post Error</h1>
          <p className="text-charcoal-light">
            The post you were looking for could not be loaded.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <p className="text-charcoal-muted mt-4 text-xs">
              Details: {error.message}
            </p>
          )}
        </div>
      </div>
    );
  }
}
