import { ExternalLink } from '#/ui/external-link';
import { InternalLink } from '#/ui/internal-link';
import Link from 'next/link';

export default function Page() {
  return (
    <div className="prose prose-sm prose-invert max-w-none">
      <h1 className="text-xl font-bold">Main Page</h1>

      <ul>
        <li>
          <Link href="/main/schedule">Schedule</Link> page is used scheduling
          employees time they are supposed to work.
        </li>
        <li>
          <Link href="/main/timecard">Timecard</Link> page is used for creating
          timecards for employees.
        </li>
      </ul>

      <div className="flex gap-2">
        <InternalLink href="/main/schedule">Schedule</InternalLink>
        <InternalLink href="/main/timecard">Timecard</InternalLink>
      </div>
    </div>
  );
}
