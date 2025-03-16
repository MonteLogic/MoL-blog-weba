import { tursoClient } from '#/db/index';
import { workTimeShift } from '#/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@clerk/nextjs';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { orgId } = auth();
    
    if (!orgId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    const db = tursoClient();
    const initialWorkTime = await db
      .select()
      .from(workTimeShift)
      .where(eq(workTimeShift.organizationID, orgId));

    return NextResponse.json({ data: initialWorkTime }, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching work time data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch work time data' },
      { status: 500 }
    );
  }
}