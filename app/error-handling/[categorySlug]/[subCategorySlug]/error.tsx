'use client';

import { useEffect } from 'react';
import { Boundary } from '#/ui/boundary';
import Button from '#/ui/button';

type ErrorBoundaryProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Boundary
      labels={['./[categorySlug]/[subCategorySlug]/error.tsx']}
      color="pink"
    >
      <div className="space-y-4">
        <h2 className="text-lg font-bold">Error</h2>
        <p className="text-sm">{error?.message}</p>
        <div>
          <Button onClick={() => reset()}>Try Again</Button>
        </div>
      </div>
    </Boundary>
  );
}
