import React from 'react';
import Link from 'next/link';
import { AdminArea } from '../../[slug]/AdminArea';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { auth, currentUser } from '@clerk/nextjs/server';
import { notFound } from 'next/navigation';

interface BlogPost {
  slug: string;
  frontmatter: {
    title: string;
    date?: string;
    description?: string;
    tags?: string[];
    author?: string;
    status?: string;
    categories?: string[]; // Add categories to frontmatter
    [key: string]: any;
  };
}

interface CategorySchema {
  categories: {
    [key: string]: {
      description: string;
      url: string;
    }[];
  };
}

async function getCategoryDetails(
  slug: string,
): Promise<{ name: string } | undefined> {
  try {
    const schemaPath = path.join(
      process.cwd(),
      'blog-schema/categories-schema.json',
    );
    const schemaFile = fs.readFileSync(schemaPath, 'utf8');
    const schema: CategorySchema = JSON.parse(schemaFile);

    for (const categoryName in schema.categories) {
      if (schema.categories.hasOwnProperty(categoryName)) {
        if (categoryName === slug) {
          return { name: formatTitle(categoryName) };
        }
      }
    }
    return undefined;
  } catch (error) {
    console.error('Error reading categories schema:', error);
    return undefined;
  }
}

// Function to safely get blog posts
// Helper to generate base slug (matches main blog page logic)
function generateBaseSlug(filePathFromJson: string): string {
  const postsBaseDirString = 'MoL-blog-content/posts/';
  let normalizedFilePath = filePathFromJson.replace(/\\/g, '/').trim();

  let relativePathToPostsDir: string;
  if (normalizedFilePath.startsWith(postsBaseDirString)) {
    relativePathToPostsDir = normalizedFilePath.substring(
      postsBaseDirString.length,
    );
  } else {
    console.warn(
      `Path "${normalizedFilePath}" (from JSON: "${filePathFromJson}") does not start with "${postsBaseDirString}". Slug generation might be affected.`,
    );
    relativePathToPostsDir = normalizedFilePath;
  }

  const fileExtension = path.posix.extname(relativePathToPostsDir);
  const baseFilename = path.posix.basename(
    relativePathToPostsDir,
    fileExtension,
  );

  let slugCandidate: string;
  if (baseFilename.toLowerCase() === 'index') {
    const parentDirName = path.posix.basename(
      path.posix.dirname(relativePathToPostsDir),
    );
    slugCandidate =
      parentDirName === '.' || parentDirName === '' ? 'home' : parentDirName;
  } else {
    slugCandidate = baseFilename;
  }

  const slug = slugCandidate
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '');

  if (!slug) {
    const pathHash = Buffer.from(filePathFromJson)
      .toString('hex')
      .substring(0, 8);
    console.warn(
      `Generated empty base slug for path: ${filePathFromJson}. Using fallback: post-${pathHash}`,
    );
    return `post-${pathHash}`;
  }
  return slug;
}

