'use server';

import { clerkClient, auth } from '@clerk/nextjs';
import { tursoClient } from '#/db/index';
import { users } from '#/db/schema';
import Link from 'next/link';
import { eq } from 'drizzle-orm';
import { User } from '#/types/UserTypes';
import { uuid } from '#/utils/dbUtils';

/**
 * Represents a user with combined data from Clerk and local database
 * @typedef {Object} LocalUser
 * @property {string|number} id - Unique identifier for the user
 * @property {string|null} clerkID - Clerk's unique identifier for the user
 * @property {string} name - Display name of the user
 * @property {string} email - Email address of the user
 * @property {boolean} isPaired - Indicates if the user is paired in the local database
 * @property {string|null} dateHired - Date when the user was hired
 */
type LocalUser = {
  id: string | number;
  clerkID: string | null;
  name: string;
  email: string;
  isPaired: boolean;
  dateHired: string | null;
};

/**
 * Extracts the prefix part of an email address
 * @param {string} email - The full email address
 * @returns {string} The email prefix (part before the @ symbol)
 */
function getEmailPrefix(email: string): string {
  return email.split('@')[0];
}

/**
 * Generates a user-friendly display name from available user details
 * @param {string|null} firstName - User's first name
 * @param {string|null} lastName - User's last name
 * @param {string} email - User's email address
 * @returns {string} Formatted display name using available information
 */
function getUserNiceName(
  firstName: string | null,
  lastName: string | null,
  email: string,
): string {
  if (firstName ?? lastName) {
    return `${firstName ?? ''} ${lastName ?? ''}`.trim();
  }
  return getEmailPrefix(email);
}

/**
 * Synchronizes users from Clerk organization to local database
 * @async
 * @param {string} orgId - Organization ID from Clerk
 * @returns {Promise<void>}
 * @throws {Error} When unable to fetch organization members or sync data
 */
async function syncOrganizationUsers(orgId: string) {
  /** @const {Object} Database client instance for performing queries */
  const db = tursoClient();

  /** @const {Array}  List of all members in the organization from Clerk */
  const organizationMembers =
    await clerkClient.organizations.getOrganizationMembershipList({
      organizationId: orgId,
    });

  for (const member of organizationMembers) {
    /** @const {Object} Detailed user information from Clerk */
    const clerkUser = await clerkClient.users.getUser(
      member.publicUserData?.userId ?? '',
    );

    /** @const {Object|null} Existing user record from local database */
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.clerkID, clerkUser.id))
      .get();

    if (!existingUser) {
      /** @const {string} Current timestamp for user creation date */
      const currentDate = new Date().toISOString();
      /** @const {string} Primary email address of the user */
      const email = clerkUser.emailAddresses[0]?.emailAddress ?? '';
      /** @const {string} Formatted display name for the user */
      const userNiceName = getUserNiceName(
        clerkUser.firstName,
        clerkUser.lastName,
        email,
      );

      /**
       * User data prepared for database insertion
       * @const {User}
       */
      const userData: User = {
        id: uuid(),
        clerkID: clerkUser.id,
        email: email,
        userNiceName: userNiceName,
        phone: clerkUser.phoneNumbers[0]?.phoneNumber ?? '',
        img: clerkUser.imageUrl ?? '',
        dateAddedToCB: currentDate,
        dateHired: currentDate,
        organizationID: orgId,
      };

      await db.insert(users).values(userData);
      console.log('New user added to the database:', userData);
    }
  }
}

/**
 * Server Component that renders the Employees page
 * @async
 * @component
 * @returns {Promise<JSX.Element>} The rendered employee list or an error message
 * @throws {Error} When authentication fails or database operations fail
 */
export default async function EmployeesPage() {
  /**
   * Authentication data containing organization ID and session claims
   * @const {Object}
   */
  const { orgId, sessionClaims } = auth();

  if (!orgId) {
    return <div>You must be in an organization to view employees.</div>;
  }

  await syncOrganizationUsers(orgId);

  /** @const {Object} Database client instance */
  const db = tursoClient();

  /**
   * Combined data from Clerk and local database
   * @const {[Array<any>, Array<any>]}
   */
  const [organizationEmployees, dbUsers] = await Promise.all([
    clerkClient.organizations.getOrganizationMembershipList({
      organizationId: orgId,
    }),
    db.select().from(users).where(eq(users.organizationID, orgId)),
  ]);

  /**
   * Set of email addresses for users that exist in the local database
   * Used for quick lookup of paired status
   * @const {Set<string>}
   */
  const pairedEmails = new Set(dbUsers.map((user) => user.email.toLowerCase()));

  /**
   * Combined and normalized list of all users from both Clerk and local database
   * Sorted alphabetically by name
   * @const {Array<LocalUser>}
   */
  const allUsers: LocalUser[] = [
    ...organizationEmployees.map((member) => {
      /** @const {string} User's email or fallback text */
      const email = member.publicUserData?.identifier ?? 'No email';
      /** @const {string} Formatted display name */
      const name = getUserNiceName(
        member.publicUserData?.firstName ?? null,
        member.publicUserData?.lastName ?? null,
        email,
      );

      /** @const {Object|undefined} Matching user record from local database */
      const existingUser = dbUsers.find(
        (u) => u.email.toLowerCase() === email.toLowerCase(),
      );

      return {
        id: existingUser?.id ?? 0,
        clerkID: existingUser?.clerkID ?? null,
        name: name,
        email: email,
        isPaired: pairedEmails.has(email.toLowerCase()),
        dateHired: null,
      };
    }),
    ...dbUsers
      .filter((user) => !pairedEmails.has(user.email.toLowerCase()))
      .map((user) => ({
        id: user.id,
        clerkID: user.clerkID,
        name: user.userNiceName,
        email: user.email,
        isPaired: false,
        dateHired: user.dateAddedToCB,
      })),
  ].sort((a, b) => a.name.localeCompare(b.name));

  /**
   * Email address of the currently authenticated user
   * Used to highlight the user's own profile in the list
   * @const {string|undefined}
   */
  const currentUserEmail = sessionClaims?.userEmail;

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-medium text-gray-300">Employees</h1>
      <ul className="space-y-4">
        {allUsers.map((user) => (
          <li key={user.id}>
            <Link
              href={`/employees/${user.id}`}
              className={`block rounded-lg p-4 text-white transition-colors ${
                user.isPaired
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-gray-800 hover:bg-gray-700'
              }`}
            >
              {user.email.toLowerCase() === currentUserEmail && (
                <p className="mb-2 font-bold text-gray-700">Your Profile</p>
              )}
              <p>
                <strong>ID:</strong> {user.id}
              </p>
              <p>
                <strong>Name:</strong> {user.name}
              </p>
              <p>
                <strong>Email:</strong> {user.email}
              </p>
              {user.dateHired && (
                <p>
                  <strong>Date Hired:</strong>{' '}
                  {new Date(user.dateHired).toLocaleDateString()}
                </p>
              )}
              <p className="mt-2 text-gray-200">
                {user.isPaired ? 'Paired Employee' : 'Unpaired Employee'} -
                Click for more details
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
