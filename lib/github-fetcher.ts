import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export interface BlogPost {
  slug: string;
  filePath: string;
  frontmatter: {
    title: string;
    date?: string;
    description?: string;
    tags?: string[];
    author?: string;
    status?: string;
    categories?: string[];
    categorySlugs?: string[];
    [key: string]: any;
  };
  content: string;
}

// --- Helper Functions ---
function generateBaseSlug(filePathFromJson: string): string {
  const postsBaseDirString = 'MoL-blog-content/posts/';
  let normalizedFilePath = filePathFromJson.replace(/\\/g, '/').trim();

  let relativePathToPostsDir: string;
  if (normalizedFilePath.startsWith(postsBaseDirString)) {
    relativePathToPostsDir = normalizedFilePath.substring(
      postsBaseDirString.length,
    );
  } else {
    relativePathToPostsDir = normalizedFilePath;
  }

  const fileExtension = path.posix.extname(relativePathToPostsDir);
  const baseFilename = path.posix.basename(
    relativePathToPostsDir,
    fileExtension,
  );

  let slugCandidate: string;
  if (baseFilename.toLowerCase() === 'index') {
    const parentDirName = path.posix.basename(
      path.posix.dirname(relativePathToPostsDir),
    );
    slugCandidate =
      parentDirName === '.' || parentDirName === '' ? 'home' : parentDirName;
  } else {
    slugCandidate = baseFilename;
  }

  const slug = slugCandidate
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '');

  if (!slug) {
    const pathHash = Buffer.from(filePathFromJson)
      .toString('hex')
      .substring(0, 8);
    return `post-${pathHash}`;
  }
  return slug;
}

