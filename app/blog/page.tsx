import React from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

interface GitHubFile {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string;
  type: string;
  content?: string;
  encoding?: string;
}

interface BlogPost extends GitHubFile {
  preview: string;
  content: string;
}

async function getBlogPosts(): Promise<GitHubFile[]> {
  const response = await fetch(
    'https://api.github.com/repos/MonteLogic/cbud-articles/contents/blog',
    {
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
      next: { revalidate: 3600 },
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch blog posts');
  }

  const files: GitHubFile[] = await response.json();
  return files.filter((file: GitHubFile) => file.name.endsWith('.md'));
}

async function getMarkdownContent(url: string): Promise<{ preview: string; content: string }> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch markdown content');
  }
  
  const content = await response.text();
  
  // Get first paragraph for preview
  const firstParagraph = content.split('\n\n')[0];
  const preview = firstParagraph.length > 150 
    ? `${firstParagraph.slice(0, 150)}...` 
    : firstParagraph;
  
  return { preview, content };
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
  const postsWithContent: BlogPost[] = await Promise.all(
    posts.map(async (post: GitHubFile) => {
      const { preview, content } = await getMarkdownContent(post.download_url);
      return {
        ...post,
        preview,
        content,
      };
    })
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-white mb-8">CBud Blog</h1>

      <div className="space-y-6">
        {postsWithContent.map((post: BlogPost) => (
          <article 
            key={post.sha} 
            className="bg-black border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-colors"
          >
            <h2 className="text-xl font-semibold mb-3">
              <Link 
                href={`/blog/${post.name.replace('.md', '')}`}
                className="text-blue-400 hover:text-blue-300 no-underline"
              >
                {post.name
                  .replace('.md', '')
                  .split('-')
                  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(' ')}
              </Link>
            </h2>
            <div className="prose prose-invert prose-sm max-w-none mb-4">
              <ReactMarkdown
                components={{
                  a: CustomLink,
                  // Only render paragraph and link elements in preview
                  h1: () => null,
                  h2: () => null,
                  h3: () => null,
                  h4: () => null,
                  h5: () => null,
                  h6: () => null,
                  img: () => null,
                  pre: () => null,
                  code: () => null,
                }}
              >
                {post.preview}
              </ReactMarkdown>
            </div>
            <div>
              <Link
                href={`/blog/${post.name.replace('.md', '')}`}
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