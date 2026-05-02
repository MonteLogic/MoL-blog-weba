import crypto from 'node:crypto';
import { revalidateTag } from 'next/cache';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-hub-signature-256');

    // Optional: Verify signature if secret is provided
    const secret = process.env['GITHUB_WEBHOOK_SECRET'];
    if (secret && signature) {
      const hmac = crypto.createHmac('sha256', secret);
      const digest = `sha256=${hmac.update(rawBody).digest('hex')}`;
      if (
        signature.length !== digest.length ||
        !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))
      ) {
        return new Response('Invalid signature', { status: 401 });
      }
    }

    // Clear the Next.js cache for the blog posts
    revalidateTag('blog-posts', 'default');

    return new Response('Cache cleared', { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('Webhook handler failed', { status: 500 });
  }
}
