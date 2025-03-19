import React from 'react';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';

interface BlogPost {
  slug: string;
  title: string;
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
    
    // Get title for each post
    return postFolders.map(folderName => {
      // Check if index.md exists in the folder
      const indexPath = path.join(postsDirectory, folderName, 'index.md');
      
      let title = folderName;
      
      // Try to extract a better title from the first heading in the MD file
      if (fs.existsSync(indexPath)) {
        const content = fs.readFileSync(indexPath, 'utf8');
        const titleMatch = content.match(/^#\s+(.+)$/m);
        if (titleMatch) {
          title = titleMatch[1];
        }
      }
      
      return {
        slug: folderName,
        title
      };
    });
  } catch (error) {
    console.error('Error reading blog directory:', error);
    
    // Return an empty array in production if the directory doesn't exist
    // This prevents the build from failing in Vercel
    if (process.env.NODE_ENV === 'production') {
      return [];
    }
    
    throw error;
  }
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
                {post.title}
              </Link>
            </h2>
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