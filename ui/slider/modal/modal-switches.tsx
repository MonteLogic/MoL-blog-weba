import React, { useState, useEffect, useCallback } from 'react';
import { Switch } from '@headlessui/react';
import { InferSelectModel } from 'drizzle-orm';
import { routeShiftInfo } from '#/db/schema';
import { useWorkTime } from '#/utils/context/WorkTimeContext';
import { uuid } from '#/utils/dbUtils';
import { WorkTimeShiftType } from '#/types/WorkTimeShiftTypes';
import {
  Clock,
  UserCheck,
  UserX,
  Shield,
  ShieldAlert,
  Save,
} from 'lucide-react';

/**
 * Type definition for the assigned user information
 */
type AssignedUserInfo = {
  userId: string;
  name: string;
};

/**
 * Props interface for the ModalSwitches component
 */
interface ModalSwitchesProps {
  employeeName: string;
  employeeID: string;
  workTimeForEmployee: WorkTimeShiftType[];
  shiftSlots: InferSelectModel<typeof routeShiftInfo>[];
  setHasChanges: React.Dispatch<React.SetStateAction<boolean>>;
  selectedDate: Date;
  orgID: string;
  isAdminMode?: boolean;
  onSave: (updatedWorkTime: WorkTimeShiftType[]) => void;
  /** Map of user IDs to names for displaying assigned users */
  userNameMap: Record<string, string>;
}

/**
 * Enhanced Modal Switches component with admin features and assigned user display
 */
export const ModalSwitches: React.FC<ModalSwitchesProps> = ({
  employeeID,
  employeeName,
  workTimeForEmployee,
  shiftSlots,
  setHasChanges,
  selectedDate,
  orgID,
  isAdminMode = false,
  onSave,
  userNameMap,
}) => {
  const [localWorkTime, setLocalWorkTime] = useState<WorkTimeShiftType[]>([]);
  // const [showAdminConfirmation, setShowAdminConfirmation] = useState(false);
  // const [pendingShiftChange, setPendingShiftChange] = useState<{
  //   shiftId: string;
  //   currentAssignee?: AssignedUserInfo;
  // } | null>(null);

  const { workTime } = useWorkTime();

  // Function to get assigned user for a shift
  const getAssignedUser = useCallback(
    (shiftId: string): AssignedUserInfo | undefined => {
      const assignedShift = workTime.find(
        (wt) =>
          wt.shiftWorked === shiftId &&
          new Date(wt.dayScheduled).toDateString() ===
            selectedDate.toDateString() &&
          wt.occupied,
      );

      if (assignedShift) {
        // Default to userId if userNameMap is not provided or doesn't have the user
        const userName =
          userNameMap?.[assignedShift.userId] || assignedShift.userId;
        return {
          userId: assignedShift.userId,
          name: userName,
        };
      }
      return undefined;
    },
    [workTime, selectedDate, userNameMap],
  );

  // Updated to be more precise with filtering
  const updateLocalWorkTime = useCallback(() => {
    const validWorkTime = workTime.filter((wt) => {
      const isSameDay =
        new Date(wt.dayScheduled).toDateString() ===
        selectedDate.toDateString();
      const isCurrentEmployee = wt.userId === employeeID;
      const hasValidShift = wt.shiftWorked && wt.shiftWorked !== '';
      return hasValidShift && isCurrentEmployee && isSameDay;
    });
    setLocalWorkTime(validWorkTime);
  }, [workTime, employeeID, selectedDate]);

  useEffect(() => {
    updateLocalWorkTime();
  }, [workTime, updateLocalWorkTime]);

  const handleSwitchToggle = async (shiftId: string) => {
    console.log('Toggle clicked for shift:', shiftId);

    // Find if there's an existing record for this shift
    const existingRecord = localWorkTime.find(
      (wt) => wt.shiftWorked === shiftId && wt.userId === employeeID,
    );

    const newLocalWorkTime = existingRecord
      ? localWorkTime.map((wt) =>
          wt.id === existingRecord.id ? { ...wt, occupied: !wt.occupied } : wt,
        )
      : [
          ...localWorkTime,
          {
            id: uuid(),
            userId: employeeID,
            shiftWorked: shiftId,
            dayScheduled: selectedDate.toISOString(),
            routeId:
              shiftSlots.find((slot) => slot.id === shiftId)?.routeId ?? '',
            occupied: true,
            organizationID: orgID,
            dateAddedToCB: new Date().toISOString(),
            summary: '',
          },
        ];

    console.log('New local work time:', newLocalWorkTime);
    setLocalWorkTime(newLocalWorkTime);
    setHasChanges(true);
  };

  const handleSave = async () => {
    const currentDate = selectedDate.toDateString();

    try {
      const existingWorkTime = workTime.filter(
        (wt) => new Date(wt.dayScheduled).toDateString() === currentDate,
      );

      const otherUsersWorkTime = existingWorkTime.filter(
        (wt) => wt.userId !== employeeID,
      );

      const updatedEmployeeShifts = localWorkTime.map((wt) => ({
        ...wt,
        dayScheduled: selectedDate.toISOString(),
        organizationID: orgID,
      }));

      const combinedWorkTime = [
        ...otherUsersWorkTime,
        ...updatedEmployeeShifts,
      ];

      onSave(combinedWorkTime);
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving work time:', error);
      alert('Failed to save changes. Please try again.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Available Shifts for {employeeName} on{' '}
          {selectedDate.toLocaleDateString()}
        </h3>
        {isAdminMode && (
          <div className="flex items-center gap-2 text-amber-600">
            <ShieldAlert size={20} />
            <span className="text-sm font-medium">Admin Mode</span>
          </div>
        )}
      </div>

      {shiftSlots.map((shift) => {
        const isAssignedToCurrentUser = localWorkTime.some(
          (wt) =>
            wt.shiftWorked === shift.id &&
            wt.userId === employeeID &&
            wt.occupied,
        );
        const assignedUser = getAssignedUser(shift.id);
        const isAssigned = !!assignedUser;

        return (
          <div
            key={shift.id}
            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-md font-medium">{shift.shiftName}</h4>
                  {isAdminMode && (
                    <Shield size={16} className="text-amber-600" />
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock size={16} />
                  <span>
                    {shift.startTime} - {shift.endTime}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {isAssigned ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <UserCheck size={16} />
                      <span className="text-sm font-medium">
                        Assigned to: {assignedUser.name}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-500">
                      <UserX size={16} />
                      <span className="text-sm">Unassigned</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Switch
                  checked={isAssignedToCurrentUser}
                  onChange={() => handleSwitchToggle(shift.id)}
                  className={`${
                    isAssignedToCurrentUser ? 'bg-blue-600' : 'bg-gray-200'
                  } relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                    ${
                      !isAdminMode && isAssigned && !isAssignedToCurrentUser
                        ? 'cursor-not-allowed opacity-50'
                        : 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                    }`}
                  disabled={
                    !isAdminMode && isAssigned && !isAssignedToCurrentUser
                  }
                >
                  <span className="sr-only">Assign shift</span>
                  <span
                    className={`${
                      isAssignedToCurrentUser
                        ? 'translate-x-6'
                        : 'translate-x-1'
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                  />
                </Switch>
              </div>
            </div>
          </div>
        );
      })}

      <button
        onClick={handleSave}
        className="flex items-center gap-2 rounded bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        <Save size={16} />
        Save Changes
      </button>
    </div>
  );
};
