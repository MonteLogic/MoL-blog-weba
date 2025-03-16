import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { users } from '#/db/schema';
import { tursoClient } from '#/db/index';
import { User } from '#/types/UserTypes';

interface AddEmployeeRequest {
  employeeName: string;
}

export async function POST(req: NextRequest) {
  if (req.method !== 'POST') {
    return NextResponse.json(
      { success: false, message: 'Method not allowed' },
      { status: 405 },
    );
  }

  try {
    const body = (await req.json()) as AddEmployeeRequest;
    const { employeeName } = body;
    const { userId, orgId } = auth();
    console.log('Received request:', { employeeName, userId, orgId });

    if (!employeeName) {
      return NextResponse.json(
        { success: false, message: 'Employee name is required' },
        { status: 400 },
      );
    }

    if (!userId || !orgId) {
      return NextResponse.json(
        { success: false, message: 'User authentication failed' },
        { status: 401 },
      );
    }

    const db = tursoClient();

    // Generate a unique employeeId
    const id = `EMP-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    console.log('Generated employeeId:', id);

    // Prepare new employee data
    const newEmployee: User = {
      id,
      clerkID: userId,
      organizationID: orgId,
      userNiceName: employeeName,
      email: '',
      phone: '',
      dateHired: new Date().toISOString(),
      dateAddedToCB: new Date().toISOString(),
      img: '',
    };

    console.log('Attempting to insert new employee:', newEmployee);

    // Create new employee
    const result = await db.insert(users).values(newEmployee);
    console.log('Insert result:', result);

    return NextResponse.json({
      success: true,
      revalidated: true,
      now: Date.now(),
      cache: 'no-store',
      data: newEmployee,
    });
  } catch (err) {
    console.error('Error adding employee:', err);
    let errorMessage =
      'An unexpected error occurred while adding the employee.';
    let statusCode = 500;

    if (err instanceof Error) {
      console.error('Full error object:', JSON.stringify(err, null, 2));
      // Handle specific error types
      if (err.message.includes('UNIQUE constraint failed')) {
        errorMessage = 'An employee with this ID already exists.';
        statusCode = 409; // Conflict
      } else if (err.message.includes('FOREIGN KEY constraint failed')) {
        errorMessage = 'Invalid organization ID or clerk ID.';
        statusCode = 400; // Bad Request
      } else if (err.message.includes('database is locked')) {
        errorMessage = 'Database is currently locked. Please try again later.';
        statusCode = 503; // Service Unavailable
      } else {
        // Log the full error for unexpected errors
        console.error('Unexpected error:', err);
      }
    }

    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: statusCode },
    );
  }
}
