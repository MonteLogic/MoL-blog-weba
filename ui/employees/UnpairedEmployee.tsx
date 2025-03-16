'use client';
import Link from 'next/link';
import AuthorizationDisplay from '#/ui/employees/AuthorizationDisplay';
import InviteEmployeeComponent from '#/ui/employees/InviteEmployeeComponent';
import type { SerializedEmployee } from '#/types/UserTypes';
import { EmployeeDetails } from './EmployeeDetails';
import { EmployeeTabContent } from './EmployeeTabContent';
import { RouteType } from '#/types/RouteTypes';
import { UserType } from '#/types/UserTypes';
import { WorkTimeShiftType } from '#/types/WorkTimeShiftTypes';

interface UnpairedEmployeeProps {
  dbEmployee: UserType;
  unpairedSerializedEmployeeData: SerializedEmployee;
  orgId: string;
  initialRoutes: RouteType[];
  workTimeTop: WorkTimeShiftType[];
}

const UnpairedEmployee: React.FC<UnpairedEmployeeProps> = ({
  dbEmployee,
  unpairedSerializedEmployeeData,
  orgId,
  initialRoutes,
  workTimeTop,
}) => {
  // Transform initialRoutes to match the expected type
  const transformedRoutes = initialRoutes.map((route) => ({
    id: route.id.toString(),
    routeNiceName: route.routeNiceName,
    organizationID: route.organizationID,
    routeIDFromPostOffice: route.routeIDFromPostOffice,
    dateRouteAcquired: route.dateRouteAcquired,
    dateAddedToCB: route.dateAddedToCB,
    img: route.img,
  }));

  // Transform workTimeTop to match the expected type
  const transformedWorkTime = workTimeTop.map((wt) => ({
    id: wt.id?.toString() || '',
    organizationID: wt.organizationID,
    dateAddedToCB: wt.dateAddedToCB,
    summary: wt.summary,
  }));

  // The whole entire reason why this component is showing because
  // there is no dbEmployee.clerkID
  return (
    <div className="space-y-8">
      <Link href="/employees" className="text-blue-500 hover:underline">
        &larr; Back to all employees
      </Link>

      <h1 className="text-xl font-medium text-gray-300">Employee Details</h1>
      <AuthorizationDisplay employeeId={dbEmployee.id || ''} orgId={orgId} />
      <>
        <InviteEmployeeComponent
          employee={{
            id: dbEmployee.id || '',
            email: dbEmployee.email || '',
          }}
          orgId={orgId}
        />

        <EmployeeDetails employee={unpairedSerializedEmployeeData} />
        <EmployeeTabContent
          employee={unpairedSerializedEmployeeData}
          initialRoutes={transformedRoutes}
          // @ts-ignore
          workTimeTop={transformedWorkTime}
        />
      </>
    </div>
  );
};

export default UnpairedEmployee;
