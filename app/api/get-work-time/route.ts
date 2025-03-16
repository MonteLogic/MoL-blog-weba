import { NextResponse } from 'next/server';
import { workTimeShift } from '#/db/schema';
import { eq } from 'drizzle-orm';
import { tursoClient } from '#/db/index';
const db = tursoClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationID = searchParams.get('organizationID');

    if (!organizationID) {
      return NextResponse.json(
        { error: 'organizationID is required' },
        { status: 400 },
      );
    }

    const result = await db
      .select()
      .from(workTimeShift)
      .where(eq(workTimeShift.organizationID, organizationID));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching work time:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
