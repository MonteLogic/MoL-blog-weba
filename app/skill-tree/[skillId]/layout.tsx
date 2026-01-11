import React from 'react';

export async function generateMetadata({ params }: { params: { skillId: string } }) {
  const skillId = params.skillId;
  const title = `${skillId.charAt(0).toUpperCase() + skillId.slice(1)} Skill`;
  
  return {
    title,
    openGraph: {
      title,
      images: [`/api/og?title=${title}`],
    },
  };
}

export default function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="space-y-9">
      <div>{children}</div>
    </div>
  );
}
