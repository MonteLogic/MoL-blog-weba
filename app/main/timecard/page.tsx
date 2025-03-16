'use server';

import { tursoClient } from '#/db/index';
import { routes, routeShiftInfo, users, workTimeShift } from '#/db/schema';
import { eq } from 'drizzle-orm';
import { DropdownUsersTimecard } from '#/ui/dropdown-users-timecard';
import { clerkClient, currentUser, auth } from '@clerk/nextjs';
import { RouteType } from '#/types/RouteTypes';
import { User } from '#/types/UserTypes';
import { WorkTimeShiftType } from '#/types/WorkTimeShiftTypes';
import { RouteShiftInfoType } from '#/types/RouteShiftInfoTypes';

// Define types based on your Drizzle schema

export default async function Page() {
  const { userId, orgId } = auth();
  const currentUser_ = await currentUser();
  const user = userId ? await clerkClient.users.getUser(userId) : null;

  const db = tursoClient();

  const initialWorkTime: WorkTimeShiftType[] = await db
    .select()
    .from(workTimeShift)
    .where(eq(workTimeShift.organizationID, orgId ?? ''));

  const initialEmployees: User[] = await db
    .select()
    .from(users)
    .where(eq(users.organizationID, orgId ?? ''));


  const initialRoutes: RouteType[] = await db
    .select()
    .from(routes)
    .where(eq(routes.organizationID, orgId ?? ''));

  const initialRouteShiftInfo: RouteShiftInfoType[] = await db
    .select()
    .from(routeShiftInfo)
    .where(eq(routeShiftInfo.organizationID, orgId ?? ''));

  return (
    <div className="prose prose-sm prose-invert relative z-0 max-w-none space-y-4">
      {/* <div className="space-y-10 text-white relative z-0"> */}
      <div className="text-gray-1800 text-xs font-semibold uppercase tracking-wider">
        <p>Generate Time card</p>
        <DropdownUsersTimecard
          initialRoutes={initialRoutes}
          initialEmployees={initialEmployees}
          initialWorkTime={initialWorkTime}
          initialRouteShiftInfo={initialRouteShiftInfo}
        />
      </div>
    </div>
  );
}
