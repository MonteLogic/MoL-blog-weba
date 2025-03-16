'use client';

import { useState } from 'react';
import type { SerializedEmployee } from '#/types/UserTypes';
import { useUser } from '@clerk/nextjs';

export function EmployeeDetails({
  employee,
}: {
  employee: SerializedEmployee;
}) {
  const { isLoaded, isSignedIn } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState(employee.firstName);
  const [lastName, setLastName] = useState(employee.lastName);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Not available';
    return new Date(dateString).toLocaleString();
  };

  const handleSave = async () => {
    if (!isLoaded || !isSignedIn) {
      setError('User not authenticated. Please log in and try again.');
      return;
    }

    setIsUpdating(true);
    setError(null);

    try {
      const response = await fetch('/api/update-clerk-employee-info', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ firstName, lastName }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || 'Failed to update employee information',
        );
      }

      const data = await response.json();
      console.log('User update successful:', data);
      setIsEditing(false);

      // Update the local state with the new data
      setFirstName(data.user.firstName);
      setLastName(data.user.lastName);
    } catch (error) {
      console.error('Failed to update employee:', error);
      setError(
        error instanceof Error ? error.message : 'An unknown error occurred',
      );
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="rounded-lg bg-gray-800 p-6 text-white">
      {error && (
        <div className="mb-4 rounded bg-red-500 p-2 text-white">{error}</div>
      )}
      <p>
        <strong>ID:</strong> {employee.id}
      </p>
      <p>
        <strong>Name:</strong>{' '}
        {isEditing ? (
          <>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="mr-2 rounded bg-gray-700 px-2 py-1 text-white"
              disabled={isUpdating}
            />
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="mr-2 rounded bg-gray-700 px-2 py-1 text-white"
              disabled={isUpdating}
            />
            <button
              onClick={handleSave}
              className="rounded bg-blue-500 px-2 py-1 text-white hover:bg-blue-600 disabled:bg-blue-300"
              disabled={isUpdating}
            >
              {isUpdating ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setFirstName(employee.firstName);
                setLastName(employee.lastName);
                setError(null);
              }}
              className="ml-2 rounded bg-gray-500 px-2 py-1 text-white hover:bg-gray-600 disabled:bg-gray-400"
              disabled={isUpdating}
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            {firstName} {lastName}{' '}
            <button
              onClick={() => setIsEditing(true)}
              className="rounded bg-gray-700 px-2 py-1 text-white hover:bg-gray-600"
            >
              Edit
            </button>
          </>
        )}
      </p>
      <p>
        <strong>Email:</strong> {employee.emailAddress || 'No email'}
      </p>
      <p>
        <strong>Created At:</strong> {formatDate(employee.createdAt)}
      </p>
      <p>
        <strong>Updated At:</strong> {formatDate(employee.updatedAt)}
      </p>
      <p>
        <strong>Private Metadata:</strong>
      </p>
      <pre className="mt-2 overflow-x-auto rounded bg-gray-900 p-2">
        {employee.privateMetadata || 'No private metadata'}
      </pre>
    </div>
  );
}
