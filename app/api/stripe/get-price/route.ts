/**
 * @file app/api/stripe/get-price/route.ts
 * @description API route handler for fetching Stripe product prices
 */

import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripeSecretKey = process.env['STRIPE_SECRET_KEY'];

if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY environment variable is not set');
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-12-18.acacia',
});

/**
 * Fetches the price for a given Stripe product
 * @param request - The incoming HTTP request
 * @returns Promise<NextResponse> with price data
 */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 },
      );
    }

    // Get the price ID for the product
    const prices = await stripe.prices.list({
      product: productId,
      active: true,
      type: 'recurring',
    });

    if (!prices.data.length) {
      return NextResponse.json(
        { error: 'No price found for this product' },
        { status: 404 },
      );
    }

    const price = prices.data[0];

    if (!price) {
      return NextResponse.json(
        { error: 'No price found for this product' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      price: price.unit_amount,
      currency: price.currency,
    });
  } catch (error) {
    console.error('Error fetching price:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
