'use client';

import React from 'react';
import { useUser } from '@clerk/nextjs';
import { getSecondMenu, useResolveSlug, type Item } from '#/lib/second-menu';
import Link from 'next/link';
import { useSelectedLayoutSegment } from 'next/navigation';
import { MenuAlt2Icon, XIcon } from '@heroicons/react/solid';
import clsx from 'clsx';
import { useState } from 'react';
import Byline from './byline';
import { CBudLogo } from './cbud-logo';
import { DarkModeToggle } from './dark-mode-toggle';
import packageJson from '#/package.json';

// Get project name from package.json config
const projectName = (packageJson as any).config?.niceNameOfProject || 'Blog';

export function GlobalNav() {
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const close = () => setIsOpen(false);

  const secondMenu = getSecondMenu(user?.id || '');
  const resolveSlug = useResolveSlug();

  return (
    <div
      className="fixed top-0 z-10 flex w-full flex-col border-b shadow-sm lg:bottom-0 lg:z-auto lg:w-72 lg:border-b-0 lg:border-r lg:shadow-none"
      style={{
        borderColor: 'var(--border-color)',
        backgroundColor: 'var(--bg-card)',
      }}
    >
      <div className="flex h-14 items-center px-4 py-4 lg:h-auto">
        <Link
          href="/"
          className="group flex items-center gap-x-2.5"
          onClick={close}
        >
          <div className="group-hover:border-accent-purple h-7 w-7 rounded-full border border-slate-300 transition-colors">
            <CBudLogo />
          </div>
          <h3
            className="group-hover:text-accent-purple font-semibold tracking-wide transition-colors"
            style={{ color: 'var(--text-primary)' }}
          >
            {projectName}
          </h3>
        </Link>
        <div className="ml-3">
          <DarkModeToggle />
        </div>
      </div>
      <button
        type="button"
        className="group absolute right-0 top-0 flex h-14 items-center gap-x-2 px-4 lg:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div
          className="group-hover:text-accent-purple font-medium transition-colors"
          style={{ color: 'var(--text-primary)' }}
        >
          Menu
        </div>
        {isOpen ? (
          <XIcon className="block w-6" style={{ color: 'var(--text-muted)' }} />
        ) : (
          <MenuAlt2Icon
            className="block w-6"
            style={{ color: 'var(--text-muted)' }}
          />
        )}
      </button>
      <div
        className={clsx('overflow-y-auto lg:static lg:block', {
          'fixed inset-x-0 bottom-0 top-14 mt-px': isOpen,
          hidden: !isOpen,
        })}
        style={isOpen ? { backgroundColor: 'var(--bg-card)' } : undefined}
      >
        <nav className="space-y-6 px-2 pb-24 pt-5">
          {secondMenu.map((section) => {
            return (
              <div key={section.name}>
                <div
                  className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <div>{section.name}</div>
                </div>
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <GlobalNavItem
                      key={item.slug}
                      item={item}
                      close={close}
                      resolveSlug={resolveSlug}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </nav>
        <Byline className="absolute hidden sm:block" />
      </div>
    </div>
  );
}

function GlobalNavItem({
  item,
  close,
  resolveSlug,
}: {
  item: Item;
  close: () => false | void;
  resolveSlug: (item: Item) => string;
}) {
  const segment = useSelectedLayoutSegment();
  const isActive = item.slug === segment;
  const href = `/${resolveSlug(item)}`;

  return (
    <Link
      onClick={close}
      href={href}
      className={clsx(
        'block rounded-lg px-3 py-2 text-sm font-medium transition-all',
        {
          'hover:bg-cream-200 dark:hover:bg-slate-700': !isActive,
          'bg-accent-purple/10 text-accent-purple font-semibold': isActive,
        },
      )}
      style={!isActive ? { color: 'var(--text-secondary)' } : undefined}
    >
      {item.name}
    </Link>
  );
}
