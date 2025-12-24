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
    status?: string;
    categories?: string[];
    [key: string]: any;
  };
}

// Helper to generate base slug (reused logic)
function generateBaseSlug(filePathFromJson: string): string {
    const postsBaseDirString = 'MoL-blog-content/posts/';
    let normalizedFilePath = filePathFromJson.replace(/\\/g, '/').trim();

    let relativePathToPostsDir: string;
    if (normalizedFilePath.startsWith(postsBaseDirString)) {
        relativePathToPostsDir = normalizedFilePath.substring(postsBaseDirString.length);
    } else {
        relativePathToPostsDir = normalizedFilePath;
    }

    const fileExtension = path.posix.extname(relativePathToPostsDir);
    const baseFilename = path.posix.basename(relativePathToPostsDir, fileExtension);

    let slugCandidate: string;
    if (baseFilename.toLowerCase() === 'index') {
        const parentDirName = path.posix.basename(path.posix.dirname(relativePathToPostsDir));
        slugCandidate = (parentDirName === '.' || parentDirName === '') ? 'home' : parentDirName; 
    } else {
        slugCandidate = baseFilename;
    }
    
    const slug = slugCandidate
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '');
    
    if (!slug) {
        const pathHash = Buffer.from(filePathFromJson).toString('hex').substring(0, 8);
        return `post-${pathHash}`;
    }
    return slug;
}

