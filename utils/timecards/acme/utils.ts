import { workTimeShift, routes } from '#/db/schema';
import { WorkTimeShiftType } from '#/types/WorkTimeShiftTypes';

// workTimeForEmployees should already have the values pruned
// due to the fact that the dropdown mechanism can separate
// the WorkTimeShift table data into user based data.

/**
 * Filters work time nodes for a specific employee.
 * @param {WorkTimeShiftType[]} workTimeForEmployee - Array of work time entries.
 * @param {string} selectedEmployeeID - ID of the selected employee.
 * @returns {WorkTimeShiftType[]} Filtered array of work time entries for the selected employee.
 */
export const filterEmployeeNodes = (
  workTimeForEmployee: WorkTimeShiftType[],
  selectedEmployeeID: string,
): WorkTimeShiftType[] => {
  console.log(14, selectedEmployeeID);
  // This
  console.log(15, workTimeForEmployee);
  return workTimeForEmployee.filter((node) => {
    if (!node.id) return false;
    try {
      const summary = node.summary ? JSON.parse(node.summary) : {};
      return summary.selectedEmployeeID === selectedEmployeeID;
    } catch (error) {
      console.error('Error parsing summary:', error);
      return false;
    }
  });
};
/**
 * Filters work time entries within a specified pay period.
 * @param {WorkTimeShiftType[]} workTime - Array of work time entries.
 * @param {string} startDate - Start date of the pay period.
 * @param {string} endDate - End date of the pay period.
 * @returns {WorkTimeShiftType[]} Filtered array of work time entries within the pay period.
 */
export const filterWorkTimeByPayPeriod = (
  workTime: WorkTimeShiftType[],
  startDate: string,
  endDate: string,
): WorkTimeShiftType[] => {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  return workTime.filter((wt) => {
    if (!wt.dayScheduled) return false;
    const date = new Date(wt.dayScheduled).getTime();
    return date >= start && date <= end;
  });
};

/**
 * Sorts work time nodes by date in ascending order.
 * @param {WorkTimeShiftType[]} nodes - Array of work time entries.
 * @returns {WorkTimeShiftType[]} Sorted array of work time entries.
 */
export const sortNodesByDate = (
  nodes: WorkTimeShiftType[],
): WorkTimeShiftType[] => {
  return nodes.sort((a, b) => {
    const dateA = a.dayScheduled ? new Date(a.dayScheduled).getTime() : 0;
    const dateB = b.dayScheduled ? new Date(b.dayScheduled).getTime() : 0;
    return dateA - dateB;
  });
};

/**
 * Extracts the shifts worked by an employee for a given work time.
 * @param {WorkTimeShiftType} workTime - Work time entry.
 * @returns {string[]} Array of shift names worked.
 */
export const getWorkStatus = (workTime: WorkTimeShiftType): string[] => {
  if (!workTime.summary) return [];
  try {
    const summary = JSON.parse(workTime.summary);
    const shifts = ['Early Morning', 'Mid Morning', 'Mid Day', 'Afternoon'];
    return shifts.filter((shift) => summary.shiftsWorking[shift]);
  } catch (error) {
    console.error('Error parsing summary:', error);
    return [];
  }
};

/**
 * Formats a date into day of week and date string.
 * @param {Date} date - Date to format.
 * @returns {{ dayOfWeek: string, dateStr: string }} Formatted date object.
 */
export const formatDate = (
  date: Date,
): { dayOfWeek: string; dateStr: string } => {
  const dayOfWeek = date.toLocaleString('en-US', { weekday: 'long' });
  const dateStr = date.toLocaleString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: '2-digit',
  });
  return { dayOfWeek, dateStr };
};

export const calculateTotalTime = (startTime: string, endTime: string): number => {
  // Split startTime and endTime into hours and minutes
  let [startHour, startMinute] = startTime.split(':').map(Number);
  let [endHour, endMinute] = endTime.split(':').map(Number);

  // If endTime is earlier than startTime, it means the shift went past midnight
  if (
    endHour < startHour ||
    (endHour === startHour && endMinute < startMinute)
  ) {
    endHour += 24; // Add 24 hours to endTime to account for the overnight shift
  }

  // Calculate the difference in hours and minutes
  let hourDiff = endHour - startHour;
  let minuteDiff = endMinute - startMinute;

  // Adjust if minuteDiff is negative
  if (minuteDiff < 0) {
    minuteDiff += 60;
    hourDiff -= 1;
  }

  // Convert total time into decimal format (minutes as a fraction of an hour)
  let totalTimeInDecimal = hourDiff + minuteDiff / 60;

  // Return the total time in decimal format
  return totalTimeInDecimal; // Limit to 2 decimal places
};
