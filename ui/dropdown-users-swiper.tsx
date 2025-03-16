'use client';
import { Menu, Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';
import SliderComponent from '#/ui/slider/SliderComponent';
import StandardModal from './standard-modal';
import { PlusCircleIcon } from '@heroicons/react/solid';
import Link from 'next/link';
import { WorkTimeProvider } from '#/utils/context/WorkTimeContext';
import { RouteShiftInfoType } from '#/types/RouteShiftInfoTypes';
import { User } from '#/types/UserTypes';
import { Route } from '#/types/RouteTypes';
import { WorkTimeShiftType } from '#/types/WorkTimeShiftTypes';
import { DropdownUsersSwiperProps } from '#/types/ScheduleTypes';

export const DropdownUsersSwiper: React.FC<DropdownUsersSwiperProps> = ({
  initialRouteShiftInfo,
  initialUsers,
  initialRoutes,
  initialWorkTime,
  organizationID,
}) => {
  const [modalIsOpen, setModalIsOpen] = useState(false);

  const [selectedEmployeeName, setSelectedEmployeeName] = useState<string>(
    initialUsers.length > 0 ? initialUsers[0].userNiceName || '' : '',
  );
  const [selectedEmployeeID, setSelectedEmployeeID] = useState<string>(
    initialUsers.length > 0 ? initialUsers[0].id.toString() : '',
  );

  const closeModal = () => {
    setModalIsOpen(false);
  };

  return (
    <>
      {modalIsOpen && (
        <StandardModal
          setIsOpen={setModalIsOpen}
          isOpen={modalIsOpen}
          closeModal={closeModal}
        />
      )}

      <div className="top-16 w-56 text-right">
        <Menu as="div" className="relative z-10 inline-block text-left">
          <div>
            <Menu.Button className="inline-flex w-full justify-center rounded-md bg-black/20 bg-blue-500 px-4 py-2 text-sm font-bold  text-white hover:bg-black/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75">
              {selectedEmployeeName ? selectedEmployeeName : 'Add User'}
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
              {initialUsers.map((user) => (
                <div key={user.id} className="px-1 py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => {
                          setSelectedEmployeeName(user.userNiceName || '');
                          setSelectedEmployeeID(user?.id?.toString() || '');
                        }}
                        className={`${
                          active ? 'bg-blue-500 text-white' : 'text-gray-900'
                        } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                      >
                        {user.userNiceName}
                      </button>
                    )}
                  </Menu.Item>
                </div>
              ))}
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => {
                      setModalIsOpen(true);
                    }}
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
          <WorkTimeProvider organizationID={organizationID}>
            <SliderComponent
              initialRouteShiftInfo={initialRouteShiftInfo}
              initialWorkTime={initialWorkTime}
              initialRoutes={initialRoutes}
              selectedEmployeeID={selectedEmployeeID}
              selectedEmployeeName={selectedEmployeeName}
              organizationID={organizationID}
            />
          </WorkTimeProvider>
          <Link href="/main/routes">
            <h1 className="flex items-center text-lg">
              <PlusCircleIcon className="mr-2 h-5 w-5 text-gray-300" />
              Add Route
            </h1>
          </Link>
        </div>
      </div>
    </>
  );
};
