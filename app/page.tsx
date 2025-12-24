import React from 'react';
import Link from 'next/link';
import packageJson from '#/package.json';

// Get project name from package.json config
const projectName = (packageJson as any).config?.niceNameOfProject || 'Blog';

export default function LandingPage() {
  return (
    <div 
      className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center"
    >
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
        Insights, guides, and notes on web development, workflows, and the
        tech journey.
      </p>
      <Link
        href="/blog"
        className="btn-primary inline-flex items-center gap-2 text-lg"
      >
        Explore the Blog <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}

