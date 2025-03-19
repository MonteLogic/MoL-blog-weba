import React from 'react';
import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

// Define types
interface BlogPostParams {
  slug: string;
}

// Remove generateStaticParams to avoid build-time errors with submodules
// The pages will be generated dynamically at request time instead

// Custom link component for ReactMarkdown
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

// Blog post page component
export default async function BlogPost({ params }: { params: BlogPostParams }) {
  const { slug } = params;
  
  try {
    // Get the markdown content for this blog post
    const postsDirectory = path.join(process.cwd(), 'MoL-blog-content/posts');
    const postDirectory = path.join(postsDirectory, slug);
    const contentPath = path.join(postDirectory, 'index.md');
    
    // Check if index.md exists
    if (!fs.existsSync(contentPath)) {
      throw new Error(`Blog post not found: ${slug}`);
    }
    
    // Read markdown content
    const content = fs.readFileSync(contentPath, 'utf8');
    
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <Link href="/blog" className="text-blue-400 hover:text-blue-300">
            ← Back to all posts
          </Link>
        </div>
        
        <article className="prose prose-invert prose-lg max-w-none">
          <ReactMarkdown
            components={{
              a: CustomLink,
              // You can customize other components as needed
            }}
          >
            {content}
          </ReactMarkdown>
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