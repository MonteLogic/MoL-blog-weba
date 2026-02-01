const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

// Configuration
const SCHEMA_PATH = path.join(
  process.cwd(),
  'blog-schema/categories-schema.json',
);
const POSTS_PATHS_JSON = path.join(
  process.cwd(),
  'blog-schema/file-paths/markdown-paths.json',
);

// Helper: Slugify (Must match app logic, but improved)
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\//g, '-') // Replace slashes with - FIRST
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars (except -)
    .replace(/\-\-+/g, '-'); // Replace multiple - with single -
}

function validateCategories() {
  // 1. Load Schema
  if (!fs.existsSync(SCHEMA_PATH)) {
    console.error(`ERROR: Schema file not found at ${SCHEMA_PATH}`);
    process.exit(1);
  }
  const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'));
  const validCategorySlugs = new Set(Object.keys(schema.categories));

  // 2. Load Post Paths
  if (!fs.existsSync(POSTS_PATHS_JSON)) {
    console.error(`ERROR: Posts path file not found at ${POSTS_PATHS_JSON}`);
    console.error('Run "npm run generate-markdown-paths" first?');
    process.exit(1);
  }
  const postPaths = JSON.parse(fs.readFileSync(POSTS_PATHS_JSON, 'utf8'));

  let errorCount = 0;

  postPaths.forEach((filePath) => {
    const fullPath = path.join(process.cwd(), filePath);

    if (!fs.existsSync(fullPath)) {
      console.warn(`WARN: Post file not found: ${fullPath}`);
      return;
    }

    // Skip directories
    if (fs.lstatSync(fullPath).isDirectory()) {
      return;
    }

    const fileContent = fs.readFileSync(fullPath, 'utf8');
    const { data } = matter(fileContent);

    // Extract categories to validate
    // Priority: category-slug(s) > slugify(category/categories)
    let slugsToValidate = [];

    if (data['category-slug'] || data['category-slugs']) {
      // Explicit slugs provided
      if (Array.isArray(data['category-slugs'])) {
        slugsToValidate = data['category-slugs'];
      } else if (typeof data['category-slug'] === 'string') {
        slugsToValidate = [data['category-slug']];
      }
    } else {
      // Fallback to slugifying titles
      let categories = [];
      if (data.categories && Array.isArray(data.categories)) {
        categories = data.categories;
      } else if (data.category && typeof data.category === 'string') {
        categories = [data.category];
      }
      slugsToValidate = categories.map((cat) => slugify(cat));
    }

    if (slugsToValidate.length === 0) {
      return;
    }

    slugsToValidate.forEach((slug) => {
      // Slugs in frontmatter should be exact matches to schema keys
      if (!validCategorySlugs.has(slug)) {
        console.error(
          `❌ INVALID CATEGORY SLUG: "${slug}" in file: ${filePath}`,
        );
        console.error(
          `   Allowed categories: ${Array.from(validCategorySlugs).join(', ')}`,
        );
        errorCount++;
      }
    });
  });

  if (errorCount > 0) {
    console.error(
      `\nValidation Failed: Found ${errorCount} invalid category usages.`,
    );
    process.exit(1);
  } else {
    process.exit(0);
  }
}

validateCategories();
