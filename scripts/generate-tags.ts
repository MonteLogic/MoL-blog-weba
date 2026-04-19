import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import YAML from 'yaml';

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

const allTags = new Set<string>();

// Process Markdown files
for (const filePath of markdownPaths) {
  const fullPath = path.join(projectRoot, filePath);
  if (fs.existsSync(fullPath)) {
    try {
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) continue;

      const fileContent = fs.readFileSync(fullPath, 'utf8');
      const { data } = matter(fileContent);

      if (data['tags'] && Array.isArray(data['tags'])) {
        for (const tag of data['tags']) {
          if (tag) allTags.add(String(tag).trim());
        }
      }
    } catch (e) {
      console.error(`Error parsing frontmatter for ${fullPath}:`, e);
    }
  }
}

// 2. Process Pain Points (YAML)
const possiblePainPointsPaths = [
  process.env['CONTENT_DIR'],
  path.join(
    projectRoot,
    'MoL-blog-content',
    'posts',
    'categorized',
    'pain-points',
  ),
  path.join(
    projectRoot,
    '..',
    'MoL-blog-content',
    'posts',
    'categorized',
    'pain-points',
  ),
].filter(Boolean) as string[];

let painPointsDir: string | null = null;
for (const p of possiblePainPointsPaths) {
  if (fs.existsSync(p)) {
    painPointsDir = p;
    break;
  }
}

if (painPointsDir) {
  function scanDirForYaml(dir: string) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        scanDirForYaml(fullPath);
      } else if (file.endsWith('.yaml') || file.endsWith('.yml')) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          const data = YAML.parse(content);
          if (data && data['tags'] && Array.isArray(data['tags'])) {
            for (const tag of data['tags']) {
              if (tag) allTags.add(String(tag).trim());
            }
          }
        } catch (e) {
          console.error(`Error parsing YAML for ${fullPath}:`, e);
        }
      }
    }
  }
  scanDirForYaml(painPointsDir);
}

// 3. Write tags.json
const outputTagsFile = path.join(projectRoot, 'generated', 'tags.json');
const sortedTags = Array.from(allTags).sort();

fs.writeFileSync(outputTagsFile, JSON.stringify(sortedTags, null, 2), 'utf8');
console.log(`Generated tags.json with ${sortedTags.length} unique tags.`);
