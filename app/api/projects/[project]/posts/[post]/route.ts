import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

function generatePostSlug(relativePath: string): string {
  const normalized = relativePath.replace(/\\/g, '/');
  const ext = path.posix.extname(normalized);
  const withoutExt = normalized.slice(0, -ext.length);

  let slug = withoutExt.replace(/\//g, '-');

  if (slug.endsWith('-index') || slug === 'index') {
    slug = slug.replace(/-?index$/, '') || 'index';
  }

  slug = slug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return slug || 'post';
}

function findProjectPostFile(
  projectSlug: string,
  postSlug: string,
): string | null {
  const projectDir = path.join(
    process.cwd(),
    'MoL-blog-content/posts/categorized/projects',
    projectSlug,
  );

  if (!fs.existsSync(projectDir)) {
    return null;
  }

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

  for (const filePath of markdownFiles) {
    const relativePath = path.relative(projectDir, filePath);
    const fileSlug = generatePostSlug(relativePath);

    if (fileSlug === postSlug) {
      return filePath;
    }
  }

  return null;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ project: string; post: string }> },
) {
  try {
    const { project, post } = await context.params;
    const filePath = findProjectPostFile(project, post);

    if (!filePath) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const source = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(source);
    const relativePath = path.relative(process.cwd(), filePath);

    return NextResponse.json({
      frontmatter: data,
      content,
      relativePath,
    });
  } catch (error) {
    console.error('Error loading project post:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ project: string; post: string }> },
) {
  try {
    const { project, post } = await context.params;
    const body = await request.json();
    const { title, description, date, tags, status, content, relativePath } =
      body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    let filePath = relativePath
      ? path.join(process.cwd(), relativePath)
      : findProjectPostFile(project, post);

    if (!filePath || !fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (!filePath.includes('MoL-blog-content/posts/categorized/projects')) {
      return NextResponse.json({ error: 'Invalid post path' }, { status: 400 });
    }

    const source = fs.readFileSync(filePath, 'utf8');
    const { data, content: existingContent } = matter(source);

    const updatedFrontmatter: Record<string, unknown> = {
      ...data,
      title,
      description: description ?? data['description'] ?? '',
      date: date ?? data['date'],
      tags: Array.isArray(tags) ? tags : data['tags'],
      status: status ?? data['status'],
    };

    const updatedMarkdown = matter.stringify(
      content ?? existingContent ?? '',
      updatedFrontmatter,
    );

    fs.writeFileSync(filePath, updatedMarkdown, 'utf-8');

    const owner = process.env['NEXT_PUBLIC_GITHUB_OWNER'];
    const repo = process.env['NEXT_PUBLIC_GITHUB_REPO'];
    const token = process.env['CONTENT_GH_TOKEN'];

    if (token && owner && repo) {
      const relativeContentPath = filePath
        .replace(path.join(process.cwd(), 'MoL-blog-content') + path.sep, '')
        .replace(/\\/g, '/');
      const url = `https://api.github.com/repos/${owner}/${repo}/contents/${relativeContentPath}`;

      const shaRes = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (!shaRes.ok) {
        const errorData = await shaRes.json();
        console.error('GitHub API Error:', errorData);
        return NextResponse.json(
          { error: 'Failed to load GitHub file metadata', details: errorData },
          { status: shaRes.status },
        );
      }

      const shaData = await shaRes.json();
      const updateRes = await fetch(url, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/vnd.github.v3+json',
        },
        body: JSON.stringify({
          message: `Update project post: ${title}`,
          content: Buffer.from(updatedMarkdown).toString('base64'),
          sha: shaData.sha,
        }),
      });

      if (!updateRes.ok) {
        const errorData = await updateRes.json();
        console.error('GitHub API Error:', errorData);
        return NextResponse.json(
          { error: 'Failed to update post on GitHub', details: errorData },
          { status: updateRes.status },
        );
      }
    }

    revalidatePath(`/blog/projects/${project}`);
    revalidatePath(`/blog/projects/${project}/${post}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating project post:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
