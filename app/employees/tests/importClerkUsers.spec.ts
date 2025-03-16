/**
 * @fileoverview Test suite for the syncOrganizationUsers function
 * @module EmployeeTests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { clerkClient } from '@clerk/nextjs';
import { tursoClient } from '#/db/index';
import { users } from '#/db/schema';
// import { syncOrganizationUsers } from '../page';
import type { OrganizationMembership, User } from '@clerk/backend';

/**
 * Mock for Clerk client functionality
 * @const {Object}
 */
vi.mock('@clerk/nextjs', () => ({
  clerkClient: {
    organizations: { getOrganizationMembershipList: vi.fn() },
    users: { getUser: vi.fn() },
  },
}));

/**
 * Mock for Turso database client
 * @const {Object}
 */
vi.mock('#/db/index', () => ({
  tursoClient: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    get: vi.fn(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn(),
  })),
}));

/**
 * Test suite for syncOrganizationUsers functionality
 * @namespace
 */
describe('syncOrganizationUsers', () => {
  /**
   * Mock organization ID for testing
   * @const {string}
   */
  const mockOrgId = 'org_123';

  /**
   * Mock timestamp for consistent date values in tests
   * @const {number}
   */
  const mockTimestamp = 1679580000000; // March 23, 2024

  /**
   * Reset mocks and set up test data before each test
   * @function
   */
  beforeEach(() => {
    vi.clearAllMocks();

    /**
     * Mock organization membership data
     * @type {OrganizationMembership}
     */
    const membership = {
        id: 'org_membership_1',
        role: 'basic_member',
        publicMetadata: {},
        privateMetadata: {},
        createdAt: mockTimestamp,
        updatedAt: mockTimestamp,
        organization: {
            id: 'org_123',
            name: 'Test Org',
            slug: 'test-org',
            imageUrl: '',
            hasImage: false,
            createdBy: 'user_1',
            createdAt: mockTimestamp,
            updatedAt: mockTimestamp,
            membershipLimit: null,
            adminDeleteEnabled: true,
            logoUrl: '',
        },
        permissions: [],
        publicUserData: {
            userId: 'user_1',
            firstName: 'John',
            lastName: 'Doe',
            identifier: 'john@example.com',
            imageUrl: '',
            hasImage: false,
            profileImageUrl: '',
        }
    } as unknown as OrganizationMembership;

    /**
     * Mock user data with complete verification details
     * @type {User}
     */
    const user = {
      id: 'clerk_1',
      firstName: 'John',
      lastName: 'Doe',
      emailAddresses: [{
        id: 'email_1',
        emailAddress: 'john@example.com',
        verification: {
          status: 'verified',
          strategy: 'email_code',
          externalVerificationRedirectURL: null,
          attempts: null,
          expireAt: null,
          nonce: null
        },
        linkedTo: []
      }],
      phoneNumbers: [{
        id: 'phone_1',
        phoneNumber: '1234567890',
        reservedForSecondFactor: false,
        defaultSecondFactor: false,
        verification: {
          status: 'verified',
          strategy: 'phone_code',
          externalVerificationRedirectURL: null,
          attempts: null,
          expireAt: null,
          nonce: null
        },
        linkedTo: []
      }],
      web3Wallets: [],
      externalAccounts: [],
      imageUrl: 'https://example.com/john.jpg',
      hasImage: true,
      primaryEmailAddressId: null,
      primaryPhoneNumberId: null,
      primaryWeb3WalletId: null,
      lastSignInAt: null,
      externalId: null,
      username: null,
      passwordEnabled: false,
      twoFactorEnabled: false,
      backupCodeEnabled: false,
      totpEnabled: false,
      banned: false,
      createdAt: mockTimestamp,
      updatedAt: mockTimestamp,
      profileImageUrl: '',
      gender: '',
      birthday: '',
      publicMetadata: {},
      privateMetadata: {},
      unsafeMetadata: {},
      createStrategy: 'oauth',
      createOrganizationEnabled: true
    } as User;

    // Setup mock responses
    vi.mocked(clerkClient.organizations.getOrganizationMembershipList)
      .mockResolvedValue([membership]);
    vi.mocked(clerkClient.users.getUser)
      .mockResolvedValue(user);
  });

  /**
   * Test case: verifies that new users are properly synced from Clerk to the local database
   * @function
   * @async
   */
  it('should sync new users from Clerk to database', async () => {
    /**
     * Mock database instance
     * @const {Object}
     */
    const db = tursoClient();
    vi.mocked(db.get).mockResolvedValue(null);

    // Execute the sync operation
    // await syncOrganizationUsers(mockOrgId);

    // Verify database operations
    expect(db.insert).toHaveBeenCalledWith(users);
    expect(db.values).toHaveBeenCalledWith(
      expect.objectContaining({
        clerkID: 'clerk_1',
        userNiceName: 'John Doe',
        organizationID: mockOrgId,
      })
    );
  });
});