import { clerkClient } from '@clerk/nextjs/server';
import { SubscriptionMetadata } from '#/types/StripeClerkTypes';

export async function updateUserSubscriptionMetadata(
  userId: string,
  subscriptionData: Partial<SubscriptionMetadata>,
): Promise<void> {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);

    // Get existing metadata to merge with new data
    const existingMetadata = user.privateMetadata?.['subscription'] || {};

    // Merge existing metadata with new subscription data
    const updatedMetadata = {
      ...existingMetadata,
      ...subscriptionData,
      updatedAt: new Date().toISOString(),
    };

    // Update user's private metadata
    await client.users.updateUser(userId, {
      privateMetadata: {
        ...user.privateMetadata,
        subscription: updatedMetadata,
      },
    });
  } catch (error) {
    console.error('Error updating user subscription metadata:', error);
    throw new Error('Failed to update subscription metadata');
  }
}
