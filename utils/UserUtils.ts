// utils/userUtils.js

function checkUserRole(session: {
  user: { organizationMemberships: string | any[] };
}) {
  if (
    !session ||
    !session.user ||
    !session.user.organizationMemberships ||
    session.user.organizationMemberships.length === 0
  ) {
    return null; // Return null if the user is not a basic member
  }

  const organizationMemberships = session.user.organizationMemberships;

  // Loop through all organization memberships
  for (const membership of organizationMemberships) {
    if (membership.role) {
      return membership.role.toLowerCase(); // Return the role in lowercase if it exists
    }
  }

  return null; // Return null if no role is found in the memberships
}

function getUserRole(session: { user: { organizationMemberships: any } }) {
  // Check if the session exists and has user data
  if (session && session.user && session.user.organizationMemberships) {
    const organizationMemberships = session.user.organizationMemberships;

    // Check if organizationMemberships array is empty or undefined
    if (organizationMemberships.length === 0) {
      return 'The organization is null and has no roles.';
    }

    // Get the role from the first organization membership
    const role = organizationMemberships[0].role;

    // Return the role if it exists, otherwise return null
    if (role) {
      return role;
    } else {
      return null;
    }
  }

  // Return null if the session, user data, or organizationMemberships is not available
  return null;
}
export { checkUserRole, getUserRole };
