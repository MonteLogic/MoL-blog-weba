import React from 'react';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { auth, currentUser } from '@clerk/nextjs';

interface BlogPost {
  slug: string;
  frontmatter: {
    title: string;
    date?: string;
    description?: string;
    tags?: string[];
    author?: string;
    status?: string; // Should be string
    componentSets?: string[];
    [key: string]: any;
  };
}

// Function to safely get blog posts, using paths from a JSON file
async function getBlogPosts(): Promise<BlogPost[]> {
  console.log('Starting getBlogPosts function...');
  try {
    const jsonFilePath = path.join(process.cwd(), 'blog-schema/file-paths/markdown-paths.json');
    console.log('Attempting to read JSON file at:', jsonFilePath);

    if (!fs.existsSync(jsonFilePath)) {
      console.error('CRITICAL: markdown-paths.json not found at:', jsonFilePath);
      return [];
    }

    const jsonFileContent = fs.readFileSync(jsonFilePath, 'utf8');
    const markdownFilePaths: string[] = JSON.parse(jsonFileContent);
    console.log(`Found ${markdownFilePaths.length} paths in JSON file.`);

    const posts: BlogPost[] = markdownFilePaths
      .map((filePathFromJson, index) => {
        // General logging for EACH file processed from JSON:
        console.log(`\n[${index}] Processing path from JSON: "${filePathFromJson}"`);

        let currentFilePath = filePathFromJson; // Use a mutable variable for trimming
        if (currentFilePath !== currentFilePath.trim()) {
            console.warn(`WARNING: Path "${currentFilePath}" has leading/trailing whitespace. Trimming.`);
            currentFilePath = currentFilePath.trim();
        }

        const fullMarkdownPath = path.join(process.cwd(), currentFilePath);
        console.log(`[${index}] Constructed full path: "${fullMarkdownPath}"`);

        if (!fs.existsSync(fullMarkdownPath)) {
          console.error(`[${index}] ERROR: File not found at full path: "${fullMarkdownPath}". Skipping this file.`);
          return null; // Skip this file
        }

        let fileContentRead;
        try {
          fileContentRead = fs.readFileSync(fullMarkdownPath, 'utf8');
        } catch (readError) {
          console.error(`[${index}] ERROR: Could not read file content for "${fullMarkdownPath}":`, readError);
          return null; // Skip this file
        }
        
        const postsBaseDirString = 'MoL-blog-content/posts/';
        let relativePathToPostsDir: string;

        if (currentFilePath.startsWith(postsBaseDirString)) {
            relativePathToPostsDir = currentFilePath.substring(postsBaseDirString.length);
        } else {
            console.warn(`[${index}] WARNING: Path "${currentFilePath}" does not start with "${postsBaseDirString}". Using the full path for slug parts, which might lead to unexpected slugs.`);
            relativePathToPostsDir = currentFilePath;
        }
        console.log(`[${index}] Relative path to posts dir: "${relativePathToPostsDir}"`);
        
        const dirNameForSlug = path.dirname(relativePathToPostsDir);
        const fileExtension = path.extname(relativePathToPostsDir);
        const baseFilename = path.basename(relativePathToPostsDir, fileExtension);
        console.log(`[${index}] Dirname for slug: "${dirNameForSlug}", Base filename: "${baseFilename}"`);

        let slug: string;
        if (baseFilename.toLowerCase() === 'index') {
          slug = (dirNameForSlug === '.' || dirNameForSlug === '' ? baseFilename : dirNameForSlug).replace(new RegExp('\\' + path.sep, 'g'), '-').replace(/\//g, '-');
        } else {
          const slugPathPart = (dirNameForSlug === '.' || dirNameForSlug === '' ? '' : dirNameForSlug.replace(new RegExp('\\' + path.sep, 'g'), '-').replace(/\//g, '-') + '-');
          slug = slugPathPart + baseFilename;
        }
        
        slug = slug
          .replace(/-+/g, '-') // Replace multiple hyphens with a single one
          .replace(/^-+|-+$/g, '') // Remove leading or trailing hyphens
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, ''); // Remove characters not suitable for a URL slug
        console.log(`[${index}] Generated slug: "${slug}"`);

        const { data: parsedFrontmatter } = matter(fileContentRead);
        console.log(`[${index}] Parsed frontmatter data:`, parsedFrontmatter);
        
        let titleSource = baseFilename;
        if (baseFilename.toLowerCase() === 'index' && dirNameForSlug !== '.' && dirNameForSlug !== '') {
            titleSource = path.basename(dirNameForSlug);
        }
        console.log(`[${index}] Title source for formatTitle (if data.title missing): "${titleSource}"`);

        const frontmatter: BlogPost['frontmatter'] = {
          ...parsedFrontmatter, // Spread the parsed frontmatter
          title: parsedFrontmatter.title ?? formatTitle(titleSource),
          status: parsedFrontmatter.status === 'public' ? 'public' : 'private', // Ensure status is just 'public' or 'private'
        };
        console.log(`[${index}] Final frontmatter for post:`, frontmatter);

        if (!frontmatter.title) {
            console.warn(`[${index}] WARNING: Post with slug "${slug}" has no title.`);
        }
        if (!frontmatter.status) { // This check might be redundant given the line above, but good for sanity
            console.warn(`[${index}] WARNING: Post with slug "${slug}" has no status set in frontmatter, defaulting to private.`);
        }

        return {
          slug,
          frontmatter,
        };
      })
      .filter(post => post !== null) as BlogPost[]; // Filter out any nulls from skipped files

    console.log(`Successfully processed ${posts.length} posts.`);

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
    console.error('CRITICAL ERROR in getBlogPosts:', error);
    if (process.env.NODE_ENV === 'production') {
      return [];
    }
    throw error;
  }
}

// Helper function to format folder name or filename into a title
function formatTitle(namePart: string): string {
  const titleWithoutDate = namePart.replace(/^\d{2}-\d{2}-\d{4}-/, '');
  return titleWithoutDate
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Helper function to check if user can view a post based on role and post status
function canViewPost(
  userRole: string | undefined,
  postStatus: string | undefined,
): boolean {
  if (postStatus === 'public') {
    return true;
  }
  return (
    postStatus !== 'public' &&
    (userRole === 'Admin' || userRole === 'Contributor')
  );
}

export default async function BlogPage() {
  const { userId } = auth();
  let userRole: string | undefined;

  if (userId) {
    try {
      const user = await currentUser();
      userRole = user?.publicMetadata?.role as string;
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  }

  const allPosts = await getBlogPosts();
  console.log(`Total posts returned by getBlogPosts: ${allPosts.length}`);

  const visiblePosts = allPosts.filter((post) =>
    canViewPost(userRole, post.frontmatter.status)
  );
  console.log(`Total visible posts after role/status filtering: ${visiblePosts.length}`);

  if (visiblePosts.length === 0) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <h1 className="mb-8 text-3xl font-bold text-white">CBud Blog</h1>
        <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
          <p className="text-white">
            {userId
              ? 'No blog posts are currently available to view.'
              : 'Please sign in to view blog posts or check back later for public content.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-8 text-3xl font-bold text-white">CBud Blog</h1>
      <div className="space-y-6">
        {visiblePosts.map((post: BlogPost) => (
          <article
            key={post.slug} // Ensures React can efficiently update list
            className="rounded-lg border border-gray-800 bg-black p-6 transition-colors hover:border-gray-700"
          >
            <div className="flex items-start justify-between">
              <h2 className="mb-3 text-xl font-semibold">
                <Link
                  href={`/blog/posts/${post.slug}`}
                  className="text-blue-400 no-underline hover:text-blue-300"
                >
                  {post.frontmatter.title}
                </Link>
              </h2>
              {(userRole === 'Admin' || userRole === 'Contributor') && post.frontmatter.status && (
                <span
                  className={`rounded-full px-2 py-1 text-xs ${
                    post.frontmatter.status === 'public'
                      ? 'border border-green-800 bg-green-900/30 text-green-400'
                      : 'border border-yellow-800 bg-yellow-900/30 text-yellow-400'
                  }`}
                >
                  {post.frontmatter.status}
                </span>
              )}
            </div>
            {post.frontmatter.description && (
              <p className="mb-3 text-gray-300">
                {post.frontmatter.description}
              </p>
            )}
            {post.frontmatter.date && (
              <div className="mb-3 text-sm text-gray-400">
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
                  <span
                    key={tag}
                    className="rounded-full bg-gray-800 px-2 py-1 text-xs text-gray-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <div>
              <Link
                href={`/blog/posts/${post.slug}`}
                className="inline-flex items-center gap-1 text-blue-400 no-underline hover:text-blue-300"
              >
                Read more<span aria-hidden="true">→</span>
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}