import fs from 'fs';
import path from 'path'; // Ensure path is imported
import { auth, currentUser } from '@clerk/nextjs/server';
import matter from 'gray-matter';
import Link from 'next/link';
import packageJson from '#/package.json';

interface BlogPost {
  slug: string; // This will be the final, unique slug
  frontmatter: {
    title: string;
    date?: string;
    description?: string;
    tags?: string[];
    author?: string;
    status?: string;
    componentSets?: string[];
    categories?: string[];
    categorySlugs?: string[];
    [key: string]: any;
  };
}

// --- Helper Functions (Ideally, move to a shared 'utils/blog.ts' file) ---

/**
 * Generates a "base" URL-friendly slug from a given file path.
 * For index.md files, uses the immediate parent directory name.
 * For other .md files, uses the filename without extension.
 */
function generateBaseSlug(filePathFromJson: string): string {
  const postsBaseDirString = 'MoL-blog-content/posts/';
  const normalizedFilePath = filePathFromJson.replace(/\\/g, '/').trim();

  let relativePathToPostsDir: string;
  if (normalizedFilePath.startsWith(postsBaseDirString)) {
    relativePathToPostsDir = normalizedFilePath.substring(
      postsBaseDirString.length,
    );
  } else {
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
    // Fallback for an empty slug, though unlikely with the above logic
    const pathHash = Buffer.from(filePathFromJson)
      .toString('hex')
      .substring(0, 8);
    return `post-${pathHash}`;
  }
  return slug;
}

/**
 * Formats a name (like a filename or directory name) into a nice title.
 */
function formatTitle(namePart: string): string {
  const titleWithoutDate = namePart.replace(/^\d{2}-\d{2}-\d{4}-/, '');
  return titleWithoutDate
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// --- Main function to get blog posts ---

async function getBlogPosts(): Promise<BlogPost[]> {
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

    // Step 1: Generate base slugs and gather necessary info for each path
    const processedPaths = markdownFilePaths.map((filePathFromJson, index) => {
      const currentFilePath = filePathFromJson.trim();

      const baseSlug = generateBaseSlug(currentFilePath);

      // Determine titleSource from original path structure
      const postsBaseDirString = 'MoL-blog-content/posts/';
      const originalNormalizedPath = currentFilePath.replace(/\\/g, '/');
      const originalRelativePath = originalNormalizedPath.startsWith(
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
        originalIndex: index, // Keep original index for stable suffixing if needed later, though current logic relies on iteration order
      };
    });

    // Step 2: Create unique slugs and process each file
    const posts: BlogPost[] = [];
    const slugOccurrences: { [key: string]: number } = {};

    for (const item of processedPaths) {
      const { filePath, baseSlug, titleSourceName, originalIndex } = item;

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
        console.error(
          `[${originalIndex}] ERROR: File not found at full path: "${fullMarkdownPath}" (should have been caught earlier if paths are static). Skipping.`,
        );
        continue;
      }

      let fileContentRead;
      try {
        if (fs.statSync(fullMarkdownPath).isDirectory()) {
          continue;
        }
        fileContentRead = fs.readFileSync(fullMarkdownPath, 'utf8');
      } catch (readError: any) {
        if (readError.code === 'EISDIR') {
          continue;
        }
        console.error(
          `[${originalIndex}] ERROR: Could not read file content for "${fullMarkdownPath}":`,
          readError,
        );
        continue;
      }

      const { data: parsedFrontmatter } = matter(fileContentRead);

      // Normalize categories logic
      let rawCategories: string[] = [];
      let categorySlugs: string[] = [];

      // 1. Get Display Names
      if (
        parsedFrontmatter['categories'] &&
        Array.isArray(parsedFrontmatter['categories'])
      ) {
        rawCategories = parsedFrontmatter['categories'];
      } else if (
        parsedFrontmatter['category'] &&
        typeof parsedFrontmatter['category'] === 'string'
      ) {
        rawCategories = [parsedFrontmatter['category']];
      }

      // 2. Get Slugs
      if (
        parsedFrontmatter['category-slug'] ||
        parsedFrontmatter['category-slugs']
      ) {
        if (Array.isArray(parsedFrontmatter['category-slugs'])) {
          categorySlugs = parsedFrontmatter['category-slugs'];
        } else if (typeof parsedFrontmatter['category-slug'] === 'string') {
          categorySlugs = [parsedFrontmatter['category-slug']];
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
            .replace(/[^\w-]+/g, '')
            .replace(/-+/g, '-'),
        );
      }

      const frontmatter: BlogPost['frontmatter'] = {
        ...(parsedFrontmatter as object),
        title: parsedFrontmatter['title'] ?? formatTitle(titleSourceName),
        status:
          parsedFrontmatter['status'] === 'private' ? 'private' : 'public',
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
      if (a.frontmatter.date) return -1;
      if (b.frontmatter.date) return 1;
      return 0;
    });
  } catch (error) {
    console.error('CRITICAL ERROR in getBlogPosts:', error);
    if (process.env.NODE_ENV === 'production') {
      return [];
    }
    throw error;
  }
}

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
export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
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

  const allPosts = await getBlogPosts();

  const visiblePosts = allPosts.filter((post) =>
    canViewPost(userRole, post.frontmatter.status),
  );

  // Pagination Logic
  const page =
    typeof resolvedSearchParams['page'] === 'string'
      ? Number.parseInt(resolvedSearchParams['page'], 10)
      : 1;
  const postsPerPage = 5; // Adjust as needed
  const totalPages = Math.ceil(visiblePosts.length / postsPerPage);

  const startIndex = (page - 1) * postsPerPage;
  const endIndex = startIndex + postsPerPage;
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
            <div className="mt-10 flex items-center justify-center space-x-4">
              {page > 1 ? (
                <Link
                  href={`/blog?page=${page - 1}`}
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
                  href={`/blog?page=${page + 1}`}
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
        </>
      )}
    </div>
  );
}
