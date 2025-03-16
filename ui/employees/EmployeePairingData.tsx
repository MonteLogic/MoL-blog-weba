'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Button from '../button';
import { UserType } from '#/types/UserTypes';



type SerializedOrgEmployee = {
  id: string;
  userId: string | null;
  firstName: string | null;
  lastName: string | null;
  identifier: string | null;
};

type EmployeePairingProps = {
  currentEmail: string | null;
  dbEmployees: UserType[];
  organizationEmployees: SerializedOrgEmployee[];
};

export default function EmployeePairing({
  currentEmail,
  dbEmployees,
  organizationEmployees,
}: EmployeePairingProps) {
  const [matchedEmployee, setMatchedEmployee] = useState<UserType | null>(null);
  const [unpairedDbEmployees, setUnpairedDbEmployees] = useState<UserType[]>([]);
  const [unpairedOrgEmployees, setUnpairedOrgEmployees] = useState<SerializedOrgEmployee[]>([]);

  useEffect(() => {
    const matched = dbEmployees.find(
      (employee) => employee.email === currentEmail
    );
    if (matched) {
      console.log('Match found in database employees');
      console.log('Matched employee ID in local database:', matched.id);
      setMatchedEmployee(matched);
    }

    setUnpairedDbEmployees(dbEmployees.filter(employee => employee.email !== currentEmail));
    setUnpairedOrgEmployees(organizationEmployees.filter(
      employee => employee.identifier !== currentEmail
    ));
  }, [dbEmployees, organizationEmployees, currentEmail]);

  const handlePairing = (employee: UserType) => {
    setMatchedEmployee(employee);
    setUnpairedDbEmployees(unpairedDbEmployees.filter(e => e.id !== employee.id));
    console.log('Pairing with employee:', employee);
  };

  return (
    <div className="space-y-8">
      <div className="space-y-5">
        <h2 className="text-xl font-semibold text-white">Your Status</h2>
        {matchedEmployee ? (
          <Link 
            href={`/employees/${matchedEmployee.clerkID ?? matchedEmployee.id}`}
            className="block rounded-lg bg-green-600 p-4 text-white transition-colors hover:bg-green-700"
          >
            <p className="font-medium mb-2">Your data profile:</p>
            <p><strong>Name:</strong> {matchedEmployee.userNiceName}</p>
            <p><strong>Email:</strong> {matchedEmployee.email}</p>
            <p><strong>Employee ID:</strong> {matchedEmployee.id ?? 'N/A'}</p>
            <p className="mt-2 text-gray-200">Click for more details</p>
          </Link>
        ) : (
          <div>
            <p className="text-white">Select your email to pair:</p>
            <ul className="space-y-4">
              {dbEmployees.map((employee) => (
                <li key={employee.id ?? employee.email}>
                  <button
                    className={`block w-full rounded-lg p-4 text-left transition-colors ${
                      employee.email === currentEmail
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-gray-800 text-white hover:bg-gray-700'
                    }`}
                    onClick={() => handlePairing(employee)}
                  >
                    <p>
                      <strong>Email:</strong> {employee.email}
                    </p>
                    <p>
                      <strong>Name:</strong> {employee.userNiceName}
                    </p>
                    <p>
                      <strong>Employee ID:</strong> {employee.id ?? 'N/A'}
                    </p>
                    <p className="mt-2 text-gray-300">Click to pair</p>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {!matchedEmployee && (
        <div className="space-y-5">
          <h2 className="text-xl font-semibold text-white">Unpaired Local DB Employees</h2>
          <ul className="space-y-4">
            {unpairedDbEmployees.map((employee) => (
              <li key={employee.id ?? employee.email}>
                <div className="block rounded-lg bg-gray-800 p-4 text-white">
                  <p><strong>Name:</strong> {employee.userNiceName}</p>
                  <p><strong>Email:</strong> {employee.email}</p>
                  <p><strong>Employee ID:</strong> {employee.id ?? 'N/A'}</p>
                  <Button 
                    className="mt-2" 
                    onClick={() => handlePairing(employee)}
                  >
                    Pair with this employee
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-5">
        <h2 className="text-xl font-semibold text-white">Unpaired Organization Members</h2>
        <ul className="space-y-4">
          {unpairedOrgEmployees.map((employee) => (
            <li key={employee.id}>
              <Link
                href={`/employees/${employee.userId ?? employee.id}`}
                className="block rounded-lg bg-gray-800 p-4 text-white transition-colors hover:bg-gray-700"
              >
                <p>
                  <strong>ID:</strong> {employee.userId ?? 'N/A'}
                </p>
                <p>
                  <strong>Name:</strong> {employee.firstName ?? 'Unknown'}{' '}
                  {employee.lastName ?? ''}
                </p>
                <p>
                  <strong>Email:</strong> {employee.identifier ?? 'No email'}
                </p>
                <p className="mt-2 text-gray-400">Click for more details</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}