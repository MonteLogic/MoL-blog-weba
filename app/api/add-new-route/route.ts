import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { eq, and } from 'drizzle-orm';
import { routes, routeShiftInfo } from '#/db/schema';
import { tursoClient } from '#/db/index';
import { Route } from '#/types/RouteTypes';

import { RouteType } from '#/types/RouteTypes';
import { uuid } from '#/utils/dbUtils';
import { RouteShiftInfoType } from '#/types/RouteShiftInfoTypes';

interface AllocatedShift {
  name: string;
  startTime: string;
  endTime: string;
}

export async function POST(req: NextRequest) {
  if (req.method !== 'POST') {
    return NextResponse.json(
      { message: 'Method not allowed' },
      { status: 405 },
    );
  }

  try {
    const body = await req.json();
    console.log('Received body:', JSON.stringify(body, null, 2));

    const { routeNiceName, routeIDFromPostOffice, allocatedShifts } = body;
    const { userId, orgId } = auth();

    if (!orgId) {
      return NextResponse.json(
        { message: 'Unauthorized: No organization ID found' },
        { status: 401 },
      );
    }

    const db = tursoClient();

    // Check if the route already exists
    const existingRoute = await db
      .select()
      .from(routes)
      .where(
        and(
          eq(routes.organizationID, orgId),
          eq(routes.routeNiceName, routeNiceName),
        ),
      )
      .get();

    let routeData: Route;
    if (!existingRoute) {
      // Create new route
      const newRoute: RouteType = {
        id: uuid(),
        img: body.img || '',
        organizationID: orgId,
        dateRouteAcquired: new Date().toISOString(),
        dateAddedToCB: new Date().toISOString(),
        routeNiceName: routeNiceName,
        routeIDFromPostOffice: routeIDFromPostOffice,
      };

      console.log('New route object:', JSON.stringify(newRoute, null, 2));

      try {
        const insertedRoute = await db
          .insert(routes)
          .values(newRoute)
          .returning();
        routeData = insertedRoute[0];
        console.log('Inserted route:', JSON.stringify(routeData, null, 2));
      } catch (insertError) {
        console.error('Error inserting new route:', insertError);
        return NextResponse.json(
          {
            message: 'Error inserting new route',
            error: (insertError as Error).message,
          },
          { status: 500 },
        );
      }
    } else {
      routeData = existingRoute;
      console.log('Existing route:', JSON.stringify(routeData, null, 2));
    }

    // Ensure routeData.id is defined
    if (routeData.id === undefined) {
      return NextResponse.json(
        { message: 'Route ID is undefined' },
        { status: 500 },
      );
    }
    console.log('Route ID:', routeData.id, 'Type:', typeof routeData.id);

    // Parse allocatedShifts
    let parsedAllocatedShifts: AllocatedShift[];
    try {
      parsedAllocatedShifts = JSON.parse(allocatedShifts);
      console.log(
        'Parsed allocatedShifts:',
        JSON.stringify(parsedAllocatedShifts, null, 2),
      );
    } catch (error) {
      console.error('Error parsing allocatedShifts:', error);
      return NextResponse.json(
        { message: 'Invalid allocatedShifts format' },
        { status: 400 },
      );
    }

    // Insert RouteShiftInfo
    if (
      Array.isArray(parsedAllocatedShifts) &&
      parsedAllocatedShifts.length > 0
    ) {
      console.log(
        `Attempting to insert ${parsedAllocatedShifts.length} shifts`,
      );
      for (const shift of parsedAllocatedShifts) {
        const newShiftInfo: RouteShiftInfoType = {
          id: uuid(),
          organizationID: orgId,
          routeId: routeData.id, // Use the id as it is
          shiftName: shift.name,
          startTime: shift.startTime,
          endTime: shift.endTime,
          dateAddedToCB: new Date().toISOString(),
        };

        console.log(
          'Inserting shift info:',
          JSON.stringify(newShiftInfo, null, 2),
        );
        try {
          const result = await db
            .insert(routeShiftInfo)
            .values(newShiftInfo)
            .returning();
          console.log(
            'Inserted shift result:',
            JSON.stringify(result, null, 2),
          );
        } catch (shiftInsertError) {
          console.error('Error inserting shift info:', shiftInsertError);
          // Continue with the next shift instead of breaking the whole operation
        }
      }
    } else {
      console.log('No shifts to insert');
    }

    // Verify inserted shifts
    const insertedShifts = await db
      .select()
      .from(routeShiftInfo)
      .where(eq(routeShiftInfo.routeId, routeData.id));
    console.log('Inserted shifts:', JSON.stringify(insertedShifts, null, 2));

    return NextResponse.json({
      revalidated: true,
      now: Date.now(),
      cache: 'no-store',
      data: {
        route: routeData,
        shiftInfo: insertedShifts,
      },
    });
  } catch (err) {
    console.error('Unhandled error:', err);
    return NextResponse.json(
      { message: 'Something went wrong', error: (err as Error).message },
      { status: 500 },
    );
  }
}
