// #/ui/tab-group-blog.tsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation'; // Use usePathname instead of useRouter
import React from 'react';

interface TabItem {
  text: string;
  slug?: string; // Optional slug for dynamic routes
}

interface TabGroupBlogProps {
  path: string; // Base path for the tabs
  items: TabItem[];
}

export const TabGroupBlog: React.FC<TabGroupBlogProps> = ({ path, items }) => {
  const pathname = usePathname(); // Get the pathname

    return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        {items.map((item, index) => {
          // Generate the href based on the item's text if slug is not provided
          const slug = item.slug || (item.text === 'Home' ? '' : item.text.toLowerCase().replace(/\s+/g, '-'));
          const href = slug ? `${path}/${slug}` : path;
          
          const isActive =
            pathname === href ||
            (pathname?.startsWith(path + '/') &&
              slug &&
              pathname?.split('/')[2] === slug);
              
          return (
            <Link
              key={index}
              href={href}
              className={`inline-block rounded-t-lg px-4 py-2 font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 ${
                isActive
                  ? 'border-b-2 border-indigo-500 font-semibold text-indigo-700'
                  : ''
              }`}
            >
              {item.text}
            </Link>
          );
        })}
      </nav>
    </div>
  );

};
