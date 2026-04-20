import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const projectRoot = process.cwd();

// 1. Read Markdown Paths
const markdownPathsFile = path.join(
  projectRoot,
  'generated/markdown-paths.json',
);

let markdownPaths: string[] = [];
if (fs.existsSync(markdownPathsFile)) {
  const content = fs.readFileSync(markdownPathsFile, 'utf8');
  markdownPaths = JSON.parse(content);
}

// tag -> whether at least one PUBLIC post uses it
const tagPublicPostCount = new Map<string, boolean>();

// Process Markdown files — only count tags from public (or status-unset) posts
for (const filePath of markdownPaths) {
  const fullPath = path.join(projectRoot, filePath);
  if (fs.existsSync(fullPath)) {
    try {
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) continue;

      const fileContent = fs.readFileSync(fullPath, 'utf8');
      const { data } = matter(fileContent);

      // Skip posts that are explicitly marked private
      const status = data['status'];
      const isPublic = status !== 'private';

      if (data['tags'] && Array.isArray(data['tags'])) {
        for (const tag of data['tags']) {
          const normalizedTag = String(tag).trim();
          if (!normalizedTag) continue;

          // Mark the tag as having a public post if this post is public
          if (isPublic) {
            tagPublicPostCount.set(normalizedTag, true);
          } else if (!tagPublicPostCount.has(normalizedTag)) {
            // Tag exists but only in private posts so far — record but don't mark public
            tagPublicPostCount.set(normalizedTag, false);
          }
        }
      }
    } catch (e) {
      console.error(`Error parsing frontmatter for ${fullPath}:`, e);
    }
  }
}

// YAML pain points: they are served at /blog/pain-points, not /blog.
// They are skipped here intentionally — their tags don't apply to the markdown blog filter.

// 3. Write tags.json — only emit tags backed by at least one public post
const outputTagsFile = path.join(projectRoot, 'generated', 'tags.json');
const sortedTags = Array.from(tagPublicPostCount.entries())
  .filter(([, hasPublicPost]) => hasPublicPost)
  .map(([tag]) => tag)
  .sort();

fs.writeFileSync(outputTagsFile, JSON.stringify(sortedTags, null, 2), 'utf8');
console.log(
  `Generated tags.json with ${sortedTags.length} unique tags (public posts only).`,
);
