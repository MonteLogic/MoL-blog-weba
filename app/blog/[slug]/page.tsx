import React from 'react';
import Link from 'next/link';
import fs from 'fs';
import path from 'path'; // Ensure path is imported
import matter from 'gray-matter';
import { MDXRemote } from 'next-mdx-remote/rsc'; // For Server Components
import rehypePrettyCode from 'rehype-pretty-code';
import remarkGfm from 'remark-gfm';
import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { AdminArea } from './AdminArea';
// import { notFound } from 'next/navigation'; // Optional: for a custom 404 trigger

// --- Type Definitions ---
interface BlogPostParams {
  slug: string;
}

import { getBlogPosts, getPostDataBySlug, formatTitle } from '#/lib/github-fetcher';

// --- Helper Functions ---
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

// --- MDX Configuration ---
const mdxComponents = {
  /* Your custom MDX components */
};
const mdxProcessingOptions = {
  remarkPlugins: [remarkGfm],
  rehypePlugins: [[rehypePrettyCode, { theme: 'github-dark' }]], // Or your preferred theme
};


// --- Blog Post Page Component ---
export default async function BlogPostPage({
  params,
}: {
  params: Promise<BlogPostParams>;
}) {
  const { slug: urlSlug } = await params;
  const { userId } = await auth();
  let userRole: string | undefined;

  if (userId) {
    try {
      const user = await currentUser();
      // Role is stored in privateMetadata, not publicMetadata
      userRole = user?.privateMetadata?.['role'] as string;
    } catch (error) {
      console.error(`Error fetching user role for slug "${urlSlug}":`, error);
    }
  }

  try {
    const postData = await getPostDataBySlug(urlSlug);

    if (!postData) {
      console.error(`Post data not found for slug: "${urlSlug}".`);
      // For a standard 404, you might import and call notFound() from 'next/navigation';
      // notFound();
      throw new Error(
        `Blog post "${urlSlug}" not found or could not be processed.`,
      );
    }

    const { content, frontmatter, filePath } = postData;
    const isMdx = filePath.endsWith('.mdx');
    const relativeFilePath = filePath;

    if (!canViewPost(userRole, frontmatter.status)) {
      redirect('/blog');
    }

    // Construct GitHub URL for admin view
    const githubFileUrl = `https://github.com/MonteLogic/MoL-blog-content/blob/main/${relativeFilePath.replace(
      'MoL-blog-content/',
      '',
    )}`;

    return (
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Link href="/blog" className="back-link text-accent-indigo">
              ← Back to all posts
            </Link>

            {userRole === 'admin' && (
              <AdminArea
                githubFileUrl={githubFileUrl}
                localFilePath={relativeFilePath}
              />
            )}
          </div>

          {relativeFilePath.includes('/projects/') &&
            (() => {
              const projectParts = relativeFilePath.split('/projects/');
              const projectName = projectParts[1]?.split('/')[0];
              return projectName ? (
                <Link
                  href={`/blog/projects/${projectName}`}
                  className="back-link text-accent-teal self-start text-sm"
                >
                  ← Back to {formatTitle(projectName)} Project
                </Link>
              ) : null;
            })()}
        </div>

        <article className="prose-blog max-w-none">
          {' '}
          {/* Apply prose classes here */}
          <header className="border-cream-300 mb-12 border-b pb-8">
            {/* ... (article header and content rendering, same as your last provided version) ... */}
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
              {/* Display Categories */}
              {(frontmatter['categories'] || frontmatter['category']) && (
                <div className="flex items-center gap-2">
                  <span>in</span>
                  {(Array.isArray(frontmatter['categories'])
                    ? frontmatter['categories']
                    : [frontmatter['category']]
                  ).map((cat: string, idx: number) => {
                    // Use explicit slug if available, otherwise fallback
                    const catSlug =
                      frontmatter['category-slug'] ||
                      (frontmatter['category-slugs'] &&
                        frontmatter['category-slugs'][idx])
                        ? frontmatter['category-slugs']
                          ? frontmatter['category-slugs'][idx]
                          : frontmatter['category-slug']
                        : cat
                            .toString()
                            .toLowerCase()
                            .trim()
                            .replace(/\s+/g, '-')
                            .replace(/[^\w-]+/g, '');

                    return (
                      <Link
                        key={idx}
                        href={`/blog/categories/${catSlug}`}
                        className="text-accent-indigo hover:text-accent-purple transition-colors hover:underline"
                      >
                        {cat}
                      </Link>
                    );
                  })}
                </div>
              )}
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
      `Error rendering blog post for slug "${urlSlug}":`,
      error.message,
    );
    return (
      <div className="mx-auto max-w-3xl text-center">
        <div className="mb-6">
          <Link href="/blog" className="back-link text-accent-indigo">
            ← Back to all posts
          </Link>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-8">
          <h1 className="mb-4 text-2xl font-bold text-red-600">Post Error</h1>
          <p className="text-charcoal-light">
            The post you were looking for ({urlSlug}) could not be loaded.
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
