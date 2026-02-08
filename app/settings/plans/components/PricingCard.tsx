// app/settings/plans/components/pricing-card.tsx
'use client';

import { Check, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import { useState } from 'react';
import { PricingTier, stripeProductIds } from '../data';

interface PricingCardProps {
  tier: PricingTier;
  title: string;
  price: string;
  features: string[];
  description: string;
}

export function PricingCard({
  tier,
  title,
  price,
  features,
  description,
}: Readonly<PricingCardProps>) {
  const [loading, setLoading] = useState(false);
  const { userId, isSignedIn } = useAuth();

  const handleUpgrade = async () => {
    try {
      setLoading(true);

      if (!isSignedIn) {
        window.location.href = '/sign-in?redirect=/settings/plans';
        return;
      }

      if (tier === 'enterprise') {
        window.location.href = '/contact-sales';
        return;
      }

      if (tier === 'basic') {
        window.location.href = '/dashboard';
        return;
      }

      const response = await fetch('/api/stripe/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: stripeProductIds[tier],
          userId: userId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();

      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error during checkout:', error);
      // Handle error - show toast notification or error message
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative rounded-lg bg-gray-800 p-6 transition-shadow hover:shadow-lg">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-blue-600">{title}</h2>
        <div className="mb-4 mt-2 text-2xl font-bold text-white">{price}</div>
        <p className="mb-4 text-gray-200">{description}</p>
      </div>

      <ul className="mb-8 space-y-2">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center gap-2">
            <Check className="h-4 w-4 text-blue-500" />
            <span className="text-gray-200">{feature}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={handleUpgrade}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            {tier === 'basic'
              ? 'Get Started'
              : tier === 'enterprise'
              ? 'Contact Sales'
              : `Upgrade to ${title.split(' ')[0]}`}
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
    </div>
  );
}
