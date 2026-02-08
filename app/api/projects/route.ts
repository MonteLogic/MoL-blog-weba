import fs from 'fs';
import path from 'path';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

function slugifyProjectName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\x00-\x7F]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { project, description } = body;

    if (!project) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 },
      );
    }

    const slug = slugifyProjectName(project);

    if (!slug) {
      return NextResponse.json(
        { error: 'Project name must include letters or numbers' },
        { status: 400 },
      );
    }

    const infoJson = JSON.stringify(
      {
        project,
        description: description || '',
      },
      null,
      2,
    );

    const localProjectsDir = path.join(
      process.cwd(),
      'MoL-blog-content/posts/categorized/projects',
    );
    const localProjectDir = path.join(localProjectsDir, slug);
    const localInfoPath = path.join(localProjectDir, 'info.json');
    let wroteLocal = false;

    if (fs.existsSync(localProjectsDir)) {
      fs.mkdirSync(localProjectDir, { recursive: true });
      fs.writeFileSync(localInfoPath, infoJson, 'utf-8');
      wroteLocal = true;
    }

    const owner = process.env['NEXT_PUBLIC_GITHUB_OWNER'];
    const repo = process.env['NEXT_PUBLIC_GITHUB_REPO'];
    const token = process.env['CONTENT_GH_TOKEN'];
    const contentPath = `posts/categorized/projects/${slug}/info.json`;

    if (!token || !owner || !repo) {
      if (wroteLocal) {
        revalidatePath('/blog/projects');
        return NextResponse.json({ success: true, localOnly: true, slug });
      }
      return NextResponse.json(
        {
          error:
            'GitHub configuration not complete (token, owner, or repo missing)',
        },
        { status: 500 },
      );
    }

    const contentEncoded = Buffer.from(infoJson).toString('base64');
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${contentPath}`;

    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github.v3+json',
      },
      body: JSON.stringify({
        message: `Add project: ${project}`,
        content: contentEncoded,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error('GitHub API Error:', errorData);
      return NextResponse.json(
        { error: 'Failed to create project on GitHub', details: errorData },
        { status: res.status },
      );
    }

    const data = await res.json();
    revalidatePath('/blog/projects');
    return NextResponse.json({ success: true, data, slug });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
