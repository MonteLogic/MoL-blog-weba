const fs = require('fs');
const path = require('path');

const jsonPath = path.join(
  process.cwd(),
  'blog-schema/file-paths/markdown-paths.json',
);

console.log('Checking paths from:', jsonPath);

try {
  const content = fs.readFileSync(jsonPath, 'utf8');
  const paths = JSON.parse(content);

  let validFiles = 0;
  let directories = 0;
  let missing = 0;
  let errors = 0;

  paths.forEach((p, i) => {
    const fullPath = path.join(process.cwd(), p);
    try {
      if (fs.existsSync(fullPath)) {
        const stats = fs.statSync(fullPath);
        if (stats.isDirectory()) {
          console.log(`[DIR] ${p}`);
          directories++;
        } else if (stats.isFile()) {
          validFiles++;
        } else {
          console.log(`[OTHER] ${p}`);
        }
      } else {
        console.log(`[MISSING] ${p}`);
        missing++;
      }
    } catch (e) {
      console.log(`[ERROR] ${p}: ${e.message}`);
      errors++;
    }
  });

  console.log('--- Summary ---');
  console.log(`Total Paths: ${paths.length}`);
  console.log(`Valid Files: ${validFiles}`);
  console.log(`Directories: ${directories}`);
  console.log(`Missing: ${missing}`);
  console.log(`Errors: ${errors}`);
} catch (e) {
  console.error('Failed to read JSON:', e);
}
