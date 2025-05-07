import React from 'react';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { MDXRemote } from 'next-mdx-remote/rsc'; // For Server Components
import rehypePrettyCode from 'rehype-pretty-code';
import remarkGfm from 'remark-gfm';
import { auth, currentUser } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import ReactMarkdown from 'react-markdown';

// --- Type Definitions ---
interface BlogPostParams {
  slug: string;
}

interface Frontmatter {
  title: string; // Made mutable for defaulting
  date?: string;
  description?: string;
  tags?: string[];
  author?: string;
  status?: string; // 'public' or 'private'
  componentSets?: string[];
  [key: string]: any;
}

// --- Helper Functions (Ideally, move to a shared 'utils/blog.ts' file) ---

/**
 * Generates a URL-friendly slug from a given file path.
 * It aims to create shorter, more desirable slugs by ignoring common
 * organizational directories like "uncategorized", "categorized", "articles".
 */
function generateSlugForFilePath(filePathFromJson: string): string {
    const postsBaseDirString = 'MoL-blog-content/posts/';
    let normalizedFilePath = filePathFromJson.replace(/\\/g, '/').trim();

    let relativePathToPostsDir: string;
    if (normalizedFilePath.startsWith(postsBaseDirString)) {
        relativePathToPostsDir = normalizedFilePath.substring(postsBaseDirString.length);
    } else {
        console.warn(`Path "${normalizedFilePath}" (from JSON: "${filePathFromJson}") does not start with "${postsBaseDirString}". Slug generation might be affected.`);
        relativePathToPostsDir = normalizedFilePath;
    }

    const ignoredSegments: string[] = ['uncategorized', 'categorized', 'articles'];

    const pathParts = relativePathToPostsDir.split('/');
    const significantPathParts = pathParts.filter((part, index) => {
        const lowerPart = part.toLowerCase();
        if (index < pathParts.length - 1) { 
            return !ignoredSegments.includes(lowerPart);
        }
        return true; 
    });

    let effectiveRelativePath = significantPathParts.join('/');
    
    let dirNameForSlug = path.posix.dirname(effectiveRelativePath);
    const fileExtension = path.posix.extname(effectiveRelativePath);
    const baseFilename = path.posix.basename(effectiveRelativePath, fileExtension);

    if (dirNameForSlug === '.') {
        dirNameForSlug = ''; 
    }

    let slug: string;
    if (baseFilename.toLowerCase() === 'index') {
      slug = (dirNameForSlug === '' ? baseFilename : dirNameForSlug).replace(/\//g, '-');
    } else {
      const slugPathPart = (dirNameForSlug === '' ? '' : dirNameForSlug.replace(/\//g, '-') + '-');
      slug = slugPathPart + baseFilename;
    }
    
    return slug
      .replace(/-+/g, '-') 
      .replace(/^-+|-+$/g, '') 
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, ''); 
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

/**
 * Checks if the current user can view a post based on their role and the post's status.
 */
function canViewPost(
  userRole: string | undefined,
  postStatus: string | undefined, // Can be undefined if not set in frontmatter
): boolean {
  const effectiveStatus = postStatus === 'public' ? 'public' : 'private'; // Default to private
  if (effectiveStatus === 'public') {
    return true;
  }
  // For private posts, only Admin or Contributor can view
  return userRole === 'Admin' || userRole === 'Contributor';
}

// --- MDX Configuration ---
const mdxComponents = {
  // Add any custom components you want to use in your MDX files here
  // Example:
  // h1: (props) => <h1 className="text-4xl font-bold my-4" {...props} />,
  // CustomImage: (props) => <img className="rounded-lg shadow-md" {...props} />,
};

const mdxProcessingOptions = {
  remarkPlugins: [remarkGfm],
  rehypePlugins: [
    [rehypePrettyCode, { theme: 'github-dark' }], // Example theme
  ],
};

// --- Data Fetching for Individual Post ---
async function getPostDataBySlug(urlSlug: string): Promise<{ filePath: string; isMdx: boolean; frontmatter: Frontmatter; content: string } | null> {
    const jsonFilePath = path.join(process.cwd(), 'blog-schema/file-paths/markdown-paths.json');
    if (!fs.existsSync(jsonFilePath)) {
        console.error('CRITICAL: markdown-paths.json not found at:', jsonFilePath);
        return null;
    }

    try {
        const jsonFileContent = fs.readFileSync(jsonFilePath, 'utf8');
        const markdownFilePaths: string[] = JSON.parse(jsonFileContent);

        for (const filePathFromJson of markdownFilePaths) {
            const generatedSlug = generateSlugForFilePath(filePathFromJson.trim());
            if (generatedSlug === urlSlug) {
                const fullPath = path.join(process.cwd(), filePathFromJson.trim());
                if (!fs.existsSync(fullPath)) {
                    console.error(`File path from JSON exists, but file not found at: ${fullPath}`);
                    continue; // Skip to next path if file is missing
                }
                const source = fs.readFileSync(fullPath, 'utf8');
                const { data, content } = matter(source);
                const frontmatter = data as Frontmatter;

                // Default title if not present in frontmatter
                if (!frontmatter.title) {
                    const originalFileNameWithoutExt = path.posix.basename(fullPath, path.posix.extname(fullPath));
                    const originalDirName = path.posix.basename(path.posix.dirname(fullPath));
                    let titleSourceName: string;
                    if (originalFileNameWithoutExt.toLowerCase() === 'index') {
                        titleSourceName = (originalDirName && originalDirName !== '.') ? originalDirName : originalFileNameWithoutExt;
                    } else {
                        titleSourceName = originalFileNameWithoutExt;
                    }
                    frontmatter.title = formatTitle(titleSourceName);
                }
                
                const fileExtension = path.extname(fullPath).toLowerCase();
                return {
                    filePath: fullPath,
                    isMdx: fileExtension === '.mdx',
                    frontmatter,
                    content,
                };
            }
        }
    } catch (error) {
        console.error(`Error reading or processing markdown paths JSON for slug ${urlSlug}:`, error);
        return null;
    }
    
    console.warn(`No matching file found for slug: ${urlSlug}`);
    return null;
}

// --- Generate Static Paths (for SSG) ---
export async function generateStaticParams(): Promise<BlogPostParams[]> {
    const jsonFilePath = path.join(process.cwd(), 'blog-schema/file-paths/markdown-paths.json');
    if (!fs.existsSync(jsonFilePath)) {
        console.warn('markdown-paths.json not found for generateStaticParams. No static paths will be generated.');
        return [];
    }
    try {
        const jsonFileContent = fs.readFileSync(jsonFilePath, 'utf8');
        const markdownFilePaths: string[] = JSON.parse(jsonFileContent);

        const params = markdownFilePaths.map(filePath => ({
            slug: generateSlugForFilePath(filePath.trim()),
        }));
        console.log(`Generated ${params.length} static params for blog posts.`);
        return params;
    } catch (error) {
        console.error("Error generating static params for blog posts:", error);
        return [];
    }
}

// --- Blog Post Page Component ---
export default async function BlogPostPage({ params }: { params: BlogPostParams }) {
  const { slug: urlSlug } = params;
  const { userId } = auth();
  let userRole: string | undefined;

  if (userId) {
    try {
      const user = await currentUser();
      userRole = user?.publicMetadata?.role as string;
    } catch (error) {
      console.error(`Error fetching user role for slug "${urlSlug}":`, error);
    }
  }

  try {
    const postData = await getPostDataBySlug(urlSlug);

    if (!postData) {
      console.error(`Post data not found for slug: ${urlSlug}.`);
      // This will be caught by the catch block below if not found
      // For a more specific "Not Found" page, you can use Next.js's notFound() function here.
      // import { notFound } from 'next/navigation';
      // notFound();
      throw new Error(`Blog post with slug "${urlSlug}" not found or could not be processed.`);
    }

    const { isMdx, frontmatter, content } = postData;

    if (!canViewPost(userRole, frontmatter.status)) {
      console.log(`User (Role: ${userRole || 'Guest'}) denied access to post "${urlSlug}" with status "${frontmatter.status}". Redirecting.`);
      redirect('/blog');
    }

    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="mb-8">
          <Link href="/blog" className="text-blue-400 hover:text-blue-300 transition-colors">
            ← Back to all posts
          </Link>
        </div>

        <article className="prose prose-quoteless prose-neutral dark:prose-invert prose-lg max-w-none">
          <header className="mb-10 border-b border-gray-700 pb-8">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
                {frontmatter.title}
              </h1>
              {(userRole === 'Admin' || userRole === 'Contributor') && frontmatter.status && (
                <span
                  className={`mt-1 sm:mt-0 whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium self-start ${
                    frontmatter.status === 'public'
                      ? 'border border-green-700 bg-green-900/50 text-green-300'
                      : 'border border-yellow-700 bg-yellow-900/50 text-yellow-300'
                  }`}
                >
                  {frontmatter.status}
                </span>
              )}
            </div>
            {frontmatter.description && (
              <p className="mt-4 text-xl text-gray-400">
                {frontmatter.description}
              </p>
            )}
            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
              {frontmatter.date && (
                <span>
                  {new Date(frontmatter.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              )}
              {frontmatter.author && (
                <span>By {frontmatter.author}</span>
              )}
            </div>
            {frontmatter.tags && frontmatter.tags.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {frontmatter.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="rounded-full bg-gray-800 px-3 py-1 text-xs font-semibold text-gray-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </header>

          <div className="mdx-content">
            {isMdx ? (
              <MDXRemote
                source={content}
                components={mdxComponents}
                options={{
                  mdxOptions: mdxProcessingOptions,
                }}
              />
            ) : (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                // className="prose prose-quoteless prose-neutral dark:prose-invert" // Apply prose styles directly if needed
                // Or ensure your global styles + Tailwind Typography handles .markdown-content
              >
                {content}
              </ReactMarkdown>
            )}
          </div>
        </article>
      </div>
    );
  } catch (error: any) {
    console.error(`Error rendering blog post for slug "${urlSlug}":`, error.message);
    // You could use Next.js notFound() here for a proper 404 page if error indicates "not found"
    // import { notFound } from 'next/navigation';
    // if (error.message.includes("not found")) notFound();

    return (
      <div className="mx-auto max-w-4xl p-6 text-center">
        <div className="mb-6">
          <Link href="/blog" className="text-blue-400 hover:text-blue-300">
            ← Back to all posts
          </Link>
        </div>
        <div className="rounded-lg border border-red-700 bg-red-900/30 p-8">
          <h1 className="mb-4 text-2xl font-bold text-red-400">
            Post Error
          </h1>
          <p className="text-gray-300">
            The post you were looking for ({urlSlug}) could not be loaded. It might not exist or an error occurred.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <p className="mt-4 text-xs text-gray-500">Error: {error.message}</p>
          )}
        </div>
      </div>
    );
  }
}