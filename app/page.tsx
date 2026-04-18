import React from 'react';
import Link from 'next/link';
import packageJson from '#/package.json';
import { auth } from '@clerk/nextjs/server';
import { getSecondMenu } from '#/lib/second-menu';

// Get project name from package.json config
const projectName = (packageJson as any).config?.niceNameOfProject || 'Blog';

export default async function LandingPage() {
  const { userId } = await auth();
  const menuSections = getSecondMenu(userId || '');
  const menuItems = menuSections.flatMap((section) => section.items);

  return (
    <div className="flex flex-col items-center p-6 text-center">
      <h1
        className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl"
        style={{ color: 'var(--text-primary)' }}
      >
        {projectName}
      </h1>
      <p
        className="mb-8 max-w-lg text-lg leading-relaxed"
        style={{ color: 'var(--text-secondary)' }}
      >
        Insights, guides, and notes on web development, workflows, and the tech
        journey.
      </p>

      <div className="mt-8 grid w-full max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
        {menuItems.map((item) => {
          const href = item.slug.startsWith('/') ? item.slug : `/${item.slug}`;
          return (
            <Link
              key={item.slug}
              href={href}
              className="group flex flex-col items-start rounded-xl border p-6 shadow-sm transition-all hover:border-slate-400 hover:shadow-md dark:hover:border-slate-500"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-color)',
              }}
            >
              <h3
                className="group-hover:text-accent-purple mb-2 text-xl font-semibold transition-colors"
                style={{ color: 'var(--text-primary)' }}
              >
                {item.name}
              </h3>
              <p
                className="text-left text-sm"
                style={{ color: 'var(--text-secondary)' }}
              >
                {item.description || `View the ${item.name} section`}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
