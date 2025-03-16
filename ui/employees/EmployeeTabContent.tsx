'use client';

import { useState } from 'react';
import { WorkTimeShiftType } from '#/types/WorkTimeShiftTypes';
import { RouteType } from '#/types/RouteTypes';
import { UserType } from '#/types/UserTypes';
import { WorkTimeProvider } from '#/utils/context/WorkTimeContext';

import SliderComponent from '../slider/SliderComponent';
import { RouteShiftInfoType } from '#/types/RouteShiftInfoTypes';
import { TimeCardComponent } from '../timecard/timecard-component';

type Item = {
  text: string;
  slug?: string;
};

const Tab: React.FC<{
  item: Item;
  isActive: boolean;
  onClick: () => void;
}> = ({ item, isActive, onClick }) => (
  <button
    className={`rounded-md px-3 py-2 text-sm font-medium ${
      isActive
        ? 'bg-gray-700 text-white'
        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
    }`}
    onClick={onClick}
  >
    {item.text}
  </button>
);

export function EmployeeTabContent({
  orgId,
  employee,
  initialRoutes,
  workTimeTop,
  initialRouteShiftInfo,
  selectedEmployeeID,
}: Readonly<{
  orgId: string;
  employee: UserType;
  initialRoutes: RouteType[];
  workTimeTop: WorkTimeShiftType[];
  initialRouteShiftInfo: RouteShiftInfoType[];
  selectedEmployeeID: string;
}>) {
  const items: Item[] = [
    { text: 'Schedule', slug: 'schedule' },
    { text: 'Generate Timecard', slug: 'timecard' },
    { text: 'Summary', slug: 'summary' },
    { text: 'Payments', slug: 'payments' },
    { text: 'Routes', slug: 'routes' },
  ];

  const [activeTab, setActiveTab] = useState(items[0]);

  const handleTabChange = (item: Item) => {
    setActiveTab(item);
  };
  console.log(60.1, employee);

  const renderContent = () => {
    console.log(63, employee.id);
    switch (activeTab.slug) {
      case 'schedule':
        return (
          <div className="relative z-0 space-y-10 text-white">
            <div className="space-y-5">
              <div className="text-gray-1800 text-xs font-semibold uppercase tracking-wider">
                <div className="slider-swiper">
                  <div className="text-gray-1300 text-xs font-semibold uppercase tracking-wider">
                    <WorkTimeProvider organizationID={orgId}>
                      <SliderComponent
                        initialRouteShiftInfo={initialRouteShiftInfo}
                        initialWorkTime={workTimeTop}
                        initialRoutes={initialRoutes}
                        // Clerk id may be needed to be used.
                        selectedEmployeeID={selectedEmployeeID}
                        selectedEmployeeName={employee.userNiceName}
                        organizationID={orgId}
                      />
                    </WorkTimeProvider>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'timecard':
        return (
          <div className="text-gray-1300 text-xs font-semibold uppercase tracking-wider">
            {/* fix this */}
            <TimeCardComponent
              initialRoutes={initialRoutes}
              workTimeTop={workTimeTop}
              selectedEmployeeID={selectedEmployeeID}
              selectedEmployeeName={employee.userNiceName}
              routeShiftInfoData={initialRouteShiftInfo}
            />


          </div>
        );
      // Add cases for other tabs (Summary, Payments, Routes) here
      default:
        return <div>Content for {activeTab.text}</div>;
    }
  };

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {items.map((item) => (
          <Tab
            key={item.text}
            item={item}
            isActive={activeTab.text === item.text}
            onClick={() => handleTabChange(item)}
          />
        ))}
      </div>
      <div className="rounded-lg bg-gray-800 p-6 text-white">
        {renderContent()}
      </div>
    </>
  );
}