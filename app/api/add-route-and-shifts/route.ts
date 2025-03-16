import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { eq, and } from 'drizzle-orm';
import { routes } from '#/db/schema';
import { tursoClient } from '#/db/index';
import { Route } from '#/types/RouteTypes';
import { uuid } from '#/utils/dbUtils';

export async function POST(req: NextRequest) {
  if (req.method !== 'POST') {
    return NextResponse.json(
      { message: 'Method not allowed' },
      { status: 405 },
    );
  }

  console.log(12);

  try {
    // Parse the JSON from the request body
    const body = await req.json();
    const { allocatedShifts, id, routeNiceName, routeIDFromPostOffice } = body;
    const { orgId } = auth();

    console.log(33, orgId);
    console.log(34, allocatedShifts);
    console.log('id: ', id);

    const db = tursoClient();

    // Try to see if the route already exists
    const existingRoute = await db
      .select()
      .from(routes)
      .where(
        and(
          eq(routes.organizationID, orgId || ''),
          eq(routes.routeNiceName, routeNiceName),
        ),
      )
      .get();

    if (!existingRoute) {
      // Prepare new route data
      const newRoute: Route = {
        id: uuid(),
        img: '',
        organizationID: orgId || '',
        dateRouteAcquired: '',
        dateAddedToCB: '',
        routeNiceName: routeNiceName,
        routeIDFromPostOffice: routeIDFromPostOffice,
      };

      // Create new route if it doesn't exist
      await db.insert(routes).values(newRoute);

      return NextResponse.json({
        revalidated: true,
        now: Date.now(),
        cache: 'no-store',
        data: newRoute, // Return the newly created route data
      });
    } else {
      return NextResponse.json({
        revalidated: true,
        now: Date.now(),
        cache: 'no-store',
        data: existingRoute, // Return the existing route data
      });
    }
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: 'Something went wrong' },
      { status: 500 },
    );
  }
}
