import React from 'react';

const title = 'Skill Tree';

export const metadata = {
  title,
  openGraph: {
    title,
    images: [`/api/og?title=${title}`],
  },
};

export default function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="space-y-9">
      <div>{children}</div>
    </div>
  );
}
