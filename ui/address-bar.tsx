
'use client';
import { ClerkLoading, useSession } from '@clerk/nextjs';
import { UserButton } from '@clerk/nextjs';
import { checkUserRole } from '#/utils/UserUtils';
import TaskBar from './task-bar';
import Link from 'next/link';

export function AddressBar({ subscriptionData }: { subscriptionData?: any }) {
  const { session, isLoaded } = useSession();
  const userRole = session ? checkUserRole(session) : null;
  
  // Show loading state that maintains layout
  if (!isLoaded) {
    return (
      <div className="flex items-center gap-x-2 p-4 lg:px-5 lg:py-4">
        <div className="flex gap-x-1 text-sm font-medium text-charcoal-muted">
          <div className="animate-pulse flex items-center">
            {/* Circle placeholder for avatar */}
            <div className="h-8 w-8 rounded-full bg-cream-300"></div>
            <div className="ml-4 h-4 w-24 rounded bg-cream-300"></div>
          </div>
        </div>
      </div>
    );
  }
  
  // Only show sign-in button when we're sure user is not logged in
  if (!session) {
    return (
      <div className="flex items-center p-4 lg:px-5 lg:py-4">
        <Link 
          href={process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? '/sign-in'} 
          className="btn-primary"
        >
          Sign In
        </Link>
      </div>
    );
  }
  
  // Render full component for logged-in users
  return (
    <div className="flex items-center gap-x-2 p-4 lg:px-5 lg:py-4">
      <div className="flex gap-x-1 text-sm font-medium">
        <div>
          <UserButton afterSignOutUrl="/" />
        </div>
        <div>
          <ClerkLoading>Loading ...</ClerkLoading>
          <div className="bg-white">
            <TaskBar
              paymentInfo={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && subscriptionData ? {
                status: {
                  isActive: subscriptionData.status.isActive,
                  planId: subscriptionData.status.planId,
                  expiresAt: subscriptionData.status.expiresAt,
                  planName: subscriptionData.status.planName,
                  recentTransactions: [],
                },
              } : undefined}
            />
          </div>
        </div>
      </div>
    </div>
  );
}