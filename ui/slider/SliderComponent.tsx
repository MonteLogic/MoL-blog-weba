import React, { useState } from 'react';
import { useWorkTime } from '#/utils/context/WorkTimeContext';
import { WorkTimeShiftType } from '#/types/WorkTimeShiftTypes';
import { RouteShiftInfoType } from '#/types/RouteShiftInfoTypes';
import { Route } from '#/types/RouteTypes';
import ModalSchedule from '#/ui/slider/modal/modal-schedule';
import RouteList from './RouteList';
import { findSelectedRouteInfo } from '#/utils/routeUtils';
import { uuid } from '#/utils/dbUtils';

interface SliderComponentProps {
  initialRouteShiftInfo: RouteShiftInfoType[];
  initialWorkTime: WorkTimeShiftType[];
  initialRoutes: Route[];
  selectedEmployeeID: string;
  selectedEmployeeName: string;
  organizationID: string;
  onWorkTimeUpdate?: (updatedWorkTime: WorkTimeShiftType[]) => void;
}

export const SliderComponent: React.FC<SliderComponentProps> = ({
  initialRouteShiftInfo,
  initialWorkTime,
  initialRoutes,
  selectedEmployeeID,
  selectedEmployeeName,
  organizationID,
  onWorkTimeUpdate,
}) => {
  console.log(25,selectedEmployeeID);
  const { workTime, setWorkTime, updateWorkTime } = useWorkTime();
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedSwiperInfo, setSelectedSwiperInfo] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedRouteInfo, setSelectedRouteInfo] = useState<{
    routeName: string;
    allocatedShifts: RouteShiftInfoType[];
  } | null>(null);
  const [shiftSlots, setShiftSlots] = useState<RouteShiftInfoType[]>([]);
  const [workTimeForEmployee, setWorkTimeForEmployee] = useState<
    WorkTimeShiftType[]
  >([]);

  const handleButtonClick = async (
    date: Date,
    loopRelevantRoute: string,
    relevantEmployeesWorkInfo: WorkTimeShiftType[] | undefined,
  ) => {
    setModalIsOpen(true);
    setSelectedSwiperInfo(date.toDateString());
    setSelectedDate(date);

    try {
      const selectedRouteInfo = await findSelectedRouteInfo(
        initialRouteShiftInfo,
        loopRelevantRoute,
        initialRoutes,
      );

      if (selectedRouteInfo) {
        const [routeNiceName, parsedAllocatedShifts] = selectedRouteInfo;
        setSelectedRouteInfo({
          routeName: routeNiceName,
          allocatedShifts: parsedAllocatedShifts,
        });
        setShiftSlots(parsedAllocatedShifts);
      } else {
        setSelectedRouteInfo(null);
        setShiftSlots([]);
      }

      // Filter and set relevant work time records for the employee and date
      const relevantWorkTime = initialWorkTime.filter(
        (wt) =>
          wt.userId === selectedEmployeeID &&
          new Date(wt.dayScheduled).toDateString() === date.toDateString(),
      );
      setWorkTimeForEmployee(relevantWorkTime);

      if (relevantWorkTime.length === 0) {
        const newWorkTime: WorkTimeShiftType = {
          id: uuid(),
          dayScheduled: new Date(date.setUTCHours(6, 0, 0, 0)).toISOString(),
          dateAddedToCB: new Date().toISOString(),
          routeId: loopRelevantRoute,
          summary: '',
          organizationID: organizationID,
          shiftWorked: '',
          userId: selectedEmployeeID,
          occupied: false,
        };
        setWorkTimeForEmployee([newWorkTime]);
      }

      if (onWorkTimeUpdate) {
        onWorkTimeUpdate(relevantWorkTime);
      }
    } catch (error) {
      console.error('Error in handleButtonClick:', error);
      // Handle the error appropriately (e.g., show an error message to the user)
    }
  };

  return (
    <>
      {modalIsOpen && (
        <ModalSchedule
          routeName={selectedRouteInfo?.routeName || ''}
          setIsOpen={setModalIsOpen}
          isOpen={modalIsOpen}
          closeModal={() => setModalIsOpen(false)}
          selectedSwiperInfo={selectedSwiperInfo}
          employeeName={selectedEmployeeName}
          employeeID={selectedEmployeeID}
          selectedDate={selectedDate}
          workTimeForEmployee={workTimeForEmployee}
          setWorkTimeForEmployee={setWorkTimeForEmployee}
          shiftSlots={selectedRouteInfo?.allocatedShifts || []}
          orgID={organizationID}
        />
      )}
      <div>
        <h2>Routes:</h2>
        <p>Selected Employee: </p>
        <p>{selectedEmployeeID}</p>
        <p>{selectedEmployeeName}</p>
        <RouteList
          initialRoutes={initialRoutes}
          workTime={workTime}
          selectedEmployeeName={selectedEmployeeName}
          selectedEmployeeID={selectedEmployeeID}
          handleButtonClick={handleButtonClick}
        />
      </div>
    </>
  );
};

export default SliderComponent;
