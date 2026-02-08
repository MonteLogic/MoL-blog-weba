import type { ReactNode } from 'react';
import { Boundary } from '#/ui/boundary';

export default function Template({ children }: { children: ReactNode }) {
  return <Boundary>{children}</Boundary>;
}
