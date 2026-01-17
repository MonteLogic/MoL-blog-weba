
import { NextResponse } from 'next/server';
import YAML from 'yaml';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, inconvenience, workaround, limitation, demandScore, progressScore, tags } = body;

    if (!title) {
        return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Prepare YAML content
    const yamlData = {
        title,
        "how does it inconvience you": inconvenience || "",
        "what have you done as a workaround": workaround || "",
        "how does this pain point limit what you want to do": limitation || "",
        "on a scale of 1 - 10 how badly would you want the solution to your paint point": demandScore || 0,
        "how much progress have the tech you or someone you're working has gone to fixing the pain point": progressScore || 0,
        tags: tags || []
    };

    const yamlString = YAML.stringify(yamlData);
    
    // Generate filename from title
    // Simple slugification: lowercase, remove special chars, replace spaces with hyphens
    const slug = title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
    
    // Add a random suffix to avoid collisions if needed, or just handle collision by erroring (GitHub will return 422 if we don't provide sha and file exists, or overwrite? PUT overwrites if no SHA provided usually? actually GitHub Create File requires just path. If exists it might overwrite or error depending on params. safer to maybe add timestamp)
    // Actually, let's keep it simple for now. 
    const filename = `${slug}.yaml`;

    const owner = 'MonteLogic';
    const repo = 'MoL-blog-content';
    // New Structure: posts/categorized/pain-points/[slug]/[slug].yaml
    const path = `posts/categorized/pain-points/${slug}/${filename}`;
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
            message: `Add pain point: ${title}`,
            content: contentEncoded,
            // committer: { name: ... } // Optional, uses auth user
        })
    });

    if (!res.ok) {
        const errorData = await res.json();
        console.error('GitHub API Error:', errorData);
        return NextResponse.json({ error: 'Failed to create file on GitHub', details: errorData }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error('Error creating pain point:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
