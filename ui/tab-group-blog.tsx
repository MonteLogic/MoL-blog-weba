'use client';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import React, { useEffect, useState, useRef } from 'react';

interface TabItem {
  text: string;
  slug?: string;
  href?: string;
}

interface TabGroupBlogProps {
  path: string;
  items: TabItem[];
}

// Loading spinner component
function LoadingSpinner() {
  return (
    <div 
      className="w-5 h-5 border-2 border-accent-purple border-t-transparent rounded-full animate-spin"
      role="status"
      aria-label="Loading"
    />
  );
}

export const TabGroupBlog: React.FC<TabGroupBlogProps> = ({ path, items }) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const targetPath = useRef<string | null>(null);

  // Stop loading when route actually changes
  useEffect(() => {
    if (targetPath.current && pathname === targetPath.current) {
      setIsLoading(false);
      targetPath.current = null;
    } else if (targetPath.current === null) {
      // Route changed without our click (browser back/forward)
      setIsLoading(false);
    }
  }, [pathname, searchParams]);

  const handleClick = (href: string) => {
    if (href !== pathname) {
      targetPath.current = href;
      setIsLoading(true);
    }
  };

  return (
    <div className="border-b flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
      <nav className="-mb-px flex space-x-8 overflow-x-auto scrollbar-hide" aria-label="Tabs">
        {items.map((item, index) => {
          const href = item.href ? item.href : (item.slug ? `${path}/${item.slug}` : path);

          const isActive =
            pathname === href ||
            (pathname?.startsWith(path + '/') &&
              item.slug &&
              pathname?.split('/')[2] === item.slug);

          return (
            <Link
              key={index}
              href={href}
              className={`inline-block rounded-t-lg px-4 py-2 font-medium transition-colors ${
                isActive
                  ? 'border-b-2 border-accent-purple font-semibold text-accent-purple'
                  : ''
              }`}
              style={!isActive ? { color: 'var(--text-muted)' } : undefined}
              onClick={() => handleClick(href)}
            >
              {item.text}
            </Link>
          );
        })}
      </nav>
      
      {/* Loading spinner in top-right corner */}
      <div className="w-5 h-5 flex items-center justify-center">
        {isLoading && <LoadingSpinner />}
      </div>
    </div>
  );
};