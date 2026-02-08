import fs from 'fs';
import path from 'path';
import { auth, currentUser } from '@clerk/nextjs/server';
import Link from 'next/link';

interface Project {
  slug: string;
  name: string;
  description?: string;
}

// Function to get projects by listing directories
async function getProjects(): Promise<Project[]> {
  const projectsDir = path.join(
    process.cwd(),
    'MoL-blog-content/posts/categorized/projects',
  );

  if (!fs.existsSync(projectsDir)) {
    return [];
  }

  const items = fs.readdirSync(projectsDir, { withFileTypes: true });

  const projects: Project[] = [];

  for (const item of items) {
    if (!item.isDirectory()) continue;

    const infoPath = path.join(projectsDir, item.name, 'info.json');

    // Check if info.json exists - fail build if missing
    if (!fs.existsSync(infoPath)) {
      throw new Error(
        `Build Error: Project "${item.name}" is missing a required info.json file. ` +
          `Please create: MoL-blog-content/posts/categorized/projects/${item.name}/info.json`,
      );
    }

    // Read info.json and parse it
    const infoContent = fs.readFileSync(infoPath, 'utf-8');
    const info = JSON.parse(infoContent);

    projects.push({
      slug: item.name,
      name: info.project || formatTitle(item.name),
      description: info.description || '',
    });
  }

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
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // Split CamelCase
  return slug.replace(/([A-Z])/g, ' $1').trim();
}

export default async function ProjectsPage() {
  const { userId } = await auth();
  let userRole: string | undefined;

  if (userId) {
    try {
      const user = await currentUser();
      userRole = user?.privateMetadata?.['role'] as string;
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  }

  const isAdmin = userRole === 'admin' || userRole === 'Admin';
  const projectTemplate = JSON.stringify(
    {
      project: 'Project Name',
      description: 'Describe what you are doing in the project.',
    },
    null,
    2,
  );
  const addProjectUrl = `https://github.com/MonteLogic/MoL-blog-content/new/main/posts/categorized/projects?filename=project-name/info.json&value=${encodeURIComponent(
    projectTemplate,
  )}`;

  const projects = await getProjects();

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-10 flex flex-col gap-4">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <h1 className="text-charcoal text-3xl font-bold">Projects</h1>
          <Link href="/blog" className="back-link text-accent-indigo">
            ← Back to Blog
          </Link>
        </div>

        {isAdmin && (
          <div
            className="flex flex-col gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-700 sm:flex-row sm:items-center"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            <span
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: 'var(--text-muted)' }}
            >
              Admin Area
            </span>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                href="/blog/projects/new"
                className="inline-flex items-center justify-center gap-2 rounded-md border border-indigo-600 bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Project
              </Link>
              <a
                href={addProjectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-600 bg-transparent px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <svg
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
                Add Project on GitHub
              </a>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {projects.map((project) => (
          <Link
            key={project.slug}
            href={`/blog/projects/${project.slug}`}
            className="group block"
          >
            <article className="card-blog hover:border-accent-purple/50 h-full hover:shadow-md">
              <h2 className="text-charcoal group-hover:text-accent-purple mb-2 text-xl font-semibold transition-colors">
                {project.name}
              </h2>
              {project.description && (
                <p className="text-charcoal-muted text-sm">
                  {project.description}
                </p>
              )}
              <div className="text-accent-indigo mt-4 flex -translate-x-2 items-center text-sm font-medium opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100">
                View Posts <span className="ml-1">→</span>
              </div>
            </article>
          </Link>
        ))}

        {projects.length === 0 && (
          <div className="text-charcoal-muted bg-cream-200 border-cream-300 col-span-full rounded-xl border py-12 text-center">
            <p>No projects found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
