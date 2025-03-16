'use server';

import { tursoClient } from '#/db/index';
import { routes, routeShiftInfo, users, workTimeShift } from '#/db/schema';
import { eq } from 'drizzle-orm';
import { DropdownUsersSwiper } from '#/ui/dropdown-users-swiper';
import {
  clerkClient,
  currentUser,
  auth,
  UserButton,
  CreateOrganization,
} from '@clerk/nextjs';
import { RouteShiftInfoType } from '#/types/RouteShiftInfoTypes';
import { WorkTimeShiftType } from '#/types/WorkTimeShiftTypes';
import Button from '#/ui/button';
import Link from 'next/link';
import OrganizationPrompt from '#/ui/organization-prompt';

// Define types based on your Drizzle schema
type Route = typeof routes.$inferSelect;
type Users = typeof users.$inferSelect;

export default async function Page() {
  const { userId, orgId } = auth();
  console.log(16, orgId);
  const currentUser_ = await currentUser();
  const user = userId ? await clerkClient.users.getUser(userId) : null;

  // console.log({ userId, currentUser_, user });
  // console.log(15, user?.privateMetadata);
  const db = tursoClient();

  const initialWorkTime: WorkTimeShiftType[] = await db
    .select()
    .from(workTimeShift)
    .where(eq(workTimeShift.organizationID, orgId ?? ''));

  const initialUsers: Users[] = await db
    .select()
    .from(users)
    .where(eq(users.organizationID, orgId ?? ''));

  // console.log(initialEmployees);

  const initialRoutes: Route[] = await db
    .select()
    .from(routes)
    .where(eq(routes.organizationID, orgId ?? ''));

  const initialRouteShiftInfo: RouteShiftInfoType[] = await db
    .select()
    .from(routeShiftInfo)
    .where(eq(routeShiftInfo.organizationID, orgId ?? ''));

  return (
    <div className="relative z-0 space-y-10 text-white">
      <div className="space-y-5">
        <div className="text-gray-1800 text-xs font-semibold uppercase tracking-wider">
          {orgId ? (
            <DropdownUsersSwiper
              initialRouteShiftInfo={initialRouteShiftInfo}
              initialRoutes={initialRoutes}
              initialUsers={initialUsers}
              initialWorkTime={initialWorkTime}
              organizationID={orgId}
            />
          ) : (
            <OrganizationPrompt />
          )}
        </div>
      </div>
    </div>
  );
}
