import { auth, currentUser } from '@clerk/nextjs/server';
import Link from 'next/link';
import EditProjectPostForm from './edit-project-post-form';

export default async function EditProjectPostPage({
  params,
}: {
  params: Promise<{ project: string; post: string }>;
}) {
  const { project, post } = await params;
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
          Edit Post
        </h1>
        <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
          You need admin access to edit project posts.
        </p>
        <Link
          href={`/blog/projects/${project}/${post}`}
          className="text-accent-indigo hover:underline"
        >
          Back to Post
        </Link>
      </div>
    );
  }

  return <EditProjectPostForm projectSlug={project} postSlug={post} />;
}
