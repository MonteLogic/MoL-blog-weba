import React from 'react';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';
// import { auth } from '@clerk/nextjs';

interface Project {
  slug: string;
  name: string;
  description?: string;
}

// Function to get projects by listing directories
async function getProjects(): Promise<Project[]> {
  const projectsDir = path.join(process.cwd(), 'MoL-blog-content/posts/categorized/projects');
  
  if (!fs.existsSync(projectsDir)) {
    return [];
  }

  const items = fs.readdirSync(projectsDir, { withFileTypes: true });
  
  const projects = items
    .filter(item => item.isDirectory())
    .map(item => {
      // Try to read a description if available (optional enhancement)
      // For now, just using the name
      return {
        slug: item.name,
        name: formatTitle(item.name),
        description: '' // Placeholder for now
      };
    });

  return projects;
}

// Helper function to format folder name into a title
function formatTitle(slug: string): string {
  // Handle camelCase or kebab-case
  // For EasyReactApp -> Easy React App
  // For mo99sh -> Mo99sh
  // Simple heuristic: split by capital letters if camelCase, or hyphens if kebab
  
  if (slug.includes('-')) {
      return slug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
  }
  
  // Split CamelCase
  return slug.replace(/([A-Z])/g, ' $1').trim();
}

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <h1 className="text-3xl font-bold text-white">Projects</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {projects.map((project) => (
          <Link 
            key={project.slug} 
            href={`/blog/projects/${project.slug}`}
            className="block group"
          >
            <article className="h-full bg-black border border-gray-800 rounded-lg p-6 hover:border-blue-500/50 transition-all hover:bg-gray-900/50">
              <h2 className="text-xl font-semibold mb-2 text-white group-hover:text-blue-400 transition-colors">
                {project.name}
              </h2>
              {project.description && (
                <p className="text-gray-400 text-sm">
                  {project.description}
                </p>
              )}
              <div className="mt-4 flex items-center text-blue-500 text-sm font-medium opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                View Posts <span className="ml-1">→</span>
              </div>
            </article>
          </Link>
        ))}

        {projects.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500 bg-gray-900/50 rounded-lg border border-gray-800">
                <p>No projects found.</p>
            </div>
        )}
      </div>
    </div>
  );
}
