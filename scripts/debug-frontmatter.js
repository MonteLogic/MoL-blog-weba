const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const targetFilePath = 'MoL-blog-content/posts/categorized/articles/categorized/next.js/current-style-of-generating-pdfs-for-cbud/index.md';

function debugPost() {
    const fullPath = path.join(process.cwd(), targetFilePath);
    
    if (!fs.existsSync(fullPath)) {
        console.error(`File not found: ${fullPath}`);
        return;
    }

    console.log(`Reading file: ${fullPath}`);
    const fileContent = fs.readFileSync(fullPath, 'utf8');
    const { data } = matter(fileContent);

    console.log('--- Frontmatter ---');
    console.log(JSON.stringify(data, null, 2));

    // Simulation of getBlogPosts logic
    let rawCategories = [];
    let categorySlugs = [];

    // 1. Get Display Names
    if (data.categories && Array.isArray(data.categories)) {
        rawCategories = data.categories;
    } else if (data.category && typeof data.category === 'string') {
        rawCategories = [data.category];
    }

    // 2. Get Slugs
    if (data['category-slug'] || data['category-slugs']) {
            if (Array.isArray(data['category-slugs'])) {
            categorySlugs = data['category-slugs'];
        } else if (typeof data['category-slug'] === 'string') {
            categorySlugs = [data['category-slug']];
        }
    } else {
        // Fallback: slugify the display names
            categorySlugs = rawCategories.map(cat => 
            cat.toString().toLowerCase().trim()
            .replace(/\//g, '-') // Replace slashes first
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-')
        );
    }

    console.log('--- Derived Data ---');
    console.log('rawCategories:', rawCategories);
    console.log('categorySlugs:', categorySlugs);

    const slugToMatch = 'work-notes';
    const isMatch = categorySlugs.includes(slugToMatch);
    console.log(`Checking match for slug "${slugToMatch}":`, isMatch);
}

debugPost();
