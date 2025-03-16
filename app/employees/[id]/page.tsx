import { clerkClient } from '@clerk/nextjs';
import type { User } from '@clerk/nextjs/server';
import Link from 'next/link';
import { auth } from '@clerk/nextjs';
import { routes, workTimeShift, users } from '#/db/schema';
import { tursoClient } from '#/db/index';
import { eq } from 'drizzle-orm';
import { EmployeeTabContent } from '#/ui/employees/EmployeeTabContent';
import { EmployeeDetails } from '#/ui/employees/EmployeeDetails';
import type { SerializedEmployee } from '#/types/UserTypes';
import AuthorizationDisplay from '#/ui/employees/AuthorizationDisplay';
import { UserType } from '#/types/UserTypes';
import { routeShiftInfo } from '#/db/schema';
import { notFound } from 'next/navigation';

type Routes = typeof routes.$inferSelect;

export default async function EmployeePage({
  params,
}: {
  params: { id: string };
}) {
  const { orgId } = auth();
  const db = tursoClient();

  if (!orgId) {
    return <div className="text-white">Organization ID not found</div>;
  }

  // First, fetch the employee from your database
  const [dbEmployee]: UserType[] = await db
    .select()
    .from(users)
    .where(eq(users.id, params.id));

  if (!dbEmployee) {
    return notFound();
  }

  // Fetch additional data
  const [initialRouteShiftInfo, initialRoutes, workTimeTop] = await Promise.all(
    [
      db
        .select()
        .from(routeShiftInfo)
        .where(eq(routeShiftInfo.organizationID, orgId)),
      db.select().from(routes),
      db.select().from(workTimeShift),
    ],
  );

  let clerkUser: User | null = null;
  let serializedEmployeeData: SerializedEmployee | null = null;

  // Only try to fetch Clerk user if dbEmployee has a clerkID
  if (dbEmployee.clerkID) {
    try {
      clerkUser = await clerkClient.users.getUser(dbEmployee.clerkID);
    } catch (error) {
      console.error('Error fetching Clerk user:', error);
      // Continue with dbEmployee data only
    }
  }

  // Create serialized employee data, prioritizing DB data and supplementing with Clerk data
  serializedEmployeeData = {
    // Always use the database ID as the primary identifier
    id: dbEmployee.id,
    // Use DB data first, fall back to Clerk data if available
    firstName:
      dbEmployee.userNiceName?.split(' ')[0] || clerkUser?.firstName || '',
    lastName:
      dbEmployee.userNiceName?.split(' ')[1] || clerkUser?.lastName || '',
    email: dbEmployee.email || '',
    emailAddress:
      clerkUser?.emailAddresses[0]?.emailAddress || dbEmployee.email || null,
    phone: dbEmployee.phone || '',
    // Use DB dates if available, fall back to Clerk dates
    createdAt:
      dbEmployee.dateAddedToCB?.toString() ||
      (clerkUser ? new Date(clerkUser.createdAt).toISOString() : ''),
    privateMetadata: clerkUser
      ? JSON.stringify(clerkUser.privateMetadata)
      : '{}',
    // Store both IDs for reference
    clerkID: dbEmployee.clerkID || '',
    organizationID: orgId,
    userNiceName:
      dbEmployee.userNiceName ||
      `${clerkUser?.firstName || ''} ${clerkUser?.lastName || ''}`.trim(),
    dateAddedToCB: dbEmployee.dateAddedToCB?.toString() || '',
    dateHired: dbEmployee.dateHired?.toString() || '',
    img: dbEmployee.img || clerkUser?.imageUrl || '',
  };

  return (
    <div className="space-y-8">
      <Link href="/employees" className="text-blue-500 hover:underline">
        &larr; Back to all employees
      </Link>

      <h1 className="text-xl font-medium text-gray-300">Employee Details</h1>

      {/* Pass the database ID instead of Clerk ID */}
      <AuthorizationDisplay employeeId={dbEmployee.id} orgId={orgId} />

      {serializedEmployeeData && (
        <>
          <EmployeeDetails employee={serializedEmployeeData} />
          <EmployeeTabContent
            orgId={orgId}
            employee={dbEmployee} // Pass the full database employee object
            initialRoutes={initialRoutes}
            workTimeTop={workTimeTop}
            initialRouteShiftInfo={initialRouteShiftInfo}
            selectedEmployeeID={dbEmployee.id} // Use the database ID
          />
        </>
      )}
    </div>
  );
}
