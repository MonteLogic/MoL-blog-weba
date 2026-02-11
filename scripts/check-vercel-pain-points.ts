import { readFileSync } from 'node:fs';
import nodePath from 'node:path';
import process from 'node:process';

const isVercel =
  process.env['VERCEL'] === '1' ||
  process.env['VERCEL'] === 'true' ||
  typeof process.env['VERCEL_ENV'] === 'string';

if (!isVercel) {
  process.exit(0);
}

const packageJsonPath = nodePath.resolve(process.cwd(), 'package.json');
let packageConfig: { config?: { author?: string } } = {};

try {
  packageConfig = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
    config?: { author?: string };
  };
} catch (error) {
  console.warn('[Vercel Check] Unable to read package.json config.', error);
}

const ownerFromPackage = packageConfig?.config?.author;
const owner = process.env['NEXT_PUBLIC_GITHUB_OWNER'] ?? ownerFromPackage;
const repo = process.env['NEXT_PUBLIC_GITHUB_REPO'] ?? 'MoL-blog-content';

const path = 'posts/categorized/pain-points';
const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

const headers: HeadersInit = {
  Accept: 'application/vnd.github.v3+json',
};

if (process.env['CONTENT_GH_TOKEN']) {
  headers['Authorization'] = `Bearer ${process.env['CONTENT_GH_TOKEN']}`;
}

const fail = (message: string, detail?: unknown) => {
  if (detail) {
    console.error(message, detail);
  } else {
    console.error(message);
  }
  process.exit(1);
};

if (!owner) {
  fail(
    '[Vercel Check] GitHub owner is missing. Set NEXT_PUBLIC_GITHUB_OWNER or package.json config.author.',
  );
}

const checkPainPoints = async () => {
  const res = await fetch(apiUrl, { headers });

  if (!res.ok) {
    fail(
      `[Vercel Check] Pain points fetch failed (${res.status} ${res.statusText}).`,
    );
  }

  const data = await res.json();
  if (!Array.isArray(data)) {
    fail('[Vercel Check] Pain points response was not an array.');
  }

  if (data.length === 0) {
    console.warn(
      '[Vercel Check] Pain points directory is empty. Deployment continues.',
    );
  }
};

checkPainPoints().catch((error) => {
  fail('[Vercel Check] Unexpected error during pain points check.', error);
});
