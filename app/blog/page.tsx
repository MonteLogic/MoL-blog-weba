import React from 'react';
import Link from 'next/link';
import fs from 'fs';
import path from 'path'; // Ensure path is imported
import matter from 'gray-matter';
import { auth, currentUser } from '@clerk/nextjs/server';
import packageJson from '#/package.json';

import { BlogPost, getBlogPosts } from '#/lib/github-fetcher';
import PerPageSelect from './PerPageSelect';

// Helper function to check if user can view a post based on role and post status
// (This is the same as in your provided code)
function canViewPost(
  userRole: string | undefined,
  postStatus: string | undefined,
): boolean {
  if (postStatus === 'public') {
    return true;
  }
  return (
    postStatus !== 'public' &&
    (userRole === 'admin' || userRole === 'Admin' || userRole === 'Contributor')
  );
}

// --- BlogPage Component (Main Page Structure) ---
// (This is largely the same as your provided code, with updated Link href)
export default async function BlogPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
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

  const allPosts = await getBlogPosts();

  let visiblePosts = allPosts.filter((post: BlogPost) =>
    canViewPost(userRole, post.frontmatter.status),
  );

  // Extract all unique tags from compiled file
  let allTags: string[] = [];
  try {
    const tagsFilePath = path.join(process.cwd(), 'generated/tags.json');
    if (fs.existsSync(tagsFilePath)) {
      allTags = JSON.parse(fs.readFileSync(tagsFilePath, 'utf8'));
    }
  } catch (error) {
    console.error('Error reading tags.json:', error);
  }

  // Filter and Sort Logic
  const currentTag =
    typeof searchParams['tag'] === 'string' ? searchParams['tag'] : null;
  const currentSort =
    typeof searchParams['sort'] === 'string' ? searchParams['sort'] : 'latest';

  if (currentTag) {
    visiblePosts = visiblePosts.filter((post: BlogPost) =>
      post.frontmatter.tags?.includes(currentTag),
    );
  }

  if (currentSort === 'oldest') {
    visiblePosts = visiblePosts.reverse();
  }

  // Pagination Logic
  const VALID_PER_PAGE = [15, 30, 50, 100];
  const rawPerPage =
    typeof searchParams['perPage'] === 'string'
      ? parseInt(searchParams['perPage'], 10)
      : 15;
  const perPage = VALID_PER_PAGE.includes(rawPerPage) ? rawPerPage : 15;

  const page =
    typeof searchParams['page'] === 'string'
      ? parseInt(searchParams['page'], 10)
      : 1;
  const totalPages = Math.ceil(visiblePosts.length / perPage);

  const startIndex = (page - 1) * perPage;
  const endIndex = startIndex + perPage;
  const currentPosts = visiblePosts.slice(startIndex, endIndex);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-10 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1
          className="mb-4 text-3xl font-bold sm:mb-0"
          style={{ color: 'var(--text-primary)' }}
        >
          {(packageJson as any).config?.niceNameOfProject || 'Blog'}
        </h1>
        <div className="flex flex-col items-end gap-2">
          <Link
            href="/blog/categories"
            className="text-accent-indigo hover:text-accent-purple group inline-flex items-center font-medium transition-colors"
          >
            View Categories
            <span className="ml-2 transform transition-transform group-hover:translate-x-1">
              →
            </span>
          </Link>
          <Link
            href="/blog/projects"
            className="text-accent-indigo hover:text-accent-purple group inline-flex items-center font-medium transition-colors"
          >
            View Projects
            <span className="ml-2 transform transition-transform group-hover:translate-x-1">
              →
            </span>
          </Link>
          <Link
            href="/blog/pain-points"
            className="text-accent-indigo hover:text-accent-purple group inline-flex items-center font-medium transition-colors"
          >
            View Pain Points
            <span className="ml-2 transform transition-transform group-hover:translate-x-1">
              →
            </span>
          </Link>
        </div>
      </div>

      {/* Filter and View Tags Slot */}
      <div className="border-cream-300 bg-cream-50 mb-8 rounded-xl border p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:justify-between">
          <div>
            <h3 className="text-charcoal-muted mb-3 text-sm font-semibold uppercase tracking-wider">
              Filter by Tag
            </h3>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/blog?sort=${currentSort}`}
                className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                  !currentTag
                    ? 'bg-accent-purple text-white'
                    : 'text-charcoal-light hover:bg-cream-200 border-cream-300 border bg-white'
                }`}
              >
                All Tags
              </Link>
              {allTags.map((tag) => (
                <Link
                  key={tag}
                  href={`/blog?tag=${tag}&sort=${currentSort}`}
                  className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                    currentTag === tag
                      ? 'bg-accent-purple text-white'
                      : 'text-charcoal-light hover:bg-cream-200 border-cream-300 border bg-white'
                  }`}
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>
          <div className="sm:text-right">
            <h3 className="text-charcoal-muted mb-3 text-sm font-semibold uppercase tracking-wider">
              Sort Posts
            </h3>
            <div className="border-cream-300 inline-flex rounded-lg border bg-white p-1">
              <Link
                href={`/blog?sort=latest${
                  currentTag ? `&tag=${currentTag}` : ''
                }`}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                  currentSort === 'latest'
                    ? 'bg-cream-200 text-charcoal-dark shadow-sm'
                    : 'text-charcoal-muted hover:text-charcoal-dark'
                }`}
              >
                Latest
              </Link>
              <Link
                href={`/blog?sort=oldest${
                  currentTag ? `&tag=${currentTag}` : ''
                }`}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                  currentSort === 'oldest'
                    ? 'bg-cream-200 text-charcoal-dark shadow-sm'
                    : 'text-charcoal-muted hover:text-charcoal-dark'
                }`}
              >
                Oldest
              </Link>
            </div>
          </div>
        </div>
      </div>

      {currentPosts.length === 0 ? (
        <div className="border-cream-300 bg-cream-100 rounded-xl border p-8 text-center">
          <p className="text-charcoal-light">
            {userId
              ? 'No blog posts are currently available.'
              : 'Please sign in to view blog posts or check back later for public content.'}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-6">
            {currentPosts.map((post: BlogPost) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="block"
              >
                <article className="card-blog group cursor-pointer">
                  <div className="flex items-start justify-between gap-4">
                    <h2
                      className="mb-2 text-xl font-semibold"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <span className="group-hover:text-accent-purple transition-colors">
                        {post.frontmatter.title}
                      </span>
                    </h2>
                    {(userRole === 'admin' ||
                      userRole === 'Admin' ||
                      userRole === 'Contributor') &&
                      post.frontmatter.status && (
                        <span
                          className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${
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
                    <p
                      className="mb-3 leading-relaxed"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {post.frontmatter.description}
                    </p>
                  )}
                  {post.frontmatter.date && (
                    <div
                      className="mb-3 text-sm"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {new Date(post.frontmatter.date).toLocaleDateString(
                        'en-US',
                        {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        },
                      )}
                    </div>
                  )}
                  {/* Categories on Card */}
                  {post.frontmatter.categories &&
                    post.frontmatter.categories.length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-2">
                        {post.frontmatter.categories.map(
                          (cat: string, idx: number) => (
                            <span key={idx} className="tag-blog">
                              #{cat}
                            </span>
                          ),
                        )}
                      </div>
                    )}
                  {post.frontmatter.tags &&
                    post.frontmatter.tags.length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-2">
                        {post.frontmatter.tags.map((tag: string) => (
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
          <div className="mt-10 flex flex-col items-center gap-4">
            {totalPages > 1 && (
              <div className="flex items-center space-x-4">
                {page > 1 ? (
                  <Link
                    href={`/blog?page=${page - 1}&sort=${currentSort}${currentTag ? `&tag=${currentTag}` : ''}${perPage !== 15 ? `&perPage=${perPage}` : ''}`}
                    className="bg-accent-purple rounded-lg px-5 py-2.5 text-white shadow-sm transition-all hover:bg-purple-700 hover:shadow-md"
                  >
                    Previous
                  </Link>
                ) : (
                  <span className="bg-cream-300 text-charcoal-muted cursor-not-allowed rounded-lg px-5 py-2.5">
                    Previous
                  </span>
                )}

                <span className="text-charcoal-muted font-medium">
                  Page {page} of {totalPages}
                </span>

                {page < totalPages ? (
                  <Link
                    href={`/blog?page=${page + 1}&sort=${currentSort}${currentTag ? `&tag=${currentTag}` : ''}${perPage !== 15 ? `&perPage=${perPage}` : ''}`}
                    className="bg-accent-purple rounded-lg px-5 py-2.5 text-white shadow-sm transition-all hover:bg-purple-700 hover:shadow-md"
                  >
                    Next
                  </Link>
                ) : (
                  <span className="bg-cream-300 text-charcoal-muted cursor-not-allowed rounded-lg px-5 py-2.5">
                    Next
                  </span>
                )}
              </div>
            )}
            <PerPageSelect current={perPage} />
          </div>
        </>
      )}
    </div>
  );
}
