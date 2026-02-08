import { NextResponse } from 'next/server';
import YAML from 'yaml';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const { description, progress, demand } = body;

    if (!description) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 },
      );
    }

    // Prepare YAML content
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const yamlData = {
      date: dateStr,
      description: description,
      progress: typeof progress === 'number' ? progress : 0,
      demand: typeof demand === 'number' ? demand : 0,
    };

    const yamlString = YAML.stringify(yamlData);

    // Generate unique filename with timestamp to avoid collisions
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `update-${timestamp}.yaml`;

    const owner = process.env['NEXT_PUBLIC_GITHUB_OWNER'];
    const repo = process.env['NEXT_PUBLIC_GITHUB_REPO'];
    const path = `posts/categorized/pain-points/${slug}/updates/${filename}`;
    const token = process.env['CONTENT_GH_TOKEN'];

    if (!token || !owner || !repo) {
      return NextResponse.json(
        {
          error:
            'GitHub configuration not complete (token, owner, or repo missing)',
        },
        { status: 500 },
      );
    }

    // Convert content to Base64
    const contentEncoded = Buffer.from(yamlString).toString('base64');

    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github.v3+json',
      },
      body: JSON.stringify({
        message: `Add update to ${slug}`,
        content: contentEncoded,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error('GitHub API Error:', errorData);
      return NextResponse.json(
        { error: 'Failed to create update on GitHub', details: errorData },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error creating update:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
