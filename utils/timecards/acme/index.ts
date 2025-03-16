import { generateCBudPDF } from './pdfDrawer';
import { WorkTimeShiftType } from '#/types/WorkTimeShiftTypes';
import { RouteType } from '#/types/RouteTypes';
import { RouteShiftInfoType } from '#/types/RouteShiftInfoTypes';

/**
 * Generates a PDF timecard for a specific employee within a pay period
 * @param initialWorkTime - Initial work time data
 * @param selectedEmployeeID - ID of the selected employee
 * @param selectedEmployeeName - Name of the selected employee
 * @param initialRoutes - Available routes
 * @param startPayPeriod - Start date of pay period
 * @param endPayPeriod - End date of pay period
 * @param routeShiftInfo - Information about route shifts
 */
export const CBudTemplatePDF = async (
  initialWorkTime: WorkTimeShiftType[],
  selectedEmployeeID: string,
  selectedEmployeeName: string,
  initialRoutes: RouteType[],
  startPayPeriod: string,
  endPayPeriod: string,
  routeShiftInfo: RouteShiftInfoType[],
) => {
  try {
    // Fetch updated work time data from the API
    const response = await fetch('/api/pdf-worktime-info');
    if (!response.ok) {
      throw new Error('Failed to fetch work time data');
    }
    const { data: workTimeData } = await response.json();

    // Create date objects for the pay period
    const startDateObj = new Date(startPayPeriod);
    const endDateObj = new Date(endPayPeriod);

    // Filter work time data for the specific employee and date range
    const employeeWorkTime = workTimeData.filter((wt: WorkTimeShiftType) => {
      const shiftDate = new Date(wt.dayScheduled);
      return (
        wt.userId === selectedEmployeeID &&
        wt.occupied &&
        shiftDate >= startDateObj &&
        shiftDate <= endDateObj
      );
    });

    // Sort by date and shift time
    const sortedEmployeeWorkTime = employeeWorkTime.sort((a: WorkTimeShiftType, b: WorkTimeShiftType) => {
      // First sort by date
      const dateA = new Date(a.dayScheduled);
      const dateB = new Date(b.dayScheduled);
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA.getTime() - dateB.getTime();
      }
      
      // If same date, sort by shift time
      const shiftA = routeShiftInfo.find(shift => shift.id === a.shiftWorked);
      const shiftB = routeShiftInfo.find(shift => shift.id === b.shiftWorked);
      if (shiftA && shiftB) {
        return shiftA.startTime.localeCompare(shiftB.startTime);
      }
      return 0;
    });

    console.log(`Generating PDF for ${selectedEmployeeName} with ${sortedEmployeeWorkTime.length} shifts`);

    // Generate PDF with the filtered and sorted work time data
    const modifiedPdfBytes = await generateCBudPDF(
      sortedEmployeeWorkTime,
      selectedEmployeeID,
      selectedEmployeeName,
      startDateObj,
      endDateObj,
      initialRoutes,
      routeShiftInfo,
    );

    // Create and download the PDF file
    const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
    const pdfUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = `timecard_${selectedEmployeeName.replace(/\s+/g, '_')}_${startPayPeriod.split('T')[0]}.pdf`;
    a.click();
    URL.revokeObjectURL(pdfUrl);

  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};