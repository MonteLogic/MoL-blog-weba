// scripts/validate-pain-points.ts
import fs from 'fs';
import path from 'path';
import YAML from 'yaml';

// Define the directory to scan
const projectRoot = process.cwd();
// Try to find the content directory similar to generate.ts logic
const possiblePaths = [
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
].filter(Boolean);

let painPointsDir: string | null = null;

for (const p of possiblePaths) {
  if (p && fs.existsSync(p)) {
    painPointsDir = p;
    break;
  }
}

if (!painPointsDir) {
  console.warn('Pain points directory not found, skipping validation.');
  process.exit(0);
}

console.log(`Validating pain points in: ${painPointsDir}`);

const files = fs
  .readdirSync(painPointsDir)
  .filter((file) => file.endsWith('.yaml') || file.endsWith('.yml'));

// Define forbidden placeholder patterns
const forbiddenPatterns = [
  /\[insert text here\]/i,
  /\[insert number/i,
  /\[insert date here\]/i,
  /\[tag1\]/i,
  /\[tag2\]/i,
  /\[tag3\]/i,
  /I cannot \[insert text here\]/i,
];

let hasErrors = false;

files.forEach((file) => {
  const filePath = path.join(painPointsDir!, file);
  const content = fs.readFileSync(filePath, 'utf8');

  // Check raw content for placeholders
  const errors: string[] = [];

  forbiddenPatterns.forEach((pattern) => {
    if (pattern.test(content)) {
      errors.push(`Found placeholder matching ${pattern}`);
    }
  });

  if (errors.length > 0) {
    console.error(`\n❌ Validation Error in ${file}:`);
    errors.forEach((err) => console.error(`  - ${err}`));
    hasErrors = true;
  } else {
    // Optional: Parse YAML to check values specifically if needed
    // But regex is usually enough for "insert text here"
  }
});

if (hasErrors) {
  console.error(
    '\nBuild failed: Pain point files contain placeholder text. Please update them.',
  );
  process.exit(1);
} else {
  console.log('✅ Pain point validation passed.');
  process.exit(0);
}
