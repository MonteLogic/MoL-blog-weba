import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { workTimeShift, routeShiftInfo, routes } from '#/db/schema';
import { tursoClient } from '#/db/index';
import { auth } from '@clerk/nextjs';
import { WorkTimeShiftType, ShiftStatus } from '#/types/WorkTimeShiftTypes';
import { uuid } from '#/utils/dbUtils';

export async function POST(req: NextRequest) {
  if (req.method !== 'POST') {
    return NextResponse.json(
      { message: 'Method not allowed' },
      { status: 405 },
    );
  }

  try {
    const db = tursoClient();
    const body = await req.json();
    const { orgId } = auth();
    console.log('Organization ID:', orgId);
    console.log('Request body:', body);

    const { userId, routeId, dayScheduled, summary, shiftWorked } = body;

    // Validate foreign key references
    const validRoute = await db
      .select()
      .from(routes)
      .where(eq(routes.id, routeId))
      .get();
    if (!validRoute) {
      return NextResponse.json(
        { message: 'Invalid route ID' },
        { status: 400 },
      );
    }

    // Only validate shiftWorked if it's provided
    if (shiftWorked !== null) {
      const validShift = await db
        .select()
        .from(routeShiftInfo)
        .where(eq(routeShiftInfo.id, shiftWorked))
        .get();
      if (!validShift) {
        return NextResponse.json(
          { message: 'Invalid shift ID' },
          { status: 400 },
        );
      }
    }

    // Check if the record already exists for this user, route, and date
    const existingWorkTime = await db
      .select()
      .from(workTimeShift)
      .where(
        and(
          eq(workTimeShift.userId, userId),
          eq(workTimeShift.routeId, routeId),
          eq(workTimeShift.dayScheduled, dayScheduled),
        ),
      )
      .get();

    if (existingWorkTime) {
      console.log('Updating existing WorkTimeShift record');
      const updatedWorkTime = await db
        .update(workTimeShift)
        .set({
          summary,
          shiftWorked: shiftWorked || existingWorkTime.shiftWorked, // Keep existing value if not provided
          organizationID: orgId || '',
        })
        .where(
          and(
            eq(workTimeShift.userId, userId),
            eq(workTimeShift.routeId, routeId),
            eq(workTimeShift.dayScheduled, dayScheduled),
          ),
        )
        .returning();

      return NextResponse.json({
        revalidated: true,
        now: Date.now(),
        cache: 'no-store',
        data: updatedWorkTime[0],
      });
    }

    if (!existingWorkTime) {
      console.log('Creating new WorkTimeShift record');
      const timeInput: WorkTimeShiftType = {
        // Generate id
        id: uuid(),
        userId,
        routeId,
        dayScheduled,
        summary,
        shiftWorked: shiftWorked || '', // Use empty string if not provided
        occupied: true,
        dateAddedToCB: new Date().toISOString(),
        organizationID: orgId || '',
      };

      const savedTimeInput = await db
        .insert(workTimeShift)
        .values(timeInput)
        .returning();

      return NextResponse.json({
        revalidated: true,
        now: Date.now(),
        cache: 'no-store',
        data: savedTimeInput[0],
      });
    }

    return NextResponse.json({ message: 'No action taken' });
  } catch (err: any) {
    console.error('Error in work-time API:', err);
    return NextResponse.json(
      { message: 'Something went wrong', error: err.message },
      { status: 500 },
    );
  }
}
