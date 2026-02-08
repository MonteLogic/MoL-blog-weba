const fs = require('fs');
const path = require('path');

const jsonPath = path.join(
  process.cwd(),
  'blog-schema/file-paths/markdown-paths.json',
);

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
          directories++;
        } else if (stats.isFile()) {
          validFiles++;
        }
      } else {
        missing++;
      }
    } catch (e) {
      errors++;
    }
  });
} catch (e) {
  console.error('Failed to read JSON:', e);
}
