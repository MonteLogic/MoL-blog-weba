'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AddRouteComponent } from '#/ui/add-routes-component';
import { routes } from '#/db/schema';
import { eq } from 'drizzle-orm';
import { tursoClient } from '#/db'; // Assuming you have a db instance exported from your database setup
import { RouteListRoutePgProps, AddRouteType } from '#/types/RouteTypes';
import { uuid } from '#/utils/dbUtils';

type RouteType = typeof routes.$inferSelect;

export default function RouteListRoutePg({
  initialRoutes,
  orgId,
}: RouteListRoutePgProps) {
  const [routeList, setRouteList] = useState<RouteType[]>(initialRoutes);
  const router = useRouter();

  const handleDeleteRoute = async (routeId: string) => {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this route?',
    );
    if (confirmDelete === false) return;

    try {
      const db = tursoClient();
      const result = await db.delete(routes).where(eq(routes.id, routeId));
      if (result) {
        setRouteList((prevRoutes) =>
          prevRoutes.filter((route) => route.id !== routeId),
        );
      } else {
        console.error('Failed to delete route');
      }
    } catch (error) {
      console.error('Error deleting route:', error);
    }
  };

  const handleAddRoute = (newRoute: AddRouteType) => {
    const routeToAdd: RouteType = {
      ...newRoute,
      id: uuid(),
      organizationID: newRoute.organizationID ?? '',
      dateRouteAcquired: newRoute.dateRouteAcquired,
      dateAddedToCB: newRoute.dateAddedToCB,
      img: newRoute.img ?? '',
    };
    setRouteList((prevRoutes) => [...prevRoutes, routeToAdd]);
  };

  const formatDate = (date: number | null) => {
    if (date === null) return 'Not set';
    return new Date(date).toDateString();
  };

  return (
    <>
      <div className="rounded-lg bg-white p-6 shadow-md">
        {routeList.length === 0 ? (
          <h2 className="mb-4 text-xl text-black">No existing routes</h2>
        ) : (
          <ul className="divide-y divide-gray-200">
            {routeList.map((route) => (
              <li key={route.id} className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-semibold">
                      {route.routeNiceName}
                    </p>
                    <p className="text-gray-500">ID: {route.id}</p>
                    <p className="text-gray-500">
                      Organization ID: {route.organizationID}
                    </p>
                    <p className="text-gray-500">
                      Route ID from Post Office: {route.routeIDFromPostOffice}
                    </p>
                    <p className="text-gray-500">
                      Date Added to CB: {route.dateAddedToCB}
                    </p>
                    {/* <p className="text-gray-500"> */}
                    {/* List the shifts associated with the route  */}
                    {/* Allocated Shifts: {route.allocatedShifts} */}
                    {/* </p> */}
                    <p className="text-gray-500">Image: {route.img}</p>
                  </div>
                  <button
                    className="rounded bg-red-500 px-4 py-2 font-bold text-white hover:bg-red-600"
                    onClick={() => handleDeleteRoute(route.id)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <AddRouteComponent handleRouteAdd={handleAddRoute} />
    </>
  );
}
