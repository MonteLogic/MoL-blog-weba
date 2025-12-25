import React from 'react';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { auth, currentUser } from '@clerk/nextjs';

interface BlogPost {
  slug: string;  // Project-relative slug
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
function generateProjectRelativeSlug(filePath: string, projectDir: string): string {
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
    projectSlug
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
      let title = data.title;
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
          status: data.status === 'public' ? 'public' : (data.status === undefined ? 'public' : 'private'),
        }
      });
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
    }
  }

  // Sort by date
  return posts.sort((a, b) => {
    if (a.frontmatter.date && b.frontmatter.date) {
      return new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime();
    }
    return 0;
  });
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
    project: string;
  };
  searchParams: {
    page?: string;
  };
}

export default async function ProjectPage({ params: { project }, searchParams }: Props) {
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

  const projectName = formatProjectName(project);
  const allPosts = await getProjectPosts(project);
  
  // Filter posts based on user permissions
  const projectPosts = allPosts.filter(post => 
    canViewPost(userRole, post.frontmatter.status || 'private')
  );

  // Pagination
  const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page, 10) : 1;
  const POSTS_PER_PAGE = 5; 
  const totalPages = Math.ceil(projectPosts.length / POSTS_PER_PAGE);
  
  const startIndex = (page - 1) * POSTS_PER_PAGE;
  const endIndex = startIndex + POSTS_PER_PAGE;
  const currentPosts = projectPosts.slice(startIndex, endIndex);

  if (currentPosts.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8" style={{ color: 'var(--text-primary)' }}>{projectName}</h1>
        <div className="card-blog">
            {projectPosts.length === 0 ? (
                <>
                <p style={{ color: 'var(--text-primary)' }}>No posts found in this project.</p>
                <Link href="/blog/projects" className="back-link text-accent-indigo mt-4 inline-block">
                    ← Back to Projects
                </Link>
                </>
            ) : (
                 <p style={{ color: 'var(--text-primary)' }}>No posts found on this page.</p>
            )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-4">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{projectName}</h1>
        <Link 
          href="/blog/projects"
          className="back-link text-accent-indigo"
        >
          ← All Projects
        </Link>
      </div>

      <div className="space-y-6">
        {currentPosts.map((post: BlogPost) => (
          <Link
            key={post.slug}
            href={`/blog/projects/${project}/${post.slug}`}
            className="block"
          >
            <article className="card-blog group cursor-pointer">
              <div className="flex justify-between items-start">
                <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                  <span className="group-hover:text-accent-purple transition-colors">
                    {post.frontmatter.title}
                  </span>
                </h2>

                {(userRole === 'admin' || userRole === 'Admin' || userRole === 'Contributor') && (
                  <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                    post.frontmatter.status === 'public'
                      ? 'badge-public'
                      : 'badge-private'
                  }`}>
                    {post.frontmatter.status}
                  </span>
                )}
              </div>

              {post.frontmatter.description && (
                <p className="mb-3" style={{ color: 'var(--text-secondary)' }}>{post.frontmatter.description}</p>
              )}

              {post.frontmatter.date && (
                <div className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
                  {new Date(post.frontmatter.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              )}

              {post.frontmatter.tags && post.frontmatter.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {post.frontmatter.tags.map(tag => (
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
            <div className="flex justify-center items-center space-x-4 mt-8">
                {page > 1 ? (
                   <Link
                     href={`?page=${page - 1}`}
                     className="px-4 py-2 rounded-lg font-medium transition-colors bg-accent-purple text-white hover:bg-accent-purple/90"
                   >
                     Previous
                   </Link>
                ) : (
                  <span className="px-4 py-2 rounded-lg font-medium border border-slate-200 dark:border-slate-700" style={{ color: 'var(--text-muted)', backgroundColor: 'var(--bg-secondary)' }}>
                    Previous
                  </span>
                )}
                
                <span style={{ color: 'var(--text-muted)' }}>
                  Page {page} of {totalPages}
                </span>

                {page < totalPages ? (
                  <Link
                    href={`?page=${page + 1}`}
                    className="px-4 py-2 rounded-lg font-medium transition-colors bg-accent-purple text-white hover:bg-accent-purple/90"
                  >
                    Next
                  </Link>
                ) : (
                  <span className="px-4 py-2 rounded-lg font-medium border border-slate-200 dark:border-slate-700" style={{ color: 'var(--text-muted)', backgroundColor: 'var(--bg-secondary)' }}>
                    Next
                  </span>
                )}
            </div>
          )}
    </div>
  );
}