function formatTitle(namePart: string): string {
  const titleWithoutDate = namePart.replace(/^\d{2}-\d{2}-\d{4}-/, '');
  return titleWithoutDate
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Get blog posts
async function getBlogPosts(): Promise<BlogPost[]> {
    try {
        const jsonFilePath = path.join(process.cwd(), 'blog-schema/file-paths/markdown-paths.json');
        if (!fs.existsSync(jsonFilePath)) {
          return [];
        }
    
        const jsonFileContent = fs.readFileSync(jsonFilePath, 'utf8');
        const markdownFilePaths: string[] = JSON.parse(jsonFileContent);
    
        // Step 1: Generate base slugs and gather necessary info
        const processedPaths = markdownFilePaths.map((filePathFromJson) => {
            const currentFilePath = filePathFromJson.trim();
            const baseSlug = generateBaseSlug(currentFilePath);
    
            // Determine titleSource
            const postsBaseDirString = 'MoL-blog-content/posts/';
            let originalNormalizedPath = currentFilePath.replace(/\\/g, '/');
            let originalRelativePath = originalNormalizedPath.startsWith(postsBaseDirString)
                ? originalNormalizedPath.substring(postsBaseDirString.length)
                : originalNormalizedPath;
    
            const originalFileExt = path.posix.extname(originalRelativePath);
            const originalBaseFileNameForTitle = path.posix.basename(originalRelativePath, originalFileExt);
            const originalParentDirName = path.posix.basename(path.posix.dirname(originalRelativePath)); 
    
            let titleSourceName: string;
            if (originalBaseFileNameForTitle.toLowerCase() === 'index') {
                titleSourceName = (originalParentDirName && originalParentDirName !== '.') ? originalParentDirName : originalBaseFileNameForTitle;
            } else {
                titleSourceName = originalBaseFileNameForTitle;
            }
            
            return {
                filePath: currentFilePath,
                baseSlug: baseSlug,
                titleSourceName: titleSourceName,
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
            if (!fs.existsSync(fullMarkdownPath) || fs.lstatSync(fullMarkdownPath).isDirectory()) {
                continue;
            }
    
            const fileContentRead = fs.readFileSync(fullMarkdownPath, 'utf8');
            const { data } = matter(fileContentRead);
            
            // Add filePath to frontmatter for reliable filtering by path
            const frontmatter: BlogPost['frontmatter'] = {
              ...data,
              title: data.title || formatTitle(titleSourceName),
              status: (data.status === 'public' || data.status === undefined) ? 'public' : 'private',
              _filePath: filePath // Internal use
            };
    
            posts.push({
              slug: finalUniqueSlug,
              frontmatter,
            });
        }
    
        return posts.sort((a, b) => {
          if (a.frontmatter.date && b.frontmatter.date) {
            return new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime();
          }
          return 0;
        });
    
      } catch (error) {
        console.error('Error in getBlogPosts:', error);
        return [];
      }
}

function canViewPost(userRole: string | undefined, postStatus: string): boolean {
  if (postStatus === 'public') {
    return true;
  }
  return userRole === 'admin' || userRole === 'Admin' || userRole === 'Contributor';
}

function formatProjectName(slug: string): string {
    if (slug.includes('-')) {
        return slug
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
    }
    return slug.replace(/([A-Z])/g, ' $1').trim();
}

interface Props {
  params: {
    slug: string;
  };
  searchParams: {
    page?: string;
  };
}

export default async function ProjectPage({ params: { slug }, searchParams }: Props) {
  const { userId } = auth();
  let userRole: string | undefined;

  if (userId) {
    try {
      const user = await currentUser();
      userRole = user?.privateMetadata?.role as string;
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  }

  const projectName = formatProjectName(slug);
  const allPosts = await getBlogPosts();
  
  // Filter posts that are inside the project directory
  // Path format: MoL-blog-content/posts/categorized/projects/[slug]/...
  const projectPathPrefix = `MoL-blog-content/posts/categorized/projects/${slug}`;

  const projectPosts = allPosts.filter(post => {
    const postPath = post.frontmatter._filePath as string;
    
    // Normalize paths for comparison
    const normalizedPostPath = postPath.replace(/\\/g, '/');
    const matchesPath = normalizedPostPath.includes(projectPathPrefix);
    
    return matchesPath && canViewPost(userRole, post.frontmatter.status || 'private');
  });

  // Pagination
  const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page, 10) : 1;
  const POSTS_PER_PAGE = 5; 
  const totalPages = Math.ceil(projectPosts.length / POSTS_PER_PAGE);
  
  const startIndex = (page - 1) * POSTS_PER_PAGE;
  const endIndex = startIndex + POSTS_PER_PAGE;
  const currentPosts = projectPosts.slice(startIndex, endIndex);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex flex-col gap-4 mb-8">
        <Link 
            href="/blog/projects" 
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors self-start flex items-center gap-2 group"
        >
            <span className="transform transition-transform group-hover:-translate-x-1">←</span>
            Back to Projects
        </Link>
        <h1 className="text-3xl font-bold text-white">{projectName}</h1>
      </div>

      {currentPosts.length === 0 ? (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <p className="text-white">No posts found in this project.</p>
            <Link href="/blog/projects" className="text-blue-400 hover:text-blue-300 mt-4 inline-block">
                Back to Projects
            </Link>
        </div>
      ) : (
        <div className="space-y-6">
            {currentPosts.map((post: BlogPost) => (
            <article
                key={post.slug}
                className="bg-black border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-colors"
            >
                <div className="flex justify-between items-start">
                    <h2 className="text-xl font-semibold mb-3">
                        <Link
                        href={`/blog/${post.slug}`}
                        className="text-blue-400 hover:text-blue-300 no-underline"
                        >
                        {post.frontmatter.title}
                        </Link>
                    </h2>
                    {(userRole === 'admin' || userRole === 'Admin' || userRole === 'Contributor') && (
                        <span className={`px-2 py-1 text-xs rounded-full ${
                        post.frontmatter.status === 'public'
                            ? 'bg-green-900/30 text-green-400 border border-green-800'
                            : 'bg-yellow-900/30 text-yellow-400 border border-yellow-800'
                        }`}>
                        {post.frontmatter.status}
                        </span>
                    )}
                </div>

                {post.frontmatter.description && (
                <p className="text-gray-300 mb-3">{post.frontmatter.description}</p>
                )}
                
                {post.frontmatter.date && (
                <div className="text-gray-400 text-sm mb-3">
                    {new Date(post.frontmatter.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                    })}
                </div>
                )}
                
                <div>
                <Link
                    href={`/blog/${post.slug}`}
                    className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 no-underline"
                >
                    Read more
                    <span aria-hidden="true">→</span>
                </Link>
                </div>
            </article>
            ))}
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-4 mt-8">
                    {page > 1 ? (
                        <Link
                            href={`?page=${page - 1}`}
                            className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors"
                        >
                            Previous
                        </Link>
                    ) : (
                        <span className="px-4 py-2 bg-gray-800 text-gray-500 rounded cursor-not-allowed">
                            Previous
                        </span>
                    )}
                    
                    <span className="text-gray-400">
                        Page {page} of {totalPages}
                    </span>

                    {page < totalPages ? (
                        <Link
                            href={`?page=${page + 1}`}
                            className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors"
                        >
                            Next
                        </Link>
                    ) : (
                        <span className="px-4 py-2 bg-gray-800 text-gray-500 rounded cursor-not-allowed">
                            Next
                        </span>
                    )}
                </div>
            )}
        </div>
      )}
    </div>
  );
}
