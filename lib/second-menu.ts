export type Item = {
  name: string;
  slug: string;
  description?: string;
};

export const getSecondMenu = (
  userId: string,
): { name: string; items: Item[] }[] => [
  {
    name: 'Menu',
    items: [
      {
        name: 'Home',
        slug: '/',
        description: 'Home page showing a summary view.',
      },
      {
        name: 'My Profile',
        slug: `employees/${userId}`,
        description: 'My Profile page.',
      },
      {
        name: 'Skill Tree',
        slug: 'skill-tree',
        description: 'View and track skill progression.',
      },
      {
        name: 'View Pain Points',
        slug: 'blog/pain-points',
        description: 'View Pain Points',
      },
      {
        name: 'View Projects',
        slug: 'blog/projects',
        description: 'View Projects',
      },
      {
        name: 'Blog',
        slug: 'blog',
        description: 'CBud Documentation',
      },
    ],
  },
];

// Updated to respect the passed-in database ID
export const useResolveSlug = () => {
  return (item: Item): string => {
    // Don't modify the slug if it's already set with a specific ID
    if (item.slug.startsWith('employees/')) {
      return item.slug;
    }
    return item.slug;
  };
};