export function formatTitle(namePart: string): string {
  const titleWithoutDate = namePart.replace(/^\d{2}-\d{2}-\d{4}-/, '');
  return titleWithoutDate
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// --- GraphQL Query Builder ---
function generateDeepQuery(depth: number): string {
  let query = `... on Blob { text }`;
  for (let i = 0; i < depth; i++) {
    query = `... on Tree { entries { name type object { ${query} } } }`;
  }
  return `
    query {
      repository(owner: "MonteLogic", name: "MoL-blog-content") {
        object(expression: "main:posts") {
          ${query}
        }
      }
    }
  `;
}

// --- Local File Fetching (Development Fallback) ---
async function fetchLocalPosts(): Promise<BlogPost[]> {
  const jsonFilePath = path.join(
    process.cwd(),
    'generated/markdown-paths.json',
  );
  if (!fs.existsSync(jsonFilePath)) {
    console.warn('markdown-paths.json not found locally.');
    return [];
  }

  const jsonFileContent = fs.readFileSync(jsonFilePath, 'utf8');
  const markdownFilePaths: string[] = JSON.parse(jsonFileContent);
  const rawFiles = markdownFilePaths.map((filePath) => {
    const fullMarkdownPath = path.join(process.cwd(), filePath.trim());
    if (fs.existsSync(fullMarkdownPath) && !fs.statSync(fullMarkdownPath).isDirectory()) {
      return {
        path: filePath.trim(),
        text: fs.readFileSync(fullMarkdownPath, 'utf8')
      };
    }
    return null;
  }).filter(Boolean) as { path: string, text: string }[];

  return processRawFiles(rawFiles);
}

// --- Remote Fetching (Production) ---
async function fetchRemotePosts(): Promise<BlogPost[]> {
  const CONTENT_GH_TOKEN = process.env['CONTENT_GH_TOKEN'];
  if (!CONTENT_GH_TOKEN) {
    console.error('CRITICAL: CONTENT_GH_TOKEN environment variable is missing.');
    return [];
  }

  // Generate a query deep enough to cover nested directories (e.g., 12 levels)
  const query = generateDeepQuery(12);

  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${CONTENT_GH_TOKEN}`,
    },
    body: JSON.stringify({ query }),
    next: {
      tags: ['blog-posts'],
    },
  });

  if (!res.ok) {
    console.error('Failed to fetch from GitHub GraphQL API', await res.text());
    return [];
  }

  const json = await res.json();
  if (json.errors) {
    console.error('GraphQL Errors:', json.errors);
    return [];
  }

  const treeObject = json.data?.repository?.object;
  if (!treeObject) {
    return [];
  }

  // Recursive extraction
  const rawFiles: { path: string; text: string }[] = [];
  function extractBlobs(entries: any[], currentPath: string) {
    for (const entry of entries) {
      const entryPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
      if (entry.type === 'blob' && entry.name.match(/\.mdx?$/)) {
        if (entry.object?.text) {
          rawFiles.push({ path: `MoL-blog-content/posts/${entryPath}`, text: entry.object.text });
        }
      } else if (entry.type === 'tree' && entry.object?.entries) {
        extractBlobs(entry.object.entries, entryPath);
      }
    }
  }

  if (treeObject.entries) {
    extractBlobs(treeObject.entries, '');
  }

  return processRawFiles(rawFiles);
}

// --- Common Processor ---
function processRawFiles(rawFiles: { path: string; text: string }[]): BlogPost[] {
  const posts: BlogPost[] = [];
  const slugOccurrences: { [key: string]: number } = {};

  for (const file of rawFiles) {
    const baseSlug = generateBaseSlug(file.path);
    let finalUniqueSlug: string;

    if (slugOccurrences[baseSlug] === undefined) {
      slugOccurrences[baseSlug] = 0;
      finalUniqueSlug = baseSlug;
    } else {
      slugOccurrences[baseSlug]++;
      finalUniqueSlug = `${baseSlug}-${slugOccurrences[baseSlug]}`;
    }

    const { data: parsedFrontmatter, content } = matter(file.text);

    // Determine titleSource from original path structure
    const postsBaseDirString = 'MoL-blog-content/posts/';
    let originalNormalizedPath = file.path.replace(/\\/g, '/');
    let originalRelativePath = originalNormalizedPath.startsWith(
      postsBaseDirString,
    )
      ? originalNormalizedPath.substring(postsBaseDirString.length)
      : originalNormalizedPath;

    const originalFileExt = path.posix.extname(originalRelativePath);
    const originalBaseFileNameForTitle = path.posix.basename(
      originalRelativePath,
      originalFileExt,
    );
    const originalParentDirName = path.posix.basename(
      path.posix.dirname(originalRelativePath),
    );

    let titleSourceName: string;
    if (originalBaseFileNameForTitle.toLowerCase() === 'index') {
      titleSourceName =
        originalParentDirName && originalParentDirName !== '.'
          ? originalParentDirName
          : originalBaseFileNameForTitle;
    } else {
      titleSourceName = originalBaseFileNameForTitle;
    }

    let rawCategories: string[] = [];
    let categorySlugs: string[] = [];

    if (
      parsedFrontmatter['categories'] &&
      Array.isArray(parsedFrontmatter['categories'])
    ) {
      rawCategories = parsedFrontmatter['categories'];
    } else if (
      parsedFrontmatter['category'] &&
      typeof parsedFrontmatter['category'] === 'string'
    ) {
      rawCategories = [parsedFrontmatter['category']];
    }

    if (
      parsedFrontmatter['category-slug'] ||
      parsedFrontmatter['category-slugs']
    ) {
      if (Array.isArray(parsedFrontmatter['category-slugs'])) {
        categorySlugs = parsedFrontmatter['category-slugs'];
      } else if (typeof parsedFrontmatter['category-slug'] === 'string') {
        categorySlugs = [parsedFrontmatter['category-slug']];
      }
    } else {
      categorySlugs = rawCategories.map((cat) =>
        cat
          .toString()
          .toLowerCase()
          .trim()
          .replace(/\//g, '-')
          .replace(/\s+/g, '-')
          .replace(/[^\w-]+/g, '')
          .replace(/-+/g, '-'),
      );
    }

    const frontmatter: BlogPost['frontmatter'] = {
      ...(parsedFrontmatter as object),
      title: parsedFrontmatter['title'] ?? formatTitle(titleSourceName),
      status: parsedFrontmatter['status'] === 'private' ? 'private' : 'public',
      categories: rawCategories,
      categorySlugs: categorySlugs,
    };

    posts.push({
      slug: finalUniqueSlug,
      filePath: file.path,
      frontmatter,
      content,
    });
  }

  return posts.sort((a, b) => {
    if (a.frontmatter.date && b.frontmatter.date) {
      return (
        new Date(b.frontmatter.date).getTime() -
        new Date(a.frontmatter.date).getTime()
      );
    }
    if (a.frontmatter.date) return -1;
    if (b.frontmatter.date) return 1;
    return 0;
  });
}

// --- Main Exported Functions ---
export async function getBlogPosts(): Promise<BlogPost[]> {
  if (process.env.NODE_ENV !== 'production') {
    return fetchLocalPosts();
  }
  return fetchRemotePosts();
}

export async function getPostDataBySlug(slug: string): Promise<BlogPost | null> {
  const posts = await getBlogPosts();
  return posts.find(p => p.slug === slug) || null;
}
