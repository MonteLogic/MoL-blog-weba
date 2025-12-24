import '#/styles/globals.css';
import { AddressBar } from '#/ui/address-bar';
import Byline from '#/ui/byline';
import { GlobalNav } from '#/ui/global-nav';
import { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import { cache } from 'react';
import { Analytics } from '@vercel/analytics/next';
import titles from '#/titles.json';

export const metadata: Metadata = {
  title: {
    default: titles.title,
    template: '%s | MonteLogic',
  },
  description:
    titles.title +
    ' is an online system for managing contractors concerns. These concerns include scheduling, timecards, route management and time management. This easy to use app will make truck drivers and route managers working lives much easier.',
  openGraph: {
    title: titles.title,
    description:
      'Contractor Bud is an online system for managing contractors concerns. These concerns include scheduling, timecards, route management and time management. This easy to use app will make truck drivers and route managers working lives much easier.',
    images: [`/api/og?title=Next.js App Router`],
  },
  twitter: {
    card: 'summary_large_image',
  },
};

const getUserData = cache(async () => {
  const { userId: clerkUserId } = auth();

  if (!clerkUserId) {
    return {
      title: 'No user logged in',
      description: 'This description comes from the server',
      userID: '',
      dbUserId: null,
    };
  }
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const userData = await getUserData();

  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className="overflow-y-scroll pb-36" style={{ backgroundColor: 'var(--bg-primary)' }}>
          <GlobalNav userData={userData} />
          <div className="lg:pl-72">
            <div className="mx-auto max-w-4xl space-y-8 px-2 pt-20 lg:px-8 lg:py-8">
              <div className="rounded-xl p-px shadow-sm" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', borderWidth: '1px' }}>
                <div className="rounded-xl" style={{ backgroundColor: 'var(--bg-card)' }}>
                  <AddressBar />
                </div>
              </div>
              <div className="rounded-xl p-px shadow-sm" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', borderWidth: '1px' }}>
                <div className="rounded-xl p-4 lg:p-8" style={{ backgroundColor: 'var(--bg-card)' }}>
                  {children}
                  <Analytics />
                </div>
              </div>
              <Byline className="fixed sm:hidden" />
            </div>
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}


