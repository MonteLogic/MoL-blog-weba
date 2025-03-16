'use client';
import React, { useState, useEffect } from 'react';
import { useAuth, useOrganization } from '@clerk/nextjs';
import { clerkClient } from '@clerk/nextjs/server';

interface ClerkUser
  extends Omit<
    Parameters<typeof clerkClient.users.getUser>[0],
    'organizationMemberships'
  > {
  organizationMemberships?: Array<{
    organization: {
      id: string;
    };
  }>;
}

interface AuthorizationDisplayProps {
  employeeId: string;
  orgId: string;
}

const AuthorizationDisplay: React.FC<AuthorizationDisplayProps> = ({
  employeeId,
  orgId,
}) => {
  const { userId } = useAuth();
  const { organization } = useOrganization();
  const [employeeOrgId, setEmployeeOrgId] = useState<string | null>(null);

  const currentOrgId = organization?.id || null;
  const canViewProfile = currentOrgId === employeeOrgId;

  return (
    <div className="rounded-md bg-gray-100 p-4">
      <h2 className="mb-2 text-lg font-semibold">Authorization Info</h2>
      <p>Employee ID: {employeeId}</p>
      <p>Employee's orgId: {employeeOrgId || 'Not in an organization'}</p>
      <p>Current orgId: {currentOrgId || 'Not in an organization'}</p>
      <p>Can view profile: {canViewProfile ? 'Yes' : 'No'}</p>
    </div>
  );
};

export default AuthorizationDisplay;
