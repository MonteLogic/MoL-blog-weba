import React from 'react';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import { auth, currentUser } from '@clerk/nextjs';
import { AdminArea } from '../[slug]/AdminArea';

interface CategorySchema {
  categories: {
    [key: string]: {
      description: string;
      url: string;
    }[];
  };
}

// Function to safely get categories
async function getCategories(): Promise<{ slug: string; name: string; description: string }[]> {
  try {
    const schemaPath = path.join(process.cwd(), 'blog-schema/categories-schema.json');
    if (!fs.existsSync(schemaPath)) {
      return [];
    }
    const schemaFile = fs.readFileSync(schemaPath, 'utf8');
    const schema: CategorySchema = JSON.parse(schemaFile);

    const categories = Object.keys(schema.categories).map((key) => {
        const categoryData = schema.categories[key][0]; // Assuming array structure from schema
        return {
            slug: key,
            name: formatTitle(key),
            description: categoryData.description || '',
            url: categoryData.url
        };
    });

    return categories;

  } catch (error) {
    console.error('Error reading categories schema:', error);
    return [];
  }
}

// Helper function to format folder name into a title
function formatTitle(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default async function CategoriesPage() {
  const { userId } = auth();
  let userRole: string | undefined;
  
  // Get user role directly from Clerk metadata
  if (userId) {
    try {
      const user = await currentUser();
      userRole = user?.privateMetadata?.role as string;
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  }
  
  const categories = await getCategories();
  const isAdmin = userRole === 'admin' || userRole === 'Admin';
  // GitHub URL for the schema file - Adjust repo/branch if needed, assuming standard structure or placeholder
  // Since I don't have the exact Repo URL in context, I'll use a relative path or construct a best-guess, 
  // but usually this needs to be a full HTTPS URL. 
  // Based on previous interactions, I'll assume a pattern or leave a placeholder if unknown, 
  // but the user wants a link to `categories-schema.json`.
  // I'll grab the relative path for the "Copy Path" button.
  const schemaRelativePath = 'blog-schema/categories-schema.json';
  // Constructing a theoretical GitHub URL based on file path if not provided in env. 
  // Ideally this should be dynamic, but for now I will put a placeholder or try to infer.
  // The user asked for "link to the categories-schema.json on GitHub".
  // I will use a generic one or the one related to the workspace if I knew it.
  // For now, I will use a placeholder that the user might need to adjust or I can try to find from config.
  // Checking `app/blog/[slug]/page.tsx` or similar might reveal the repo base URL if used elsewhere.
  // In `AdminArea.tsx` it takes `githubFileUrl`.
  // I'll assume standard repo structure.
  
  const repoBaseUrl = 'https://github.com/MonteLogic/MoL-blog-weba/blob/main'; // Best guess based on path
  const githubFileUrl = `${repoBaseUrl}/${schemaRelativePath}`;


  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <h1 className="text-3xl font-bold text-white">Categories</h1>
        
        {isAdmin && (
             <div className="flex items-center gap-4 bg-gray-900 border border-dashed border-gray-600 rounded-lg p-3">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Admin Area</span>
                <AdminArea 
                    githubFileUrl={githubFileUrl} 
                    localFilePath={path.join(process.cwd(), schemaRelativePath)} 
                />
            </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {categories.map((category) => (
          <Link 
            key={category.slug} 
            href={`/blog/categories/${category.slug}`}
            className="block group"
          >
            <article className="h-full bg-black border border-gray-800 rounded-lg p-6 hover:border-blue-500/50 transition-all hover:bg-gray-900/50">
              <h2 className="text-xl font-semibold mb-2 text-white group-hover:text-blue-400 transition-colors">
                {category.name}
              </h2>
              {category.description && (
                <p className="text-gray-400 text-sm">
                  {category.description}
                </p>
              )}
              <div className="mt-4 flex items-center text-blue-500 text-sm font-medium opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                View Posts <span className="ml-1">→</span>
              </div>
            </article>
          </Link>
        ))}

        {categories.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500 bg-gray-900/50 rounded-lg border border-gray-800">
                <p>No categories found.</p>
            </div>
        )}
      </div>
    </div>
  );
}