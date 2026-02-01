import fs from 'fs';
import path from 'path';

import { auth, currentUser } from '@clerk/nextjs/server';
import matter from 'gray-matter';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypePrettyCode from 'rehype-pretty-code';
import remarkGfm from 'remark-gfm';

// Define types
interface BlogPostParams {
  readonly slug: string;
}

interface ParsedPost {
  readonly frontmatter: Record<string, unknown>;
  readonly content: string;
  readonly isMdx: boolean;
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
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Options for MDX processing - restructured to match required types
const mdxOptions = {
  remarkPlugins: [remarkGfm],
  rehypePlugins: [rehypePrettyCode],
};

// Helper function to check if user can view a post based on role and post status
function canViewPost(
  userRole: string | undefined,
  postStatus: string,
): boolean {
  // If the post is public, everyone can view it
  if (postStatus === 'public') {
    return true;
  }

  // If the post is private, only Admin and Contributor can view it
  return (
    userRole === 'admin' || userRole === 'Admin' || userRole === 'Contributor'
  );
}

// Helper function to get parsed blog post content
function getParsedPost(slug: string): ParsedPost {
  const postsDirectory = path.join(process.cwd(), 'MoL-blog-content/posts');
  const postDirectory = path.join(postsDirectory, slug);

  // Look for MDX file first, then fall back to MD
  const mdxPath = path.join(postDirectory, 'index.mdx');
  const mdPath = path.join(postDirectory, 'index.md');

  let filePath = '';
  let isMdx = false;

  if (fs.existsSync(mdxPath)) {
    filePath = mdxPath;
    isMdx = true;
  } else if (fs.existsSync(mdPath)) {
    filePath = mdPath;
    isMdx = false;
  } else {
    throw new Error(`Blog post not found: ${slug}`);
  }

  // Read file content
  const source = fs.readFileSync(filePath, 'utf8');

  // Parse frontmatter
  const { data: frontmatter, content } = matter(source);

  // Ensure title exists using nullish coalescing assignment
  frontmatter['title'] ??= formatTitle(slug);

  return { frontmatter, content, isMdx };
}

// Helper function to check if user has elevated role
function hasElevatedRole(userRole: string | undefined): boolean {
  return (
    userRole === 'admin' || userRole === 'Admin' || userRole === 'Contributor'
  );
}

// Helper function to render tags
function renderTags(tags: string[]): React.ReactNode {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {tags.map((tag: string) => (
        <span
          key={tag}
          className="rounded-full bg-gray-800 px-3 py-1 text-sm text-gray-300"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

// Helper function to render post header
function renderPostHeader(
  frontmatter: Record<string, unknown>,
  postStatus: string,
  userRole: string | undefined,
): React.ReactNode {
  const title = frontmatter['title'] as string;
  const description = frontmatter['description'] as string | undefined;
  const date = frontmatter['date'] as string | undefined;
  const author = frontmatter['author'] as string | undefined;
  const tags = frontmatter['tags'] as string[] | undefined;

  return (
    <header className="mb-8">
      <div className="flex items-start justify-between">
        <h1 className="text-3xl font-bold text-white">{title}</h1>

        {/* Show status badge for Admin and Contributor */}
        {hasElevatedRole(userRole) && (
          <span
            className={`rounded-full px-3 py-1 text-sm ${
              postStatus === 'public'
                ? 'border border-green-800 bg-green-900/30 text-green-400'
                : 'border border-yellow-800 bg-yellow-900/30 text-yellow-400'
            }`}
          >
            {postStatus}
          </span>
        )}
      </div>

      {description && (
        <p className="mt-3 text-xl text-gray-300">{description}</p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-4">
        {date && (
          <div className="text-gray-400">
            {new Date(date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
        )}

        {author && <div className="text-gray-400">By {author}</div>}
      </div>

      {tags && tags.length > 0 && renderTags(tags)}
    </header>
  );
}

// Helper function to render MDX content
function renderContent(content: string, isMdx: boolean): React.ReactNode {
  if (isMdx) {
    // Use MDXRemote for .mdx files (server component)
    // @ts-ignore
    return (
      <MDXRemote
        source={content}
        components={components}
        options={{
          mdxOptions,
        }}
      />
    );
  }

  // Use ReactMarkdown for .md files (client component)
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} className="markdown-content">
      {content}
    </ReactMarkdown>
  );
}

// Helper function to render error page
function renderErrorPage(): React.ReactNode {
  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <Link href="/blog" className="text-blue-400 hover:text-blue-300">
          ← Back to all posts
        </Link>
      </div>

      <div className="rounded-lg border border-red-500 bg-red-900/20 p-6">
        <h1 className="mb-4 text-3xl font-bold text-red-500">Post Not Found</h1>
        <p className="text-white">
          This blog post could not be found or you do not have permission to
          view it.
        </p>
      </div>
    </div>
  );
}

// Blog post page component
export default async function BlogPost({
  params,
}: Readonly<{ params: BlogPostParams }>): Promise<React.ReactNode> {
  const { slug } = params;
  const { userId } = await auth();
  let userRole: string | undefined;

  // Get user role directly from Clerk metadata
  if (userId) {
    try {
      const user = await currentUser();
      // Access privateMetadata for the role
      userRole = user?.privateMetadata['role'] as string;
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  }

  try {
    // Get the markdown content for this blog post
    const { frontmatter, content, isMdx } = getParsedPost(slug);

    // Set default status to private if not specified
    const postStatus =
      frontmatter['status'] === 'public' ? 'public' : 'private';

    // Check if the current user can access this post
    if (!canViewPost(userRole, postStatus)) {
      // Redirect to blog list page if user doesn't have permission
      redirect('/blog');
    }

    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="mb-6">
          <Link href="/blog" className="text-blue-400 hover:text-blue-300">
            ← Back to all posts
          </Link>
        </div>

        <article className="prose prose-invert prose-lg max-w-none">
          {renderPostHeader(frontmatter, postStatus, userRole)}

          <div className="mdx-content">{renderContent(content, isMdx)}</div>
        </article>
      </div>
    );
  } catch (error) {
    console.error('Error rendering blog post:', error);
    return renderErrorPage();
  }
}
