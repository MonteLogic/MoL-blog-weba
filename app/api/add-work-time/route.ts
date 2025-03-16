import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { workTimeShift, routeShiftInfo } from '#/db/schema';
import { tursoClient } from '#/db/index';
import { auth } from '@clerk/nextjs';
import { uuid } from '#/utils/dbUtils';
import { WorkTimeShiftType } from '#/types/WorkTimeShiftTypes';

/**
 * Represents a work time record for employee scheduling
 * @typedef {Object} WorkTimeRecord
 * @property {string} userId - The unique identifier of the employee
 * @property {string} routeId - The route identifier
 * @property {string} dayScheduled - The scheduled date
 * @property {string | null} summary - Optional summary of the work shift
 * @property {string} shiftWorked - The shift identifier
 * @property {boolean} occupied - Whether the shift is occupied
 */
type WorkTimeRecord = {
  userId: string;
  routeId: string;
  dayScheduled: string;
  summary: string | null;
  shiftWorked: string;
  occupied: boolean;
};

/**
 * Normalizes a date string to ensure consistent UTC time handling
 * @param {string} date - The date string to normalize
 * @returns {string} - The normalized ISO date string
 */
function normalizeDayScheduled(date: string): string {
  const d = new Date(date);
  d.setUTCHours(6, 0, 0, 0);
  return d.toISOString();
}

/**
 * Handles POST requests for scheduling multiple employees to work shifts
 * @param {NextRequest} req - The incoming request object
 * @returns {Promise<NextResponse>} The response containing the scheduled work times
 * @throws {Error} When the request fails or validation errors occur
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
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

    const workTimeRecords: WorkTimeRecord[] = Array.isArray(body)
      ? body
      : [body];
    const results: WorkTimeShiftType[] = [];

    // Group records by routeId, shiftWorked, and normalized date
    const recordGroups = workTimeRecords.reduce<
      Record<string, WorkTimeRecord[]>
    >((acc, record) => {
      const normalizedDate = normalizeDayScheduled(record.dayScheduled);
      const key = `${record.routeId}_${record.shiftWorked}_${normalizedDate}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push({ ...record, dayScheduled: normalizedDate });
      return acc;
    }, {});

    for (const [key, records] of Object.entries(recordGroups)) {
      const [routeId, shiftId, dayScheduled] = key.split('_');

      // Validate shift exists for the route
      const validShift = await db
        .select()
        .from(routeShiftInfo)
        .where(
          and(
            eq(routeShiftInfo.routeId, routeId),
            eq(routeShiftInfo.id, shiftId),
          ),
        )
        .all();

      if (validShift.length === 0) {
        console.warn(
          `No valid shift found for route ${routeId} and shift ${shiftId}`,
        );
        continue;
      }

      // Process each employee record for this shift
      for (const record of records) {
        // Check for existing work time entry for this employee
        const existingWorkTime = await db
          .select()
          .from(workTimeShift)
          .where(
            and(
              eq(workTimeShift.routeId, routeId),
              eq(workTimeShift.dayScheduled, dayScheduled),
              eq(workTimeShift.userId, record.userId),
              eq(workTimeShift.shiftWorked, shiftId),
            ),
          )
          .all();

        if (existingWorkTime.length > 0) {
          // Update existing record
          const updatedWorkTime = await db
            .update(workTimeShift)
            .set({
              summary: record.summary,
              organizationID: orgId ?? '',
              occupied: record.occupied,
              dayScheduled: dayScheduled,
            })
            .where(eq(workTimeShift.id, existingWorkTime[0].id))
            .returning();
          results.push(updatedWorkTime[0]);
        } else {
          // Create new record
          const newWorkTime: WorkTimeShiftType = {
            id: uuid(),
            userId: record.userId,
            routeId,
            dayScheduled,
            summary: record.summary,
            shiftWorked: shiftId,
            occupied: record.occupied,
            dateAddedToCB: new Date().toISOString(),
            organizationID: orgId ?? '',
          };
          const savedWorkTime = await db
            .insert(workTimeShift)
            .values(newWorkTime)
            .returning();
          results.push(savedWorkTime[0]);
        }
      }
    }

    return NextResponse.json({
      revalidated: true,
      now: Date.now(),
      cache: 'no-store',
      data: results,
    });
  } catch (err: any) {
    console.error('Error in add-work-time API:', err);
    return NextResponse.json(
      { message: 'Something went wrong', error: err.message },
      { status: 500 },
    );
  }
}
