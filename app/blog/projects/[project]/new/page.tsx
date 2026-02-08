import { auth, currentUser } from '@clerk/nextjs/server';
import Link from 'next/link';
import NewProjectPostForm from './new-project-post-form';

export default async function NewProjectPostPage({
  params,
}: {
  params: Promise<{ project: string }>;
}) {
  const { project } = await params;
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

  const canManagePosts =
    userRole === 'admin' || userRole === 'Admin' || userRole === 'Contributor';

  if (!canManagePosts) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <h1
          className="mb-4 text-3xl font-bold"
          style={{ color: 'var(--text-primary)' }}
        >
          Add Project Post
        </h1>
        <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
          You need admin access to add project posts.
        </p>
        <Link
          href={`/blog/projects/${project}`}
          className="text-accent-indigo hover:underline"
        >
          Back to Project
        </Link>
      </div>
    );
  }

  return <NewProjectPostForm projectSlug={project} />;
}
