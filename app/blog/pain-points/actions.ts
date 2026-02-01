'use server';

import { auth, currentUser } from '@clerk/nextjs/server';

export async function checkIsAdmin() {
  try {
    const { userId } = await auth();
    if (!userId) return false;

    const user = await currentUser();
    const role = user?.privateMetadata?.role as string;
    return role === 'admin' || role === 'Admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}
