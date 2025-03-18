import React from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import fs from 'fs';
import path from 'path';

interface BlogPost {
  slug: string;
  content: string;
}

async function getBlogPosts(): Promise<BlogPost[]> {
  // Path to your submodule posts directory
  const postsDirectory = path.join(process.cwd(), 'MoL-blog-content/posts');
  
  // Read all directories in the posts folder (each directory is a blog post)
  const postFolders = fs.readdirSync(postsDirectory, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
  
  // Get content for each post
  const blogPosts = postFolders.map(folderName => {
    // Check if index.md exists in the folder
    const indexPath = path.join(postsDirectory, folderName, 'index.md');
    
    if (!fs.existsSync(indexPath)) {
      console.warn(`No index.md found in ${folderName}`);
      // Return a placeholder if the index.md doesn't exist
      return {
        slug: folderName,
        content: 'No content available'
      };
    }
    
    // Read the content of index.md
    const content = fs.readFileSync(indexPath, 'utf8');
    
    return {
      slug: folderName,
      content
    };
  });
  
  // You can add sorting logic here if needed
  
  return blogPosts;
}

const CustomLink = (props: any) => {
  const href = props.href;
  const isInternalLink = href && (href.startsWith('/') || href.startsWith('#'));

  if (isInternalLink) {
    return (
      <Link href={href} {...props}>
        {props.children}
      </Link>
    );
  }

  return <a target="_blank" rel="noopener noreferrer" {...props} />;
};

export default async function BlogPage() {
  const posts = await getBlogPosts();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-white mb-8">CBud Blog</h1>

      <div className="space-y-6">
        {posts.map((post: BlogPost) => {
          // Extract the first heading from the markdown content for use as title
          const titleMatch = post.content.match(/^#\s+(.+)$/m);
          const title = titleMatch ? titleMatch[1] : post.slug;
          
          return (
            <article 
              key={post.slug} 
              className="bg-black border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-colors"
            >
              <h2 className="text-xl font-semibold mb-3">
                <Link 
                  href={`/blog/${post.slug}`}
                  className="text-blue-400 hover:text-blue-300 no-underline"
                >
                  {title}
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
          );
        })}
      </div>
    </div>
  );
}