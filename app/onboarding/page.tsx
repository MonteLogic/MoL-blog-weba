'use server';
import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs';
import type { OrganizationMembership } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { tursoClient } from '#/db/index';
import { users } from '#/db/schema';
import EmployeePairing from '#/ui/employees/EmployeePairingData';
import { syncClerkAndLocalDb } from '#/utils/SyncClerkandLocaldb';
import { UserType } from '#/types/UserTypes';

export default async function Page() {
  const { userId, orgId, sessionClaims } = auth();
  const typedSessionClaimsEmail = sessionClaims?.userEmail as string | null;

  if (!userId || !orgId) {
    return (
      <div>You must be signed in and in an organization to view this page.</div>
    );
  }

  const { isNewUser, localUser } = await syncClerkAndLocalDb(userId, orgId);

  const db = tursoClient();
  let organizationEmployees: OrganizationMembership[] = [];
  let dbEmployees: UserType[] = [];
  let emailSearchResult = '';
  try {
    organizationEmployees =
      await clerkClient.organizations.getOrganizationMembershipList({
        organizationId: orgId,
      });

    dbEmployees = await db
      .select()
      .from(users)
      .where(eq(users.organizationID, orgId));

    const foundEmployee = dbEmployees.find(
      (employee) => employee.email === typedSessionClaimsEmail,
    );
    emailSearchResult = foundEmployee
      ? `Email exists. Record ID: ${foundEmployee.id}`
      : 'does not exist';

    console.log(45, emailSearchResult);

    // Sort dbEmployees to put the current user first
    dbEmployees.sort((a, b) =>
      a.email === typedSessionClaimsEmail
        ? -1
        : b.email === typedSessionClaimsEmail
        ? 1
        : 0,
    );
  } catch (error) {
    console.error('Error fetching employees:', error);
  }

  // Serialize the data before passing it to the Client Component
  const serializedOrgEmployees = organizationEmployees.map((employee) => ({
    id: employee.id,
    userId: employee.publicUserData?.userId ?? null,
    firstName: employee.publicUserData?.firstName ?? null,
    lastName: employee.publicUserData?.lastName ?? null,
    identifier: employee.publicUserData?.identifier ?? null,
  }));

  return (
    <>
      <div className="relative z-0 space-y-10 text-white">
        <div className="space-y-5">
          <h2>{isNewUser ? 'Welcome to Onboarding!' : 'Welcome Back!'}</h2>
          Your email according to Clerk: {typedSessionClaimsEmail}
        </div>
      </div>
      <div className="space-y-8">
        <h1 className="text-xl font-medium text-gray-300">Employees</h1>
        <EmployeePairing
          currentEmail={typedSessionClaimsEmail}
          dbEmployees={dbEmployees}
          organizationEmployees={serializedOrgEmployees}
        />
      </div>
    </>
  );
}
