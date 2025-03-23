import React from 'react';
import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import matter from 'gray-matter';
import { MDXRemote } from 'next-mdx-remote/rsc';
import rehypePrettyCode from 'rehype-pretty-code';
import remarkGfm from 'remark-gfm';

// Define types
interface BlogPostParams {
  slug: string;
}

interface Frontmatter {
  title: string;
  date?: string;
  description?: string;
  tags?: string[];
  author?: string;
  [key: string]: any; // For additional frontmatter fields
}

// Custom components for MDX
const components = {
  // You can add custom components here to be used in MDX
  // Example: CustomAlert: (props) => <div className="bg-yellow-100 p-4">{props.children}</div>,
};

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

// Options for MDX processing
const options = {
  mdxOptions: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [[rehypePrettyCode, { theme: 'github-dark' }]],
  },
};

// Blog post page component
export default async function BlogPost({ params }: { params: BlogPostParams }) {
  const { slug } = params;
  
  try {
    // Get the markdown content for this blog post
    const postsDirectory = path.join(process.cwd(), 'MoL-blog-content/posts');
    const postDirectory = path.join(postsDirectory, slug);
    
    // Look for MDX file first, then fall back to MD
    const mdxPath = path.join(postDirectory, 'index.mdx');
    const mdPath = path.join(postDirectory, 'index.md');
    
    let filePath = '';
    if (fs.existsSync(mdxPath)) {
      filePath = mdxPath;
    } else if (fs.existsSync(mdPath)) {
      filePath = mdPath;
    } else {
      throw new Error(`Blog post not found: ${slug}`);
    }
    
    // Read file content
    const source = fs.readFileSync(filePath, 'utf8');
    
    // Parse frontmatter
    const { data: frontmatter, content } = matter(source);
    
    // Ensure title exists
    if (!frontmatter.title) {
      frontmatter.title = formatTitle(slug);
    }
    
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <Link href="/blog" className="text-blue-400 hover:text-blue-300">
            ← Back to all posts
          </Link>
        </div>
        
        <article className="prose prose-invert prose-lg max-w-none">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-white">{frontmatter.title}</h1>
            
            {frontmatter.description && (
              <p className="text-xl text-gray-300 mt-3">{frontmatter.description}</p>
            )}
            
            <div className="flex flex-wrap items-center gap-4 mt-4">
              {frontmatter.date && (
                <div className="text-gray-400">
                  {new Date(frontmatter.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              )}
              
              {frontmatter.author && (
                <div className="text-gray-400">
                  By {frontmatter.author}
                </div>
              )}
            </div>
            
            {frontmatter.tags && frontmatter.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {frontmatter.tags.map((tag: string) => (
                  <span key={tag} className="px-3 py-1 bg-gray-800 text-gray-300 text-sm rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </header>
          
          <div className="mdx-content">
            {/* @ts-ignore - MDXRemote types in RSC mode */}
            <MDXRemote source={content} components={components} options={options} />
          </div>
        </article>
      </div>
    );
  } catch (error) {
    console.error('Error rendering blog post:', error);
    
    // Handle errors (file not found, etc.)
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <Link href="/blog" className="text-blue-400 hover:text-blue-300">
            ← Back to all posts
          </Link>
        </div>
        
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-6">
          <h1 className="text-3xl font-bold text-red-500 mb-4">Post Not Found</h1>
          <p className="text-white">
            This blog post could not be found. It may not be available in the current environment.
          </p>
        </div>
      </div>
    );
  }
}