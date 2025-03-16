'use server';

import CreateOrganization from '#/ui/create-organization';
import { UserButton, auth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';

export default async function Page() {
  const { userId, orgId } = auth();
  
  // Redirect to home if user already has an organization
  if (orgId) {
    redirect('/home');
  }

  return (
    <div className="relative z-0 space-y-10 text-white">
      <div className="space-y-5">
        <div className="text-gray-1800 text-xs font-semibold uppercase tracking-wider">
          <div className="flex gap-2">
            <CreateOrganization />
            <UserButton />
          </div>
        </div>
      </div>
    </div>
  );
}