// Helper function to format folder name into a title (kept for compatibility)
function formatTitle(namePart: string): string {
  const titleWithoutDate = namePart.replace(/^\d{2}-\d{2}-\d{4}-/, '');
  return titleWithoutDate
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Robust getBlogPosts using markdown-paths.json
async function getBlogPosts(): Promise<BlogPost[]> {
  console.log('Starting getBlogPosts for Category Page...');
  try {
    const jsonFilePath = path.join(
      process.cwd(),
      'blog-schema/file-paths/markdown-paths.json',
    );
    if (!fs.existsSync(jsonFilePath)) {
      console.error(
        'CRITICAL: markdown-paths.json not found at:',
        jsonFilePath,
      );
      return [];
    }

    const jsonFileContent = fs.readFileSync(jsonFilePath, 'utf8');
    const markdownFilePaths: string[] = JSON.parse(jsonFileContent);
    // console.log(`Found ${markdownFilePaths.length} paths in JSON file.`);

    // Step 1: Generate base slugs and gather necessary info
    const processedPaths = markdownFilePaths.map((filePathFromJson, index) => {
      const currentFilePath = filePathFromJson.trim();
      const baseSlug = generateBaseSlug(currentFilePath);

      // Determine titleSource
      const postsBaseDirString = 'MoL-blog-content/posts/';
      let originalNormalizedPath = currentFilePath.replace(/\\/g, '/');
      let originalRelativePath = originalNormalizedPath.startsWith(
        postsBaseDirString,
      )
        ? originalNormalizedPath.substring(postsBaseDirString.length)
        : originalNormalizedPath;

      const originalFileExt = path.posix.extname(originalRelativePath);
      const originalBaseFileNameForTitle = path.posix.basename(
        originalRelativePath,
        originalFileExt,
      );
      const originalParentDirName = path.posix.basename(
        path.posix.dirname(originalRelativePath),
      );

      let titleSourceName: string;
      if (originalBaseFileNameForTitle.toLowerCase() === 'index') {
        titleSourceName =
          originalParentDirName && originalParentDirName !== '.'
            ? originalParentDirName
            : originalBaseFileNameForTitle;
      } else {
        titleSourceName = originalBaseFileNameForTitle;
      }

      return {
        filePath: currentFilePath,
        baseSlug: baseSlug,
        titleSourceName: titleSourceName,
        originalIndex: index,
      };
    });

    // Step 2: Create unique slugs and process each file
    const posts: BlogPost[] = [];
    const slugOccurrences: { [key: string]: number } = {};

    for (const item of processedPaths) {
      const { filePath, baseSlug, titleSourceName } = item;

      let finalUniqueSlug: string;
      if (slugOccurrences[baseSlug] === undefined) {
        slugOccurrences[baseSlug] = 0;
        finalUniqueSlug = baseSlug;
      } else {
        slugOccurrences[baseSlug]++;
        finalUniqueSlug = `${baseSlug}-${slugOccurrences[baseSlug]}`;
      }

      const fullMarkdownPath = path.join(process.cwd(), filePath);
      if (!fs.existsSync(fullMarkdownPath)) {
        // console.warn(`Skipping missing file: ${fullMarkdownPath}`);
        continue;
      }

      if (fs.lstatSync(fullMarkdownPath).isDirectory()) {
        console.warn(
          `Skipping directory in markdown-paths: ${fullMarkdownPath}`,
        );
        continue;
      }

      const fileContentRead = fs.readFileSync(fullMarkdownPath, 'utf8');
      const { data } = matter(fileContentRead);

      // Normalize categories logic
      let rawCategories: string[] = [];
      let categorySlugs: string[] = [];

      // 1. Get Display Names
      if (data.categories && Array.isArray(data.categories)) {
        rawCategories = data.categories;
      } else if (data.category && typeof data.category === 'string') {
        rawCategories = [data.category];
      }

      // 2. Get Slugs
      if (data['category-slug'] || data['category-slugs']) {
        if (Array.isArray(data['category-slugs'])) {
          categorySlugs = data['category-slugs'];
        } else if (typeof data['category-slug'] === 'string') {
          categorySlugs = [data['category-slug']];
        }
      } else {
        // Fallback: slugify the display names
        categorySlugs = rawCategories.map((cat) =>
          cat
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\//g, '-') // Replace slashes first
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-'),
        );
      }

      const frontmatter: BlogPost['frontmatter'] = {
        ...data,
        title: data.title || formatTitle(titleSourceName),
        status: data.status === 'public' ? 'public' : 'private',
        categories: rawCategories,
        categorySlugs: categorySlugs,
      };

      posts.push({
        slug: finalUniqueSlug,
        frontmatter,
      });
    }

    return posts.sort((a, b) => {
      if (a.frontmatter.date && b.frontmatter.date) {
        return (
          new Date(b.frontmatter.date).getTime() -
          new Date(a.frontmatter.date).getTime()
        );
      }
      return 0;
    });
  } catch (error) {
    console.error('Error in getBlogPosts (JSON-based):', error);
    if (process.env.NODE_ENV === 'production') {
      return [];
    }
    throw error;
  }
}

// Helper function to check if user can view a post based on role and post status
function canViewPost(
  userRole: string | undefined,
  postStatus: string,
): boolean {
  // If the post is public, everyone can view it
  if (postStatus === 'public') {
    return true;
  }

  // If the post is private, only Admin and Contributor can view it
  return (
    userRole === 'admin' || userRole === 'Admin' || userRole === 'Contributor'
  );
}

interface Props {
  params: {
    slug: string;
  };
  searchParams: {
    page?: string;
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: { page?: string };
}) {
  const { slug } = await params;
  const { userId } = await auth();
  let userRole: string | undefined;

  if (userId) {
    try {
      const user = await currentUser();
      userRole = user?.privateMetadata?.role as string;
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  }

  const categoryDetails = await getCategoryDetails(slug);

  if (!categoryDetails) {
    notFound();
  }

  const allPosts = await getBlogPosts();
  console.log(
    `[CategoryPage] Filtering for slug: "${slug}". Total posts: ${allPosts.length}`,
  );

  const categoryPosts = allPosts.filter((post) => {
    // Check if the current page slug matches any of the post's normalized category slugs
    // OR if it matches the raw category name (legacy support)
    const hasCategory =
      post.frontmatter.categorySlugs?.includes(slug) ||
      post.frontmatter.categories?.includes(categoryDetails.name) || // Try matching name
      post.frontmatter.categories?.includes(slug); // Try matching raw slug (legacy)

    // Debugging logic for the specific problem post
    if (post.frontmatter.title?.includes('Current Style of Generating PDFs')) {
      console.log(`[DEBUG] Checking Post: "${post.frontmatter.title}"`);
      console.log(`   - slugs:`, post.frontmatter.categorySlugs);
      console.log(`   - categories:`, post.frontmatter.categories);
      console.log(`   - target slug: "${slug}"`);
      console.log(`   - hasCategory: ${hasCategory}`);
      console.log(`   - status: ${post.frontmatter.status}`);
      console.log(
        `   - canView: ${canViewPost(
          userRole,
          post.frontmatter.status || 'private',
        )}`,
      );
    }

    return (
      hasCategory && canViewPost(userRole, post.frontmatter.status || 'private')
    );
  });

  // Pagination Logic
  const page =
    typeof searchParams.page === 'string' ? parseInt(searchParams.page, 10) : 1;
  const POSTS_PER_PAGE = 5;
  const totalPages = Math.ceil(categoryPosts.length / POSTS_PER_PAGE);

  const startIndex = (page - 1) * POSTS_PER_PAGE;
  const endIndex = startIndex + POSTS_PER_PAGE;
  const currentPosts = categoryPosts.slice(startIndex, endIndex);

  if (currentPosts.length === 0) {
    return (
      <div className="mx-auto max-w-4xl">
        <h1
          className="mb-8 text-3xl font-bold"
          style={{ color: 'var(--text-primary)' }}
        >
          {categoryDetails.name}
        </h1>
        <div className="card-blog">
          {categoryPosts.length === 0 ? (
            <>
              <p style={{ color: 'var(--text-primary)' }}>
                No posts found in this category.
              </p>
              <Link
                href="/blog"
                className="back-link text-accent-indigo mt-4 inline-block"
              >
                ← Go back to the blog
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
          {categoryDetails.name}
        </h1>
        <Link href="/blog/categories" className="back-link text-accent-indigo">
          ← All Categories
        </Link>
        {(userRole === 'admin' || userRole === 'Admin') && (
          <AdminArea
            localFilePath="blog-schema/categories-schema.json"
            copyLabel="Copy Dir Path"
          />
        )}
      </div>

      <div className="space-y-6">
        {currentPosts.map((post: BlogPost) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="block">
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
