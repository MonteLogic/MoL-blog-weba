'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export default function PerPageSelect({ current }: { current: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('perPage', e.target.value);
    params.set('page', '1'); // reset to page 1
    router.push(`/blog?${params.toString()}`);
  }

  return (
    <select
      value={current}
      onChange={handleChange}
      className="border-cream-300 text-charcoal-muted rounded-lg border bg-white py-2 pl-3 pr-8 text-sm font-medium cursor-pointer"
    >
      <option value={15}>15</option>
      <option value={30}>30</option>
      <option value={50}>50</option>
      <option value={100}>100</option>
    </select>
  );
}
