import { auth, currentUser } from '@clerk/nextjs/server';
import Link from 'next/link';
import NewProjectForm from './new-project-form';

export default async function NewProjectPage() {
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

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <h1
          className="mb-4 text-3xl font-bold"
          style={{ color: 'var(--text-primary)' }}
        >
          Add Project
        </h1>
        <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
          You need admin access to add projects.
        </p>
        <Link
          href="/blog/projects"
          className="text-accent-indigo hover:underline"
        >
          Back to Projects
        </Link>
      </div>
    );
  }

  return <NewProjectForm />;
}
