import React from 'react';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import { auth, currentUser } from '@clerk/nextjs/server';
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
async function getCategories(): Promise<
  { slug: string; name: string; description: string }[]
> {
  try {
    const schemaPath = path.join(
      process.cwd(),
      'blog-schema/categories-schema.json',
    );
    if (!fs.existsSync(schemaPath)) {
      return [];
    }
    const schemaFile = fs.readFileSync(schemaPath, 'utf8');
    const schema: CategorySchema = JSON.parse(schemaFile);

    const categories = Object.keys(schema.categories)
      .filter(
        (key) => schema.categories[key] && schema.categories[key].length > 0,
      )
      .map((key) => {
        const categoryArray = schema.categories[key];
        if (!categoryArray || categoryArray.length === 0) {
          return null;
        }
        const categoryData = categoryArray[0]; // Assuming array structure from schema
        if (!categoryData) {
          return null;
        }
        return {
          slug: key,
          name: formatTitle(key),
          description: categoryData.description || '',
          url: categoryData.url,
        };
      })
      .filter((category) => category !== null) as {
      slug: string;
      name: string;
      description: string;
      url: string;
    }[];

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
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default async function CategoriesPage() {
  const { userId } = await auth();
  let userRole: string | undefined;

  // Get user role directly from Clerk metadata
  if (userId) {
    try {
      const user = await currentUser();
      userRole = user?.privateMetadata?.['role'] as string;
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  }

  const categories = await getCategories();
  const isAdmin = userRole === 'admin' || userRole === 'Admin';
  const schemaRelativePath = 'blog-schema/categories-schema.json';
  // This needs URL needs to have tests around it.
  const repoBaseUrl = 'https://github.com/MonteLogic/MoL-blog-weba/blob/main';
  const githubFileUrl = `${repoBaseUrl}/${schemaRelativePath}`;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <h1
          className="text-3xl font-bold"
          style={{ color: 'var(--text-primary)' }}
        >
          Categories
        </h1>
        <Link href="/blog" className="back-link text-accent-indigo">
          ← Back to Blog
        </Link>

        {isAdmin && (
          <div
            className="flex items-center gap-4 rounded-lg border border-slate-200 p-3 dark:border-slate-700"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            <span
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: 'var(--text-muted)' }}
            >
              Admin Area
            </span>
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
            className="group block"
          >
            <article className="card-blog hover:border-accent-purple/50 h-full hover:shadow-md">
              <h2
                className="group-hover:text-accent-purple mb-2 text-xl font-semibold transition-colors"
                style={{ color: 'var(--text-primary)' }}
              >
                {category.name}
              </h2>
              {category.description && (
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {category.description}
                </p>
              )}
              <div className="text-accent-indigo mt-4 flex -translate-x-2 items-center text-sm font-medium opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100">
                View Posts <span className="ml-1">→</span>
              </div>
            </article>
          </Link>
        ))}

        {categories.length === 0 && (
          <div
            className="col-span-full rounded-xl border border-slate-200 py-12 text-center dark:border-slate-700"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-muted)',
            }}
          >
            <p>No categories found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
