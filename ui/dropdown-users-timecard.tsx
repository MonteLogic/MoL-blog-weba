'use client';

import React, { Fragment, useState } from 'react';
import { Menu, Transition } from '@headlessui/react';
import StandardModal from './standard-modal';
import { TimeCardComponent } from './timecard/timecard-component';
import { WorkTimeShiftType } from '#/types/WorkTimeShiftTypes';
import { RouteType } from '#/types/RouteTypes';
import { UserType } from '#/types/UserTypes';
import { RouteShiftInfoType } from '#/types/RouteShiftInfoTypes';

/**
 * Props interface for the DropdownUsersTimecard component
 * @interface DropdownUsersTimecardProps
 */
interface DropdownUsersTimecardProps {
  initialEmployees: UserType[];
  initialRoutes: RouteType[];
  initialWorkTime: WorkTimeShiftType[];
  initialRouteShiftInfo: RouteShiftInfoType[];
}

/**
 * Enhanced dropdown component for user timecard management with metadata tracking
 * @component
 */
export const DropdownUsersTimecard: React.FC<DropdownUsersTimecardProps> = ({
  initialRoutes,
  initialEmployees,
  initialWorkTime,
  initialRouteShiftInfo,
}) => {
  const [modalIsOpen, setModalIsOpen] = useState(false);

  const [selectedEmployeeName, setSelectedEmployeeName] = useState<string>(
    initialEmployees.length > 0 ? initialEmployees[0].userNiceName : '',
  );
  const [selectedEmployeeID, setSelectedEmployeeID] = useState<string>(
    initialEmployees.length > 0 ? initialEmployees[0].id || '' : '',
  );

  const closeModal = (): void => {
    setModalIsOpen(false);
  };

  const handleEmployeeSelect = (employee: UserType): void => {
    setSelectedEmployeeName(employee.userNiceName);
    setSelectedEmployeeID(employee.id || '');
  };

  // Filter workTimeTop based on selectedEmployeeID and occupied status
  const filteredWorkTime = initialWorkTime.filter(
    (workTime) =>
      workTime.userId === selectedEmployeeID && workTime.occupied === true,
  );

  return (
    <>
      {modalIsOpen && (
        <StandardModal
          setIsOpen={setModalIsOpen}
          isOpen={modalIsOpen}
          closeModal={closeModal}
        />
      )}

      <div className="space-y-4">
        <div className="flex justify-center">
          <Menu as="div" className="relative z-10 inline-block text-left">
            <div>
              <Menu.Button className="inline-flex w-full justify-center rounded-md bg-blue-500 px-4 py-2 text-sm font-bold text-white hover:bg-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75">
                {selectedEmployeeName || 'No available user'}
              </Menu.Button>
            </div>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none">
                {initialEmployees.map((employee) => (
                  <div key={employee.id} className="px-1 py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => handleEmployeeSelect(employee)}
                          className={`${
                            active ? 'bg-blue-500 text-white' : 'text-gray-900'
                          } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                        >
                          {employee.userNiceName}
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                ))}
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => setModalIsOpen(true)}
                      className={`${
                        active ? 'bg-blue-500 text-white' : 'text-gray-900'
                      } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                    >
                      Add Employee
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>

        <div className="slider-swiper">
          <div className="text-gray-1300 text-xs font-semibold uppercase tracking-wider">
            <TimeCardComponent
              initialRoutes={initialRoutes}
              workTimeTop={filteredWorkTime}
              selectedEmployeeID={selectedEmployeeID}
              selectedEmployeeName={selectedEmployeeName}
              routeShiftInfoData={initialRouteShiftInfo}
            />
          </div>
        </div>
      </div>
    </>
  );
};
