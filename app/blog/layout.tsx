import { TabGroupBlog } from '#/ui/tab-group-blog';
import React from 'react';

const title = 'CBud Blog Page';

export const metadata = {
  title,
  openGraph: {
    title,
    images: [`/api/og?title=${title}`],
  },
};

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  const ids = [{ id: '1' }, { id: '2' }, { id: '3' }];

  return (
    <div className="space-y-9">
      <TabGroupBlog
        path="/blog"
        items={[
          {
            text: 'Home',
          }
        ]}
      />

      <div>{children}</div>
    </div>
  );
}
