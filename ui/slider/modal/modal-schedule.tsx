import React, { useState, useEffect } from 'react';
import { SwiperModalScheduleProps } from '#/types/ScheduleTypes';
import { routeShiftInfo, workTimeShift } from '#/db/schema';
import { InferSelectModel } from 'drizzle-orm';
import { useWorkTime } from '#/utils/context/WorkTimeContext';
import { ModalSwitches } from './modal-switches';
import Modal from '#/ui/modal';
import { X } from 'lucide-react';

/** Type definition for work time data from database schema */
type WorkTimeData = InferSelectModel<typeof workTimeShift>;

/** Type definition for route shift info from database schema */
type RouteShiftInfoData = InferSelectModel<typeof routeShiftInfo>;

/**
 * ModalSchedule Component - Handles the scheduling modal interface for employee work time management
 *
 * @component
 * @param {Object} props - Component props
 * @param {string} props.routeName - Name of the route being scheduled
 * @param {string} props.employeeID - Unique identifier for the employee
 * @param {string} props.employeeName - Name of the employee being scheduled
 * @param {RouteShiftInfoData[]} props.shiftSlots - Available shift slots for the route
 * @param {Function} props.setIsOpen - Function to control modal's open state
 * @param {boolean} props.isOpen - Current state of modal (open/closed)
 * @param {Function} props.closeModal - Function to handle modal closure
 * @param {WorkTimeData | WorkTimeData[]} props.workTimeForEmployee - Current work time data for the employee
 * @param {Date} props.selectedDate - Selected date for scheduling
 * @param {string} props.orgID - Organization identifier
 * @returns {JSX.Element} Rendered modal component
 */
const ModalSchedule: React.FC<SwiperModalScheduleProps> = ({
  routeName,
  employeeID,
  employeeName,
  shiftSlots,
  setIsOpen,
  isOpen,
  closeModal,
  workTimeForEmployee,
  selectedDate,
  orgID,
}) => {
  const { updateWorkTime, fetchWorkTime, workTime } = useWorkTime();

  /** Tracks whether changes have been made to the schedule */
  const [hasChanges, setHasChanges] = useState(false);

  /** Manages the state of the save button */
  const [saveButtonState, setSaveButtonState] = useState<
    'Save' | 'Saving...' | 'Saved!'
  >('Save');

  /** Stores the local copy of work time data */
  const [localWorkTime, setLocalWorkTime] = useState<WorkTimeData[]>([]);

  /** Generate userNameMap from workTime data */
  const [userNameMap, setUserNameMap] = useState<Record<string, string>>({});

  /**
   * Effect hook to build userNameMap from existing workTime data
   */
  useEffect(() => {
    const map: Record<string, string> = {};
    workTime.forEach(wt => {
      // Add the current employee to the map
      if (wt.userId === employeeID) {
        map[employeeID] = employeeName;
      }
      // For other users, use their ID as name if we don't have it yet
      else if (!map[wt.userId]) {
        map[wt.userId] = wt.userId;
      }
    });
    // Ensure current employee is in the map even if they have no workTime
    if (!map[employeeID]) {
      map[employeeID] = employeeName;
    }
    setUserNameMap(map);
  }, [workTime, employeeID, employeeName]);

  /**
   * Effect hook to synchronize local work time state with props
   * Handles both array and single object cases
   */
  useEffect(() => {
    const workTimeArray = Array.isArray(workTimeForEmployee)
      ? workTimeForEmployee
      : workTimeForEmployee
      ? [workTimeForEmployee]
      : [];
    setLocalWorkTime(workTimeArray);
  }, [workTimeForEmployee]);

  /**
   * Handles saving updated work time data to the backend
   *
   * @async
   * @param {WorkTimeData[]} updatedWorkTime - Array of updated work time entries
   * @throws {Error} When the API call fails
   */
  const handleSave = async (updatedWorkTime: WorkTimeData[]) => {
    setSaveButtonState('Saving...');
    try {
      const response = await fetch('/api/add-work-time', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedWorkTime),
      });

      if (!response.ok) {
        throw new Error('Failed to save work time');
      }

      const result = await response.json();
      updateWorkTime(result.data);
      setLocalWorkTime(result.data);
      await fetchWorkTime();
      setSaveButtonState('Saved!');
      setHasChanges(false);
      setTimeout(() => setSaveButtonState('Save'), 2000);
    } catch (error) {
      console.error('Error saving work time:', error);
      setSaveButtonState('Save');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={closeModal}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Route Name: {routeName}</h2>
        <button
          className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none"
          onClick={closeModal}
          aria-label="Close modal"
        >
          <X size={20} />
        </button>
      </div>
      <ModalSwitches
        employeeName={employeeName}
        employeeID={employeeID}
        workTimeForEmployee={localWorkTime}
        shiftSlots={shiftSlots as RouteShiftInfoData[]}
        setHasChanges={setHasChanges}
        selectedDate={selectedDate}
        orgID={orgID}
        onSave={handleSave}
        userNameMap={userNameMap}
        isAdminMode={false} // Set this based on your admin permission logic
      />
    </Modal>
  );
};

export default ModalSchedule;