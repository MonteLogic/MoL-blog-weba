import { NextResponse } from 'next/server';
import YAML from 'yaml';

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const body = await request.json();
    const { title, description, demandScore, progressScore, tags } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Generate sub-slug from title
    const subSlug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');

    // Prepare YAML content
    const yamlData = {
      title,
      description: description || '',
      demandScore: typeof demandScore === 'number' ? demandScore : 5,
      progressScore: typeof progressScore === 'number' ? progressScore : 0,
      tags: tags || [],
      createdAt: new Date().toISOString(),
    };

    const yamlString = YAML.stringify(yamlData);
    const filename = `${subSlug}.yaml`;

    const owner = 'MonteLogic';
    const repo = 'MoL-blog-content';
    const path = `posts/categorized/pain-points/${slug}/sub-pain-points/${filename}`;
    const token = process.env.CONTENT_GH_TOKEN;

    if (!token) {
      return NextResponse.json({ error: 'GitHub token not configured' }, { status: 500 });
    }

    // Convert content to Base64
    const contentEncoded = Buffer.from(yamlString).toString('base64');

    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json',
      },
      body: JSON.stringify({
        message: `Add sub pain point "${title}" to ${slug}`,
        content: contentEncoded,
      })
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error('GitHub API Error:', errorData);
      return NextResponse.json({ error: 'Failed to create sub pain point on GitHub', details: errorData }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error('Error creating sub pain point:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
