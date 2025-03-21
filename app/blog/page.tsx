import React from 'react';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

interface BlogPost {
  slug: string;
  frontmatter: {
    title: string;
    date?: string;
    description?: string;
    tags?: string[];
    author?: string;
    [key: string]: any; // For additional frontmatter fields
  };
}

// Function to safely get blog posts, with fallback for production environments
async function getBlogPosts(): Promise<BlogPost[]> {
  try {
    // Path to your submodule posts directory
    const postsDirectory = path.join(process.cwd(), 'MoL-blog-content/posts');
    
    // Read all directories in the posts folder (each directory is a blog post)
    const postFolders = fs.readdirSync(postsDirectory, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    // Process each post folder
    const posts = postFolders.map(folderName => {
      // Look for index.mdx first, then fall back to index.md
      const mdxPath = path.join(postsDirectory, folderName, 'index.mdx');
      const mdPath = path.join(postsDirectory, folderName, 'index.md');
      
      let filePath = '';
      if (fs.existsSync(mdxPath)) {
        filePath = mdxPath;
      } else if (fs.existsSync(mdPath)) {
        filePath = mdPath;
      } else {
        return {
          slug: folderName,
          frontmatter: {
            title: formatTitle(folderName),
          }
        };
      }
      
      // Read file content
      const fileContent = fs.readFileSync(filePath, 'utf8');
      
      // Parse frontmatter using gray-matter
      const { data: frontmatter, content } = matter(fileContent);
      
      // Ensure title exists in frontmatter
      if (!frontmatter.title) {
        frontmatter.title = formatTitle(folderName);
      }
      
      return {
        slug: folderName,
        frontmatter
      };
    });
    
    // Sort posts by date if available (newest first)
    return posts.sort((a, b) => {
      if (a.frontmatter.date && b.frontmatter.date) {
        return new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime();
      }
      return 0;
    });
  } catch (error) {
    console.error('Error reading blog directory:', error);
    
    // Return an empty array in production if the directory doesn't exist
    if (process.env.NODE_ENV === 'production') {
      return [];
    }
    
    throw error;
  }
}

// Helper function to format folder name into a title
function formatTitle(folderName: string): string {
  // Remove date prefix if it exists (e.g., "12-20-2024-")
  const titleWithoutDate = folderName.replace(/^\d{2}-\d{2}-\d{4}-/, '');
  
  // Replace hyphens with spaces and capitalize each word
  return titleWithoutDate
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default async function BlogPage() {
  const posts = await getBlogPosts();

  if (posts.length === 0 && process.env.NODE_ENV === 'production') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-white mb-8">CBud Blog</h1>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <p className="text-white">
            Blog posts are currently being updated. Please check back later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-white mb-8">CBud Blog</h1>

      <div className="space-y-6">
        {posts.map((post: BlogPost) => (
          <article 
            key={post.slug} 
            className="bg-black border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-colors"
          >
            <h2 className="text-xl font-semibold mb-3">
              <Link 
                href={`/blog/${post.slug}`}
                className="text-blue-400 hover:text-blue-300 no-underline"
              >
                {post.frontmatter.title}
              </Link>
            </h2>
            
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
            
            {post.frontmatter.tags && post.frontmatter.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {post.frontmatter.tags.map(tag => (
                  <span key={tag} className="px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded-full">
                    {tag}
                  </span>
                ))}
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
      </div>
    </div>
  );
}