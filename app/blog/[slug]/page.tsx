// app/blog/[slug]/page.tsx
import React from 'react';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface GitHubFile {
  name: string;
  path: string;
  sha: string;
  download_url: string;
  content?: string;
  encoding?: string;
}

interface PostMetadata {
  title: string;
  description: string;
  date: string;
  author: string;
  categories: string[];
  tags: string[];
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

function extractFrontmatter(content: string): { metadata: PostMetadata | null; content: string } {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { metadata: null, content };
  }

  const frontmatter = match[1];
  const remainingContent = content.replace(match[0], '').trim();

  // Parse YAML-like frontmatter
  const metadata: any = {};
  frontmatter.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length) {
      let value = valueParts.join(':').trim();
      
      // Handle arrays (categories and tags)
      if (value.startsWith('-')) {
        metadata[key.trim()] = frontmatter
          .split(key + ':')[1]
          .split('\n')
          .filter(item => item.trim().startsWith('-'))
          .map(item => item.replace('-', '').trim());
      } else {
        // Handle regular values
        metadata[key.trim()] = value;
      }
    }
  });

  return {
    metadata: metadata as PostMetadata,
    content: remainingContent
  };
}

async function getPost(slug: string): Promise<{ metadata: PostMetadata | null; content: string }> {
  const url = `https://api.github.com/repos/MonteLogic/cbud-articles/contents/blog/${slug}.md`;
  
  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      if (response.status === 404) {
        notFound();
      }
      throw new Error(`Failed to fetch blog post: ${response.statusText}`);
    }

    const data: GitHubFile = await response.json();
    const contentResponse = await fetch(data.download_url);
    if (!contentResponse.ok) {
      throw new Error('Failed to fetch post content');
    }
    
    const rawContent = await contentResponse.text();
    return extractFrontmatter(rawContent);
  } catch (error) {
    console.error('Error fetching post:', error);
    throw error;
  }
}

export default async function BlogPost({ params }: { params: { slug: string } }) {
  const { metadata, content } = await getPost(params.slug);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Link 
        href="/blog"
        className="text-blue-400 hover:text-blue-300 mb-8 inline-flex items-center gap-2"
      >
        ← Back to blog
      </Link>
      
      {metadata && (
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{metadata.title}</h1>
          <p className="text-gray-400 mb-4">{metadata.description}</p>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>{metadata.author}</span>
            <span>•</span>
            <time>{metadata.date}</time>
          </div>
        </header>
      )}
      
      <article className="mt-8 prose prose-invert prose-lg max-w-none">
        <ReactMarkdown
          components={{
            a: CustomLink,
          }}
        >
          {content}
        </ReactMarkdown>
      </article>
    </div>
  );
}

export async function generateStaticParams() {
  const response = await fetch(
    'https://api.github.com/repos/MonteLogic/cbud-articles/contents/blog',
    {
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
    }
  );

  if (!response.ok) {
    return [];
  }

  const files: GitHubFile[] = await response.json();
  return files
    .filter(file => file.name.endsWith('.md'))
    .map(file => ({
      slug: file.name.replace('.md', ''),
    }));
}