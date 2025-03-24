
'use client';
import { ClerkLoading } from '@clerk/nextjs';
import SummaryPageBar from './task-bar';
import { FC } from 'react';

// Import the actual StripeSubscriptionStatus type from the types directory
import { StripeSubscriptionStatus } from '#/types/StripeClerkTypes';

/**
 * StripeProvider component - Handles rendering of Stripe-related UI components
 * 
 * This component checks if Stripe is properly configured in the environment
 * and conditionally renders the payment information summary.
 * 
 * @returns {JSX.Element | null} The rendered component or null if Stripe is not configured
 */
export const StripeProvider: FC = (): JSX.Element | null => {
  // Check if Stripe environment variable exists
  const hasStripeConfig: boolean = Boolean(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  );
  
  // If Stripe is not configured, don't render anything
  if (!hasStripeConfig) {
    return null;
  }
  
  // Default subscription data structure to pass to SummaryPageBar
  const defaultSubscriptionData: StripeSubscriptionStatus = {
    status: {
      isActive: true,
      planId: 'basic_plan',
      planName: 'Basic Plan',
      expiresAt: '',
      recentTransactions: [
        // Empty array of properly typed transaction objects
      ] as Array<{ id: string; amount: number; date: string; }>
    }
  };

  /**
   * Handler for subscription management button click
   */
  const handleManageSubscription = (): void => {
    console.log('Manage subscription clicked');
  };
  
  return (
    <div className="ml-4">
      <ClerkLoading>Loading ...</ClerkLoading>
      <div className="bg-white">
        <SummaryPageBar 
          paymentInfo={defaultSubscriptionData}
          onManageSubscription={handleManageSubscription}
        />
      </div>
    </div>
  );
};