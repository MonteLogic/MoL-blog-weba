'use server';

import { tursoClient } from '#/db/index';
import { routes } from '#/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@clerk/nextjs';
import RouteListRoutePg from '#/ui/route-list-on-route-pg';

// Define the Route type based on your Drizzle schema
type Route = typeof routes.$inferSelect;

export default async function Page() {
  const { orgId } = auth();

  if (!orgId) {
    return <div>Please log in to view routes.</div>;
  }

  try {
    const initialRoutes: Route[] = await tursoClient()
      .select()
      .from(routes)
      .where(eq(routes.organizationID, orgId));

    return (
      <div className="prose prose-sm prose-invert relative z-0 max-w-none space-y-4">
        <div className="text-gray-1800 text-xs font-semibold uppercase tracking-wider">
          <h3>Routes Page, create Route</h3>
          <RouteListRoutePg initialRoutes={initialRoutes} orgId={orgId} />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error fetching routes:', error);
    return <div>Error loading routes. Please try again later.</div>;
  }
}
