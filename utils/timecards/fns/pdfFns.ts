import { PDFDocument, rgb, StandardFonts, PDFPage } from 'pdf-lib';
import { WorkTimeShiftType } from '#/types/WorkTimeShiftTypes';
import { RouteType } from '#/types/RouteTypes';
import { RouteShiftInfoType } from '#/types/RouteShiftInfoTypes';
import { calculateTotalTime, formatDate } from '#/utils/timecards/acme/utils';
import coordinates from '#/utils/timecards/pdf-coordinates.json';

const FONT_SIZE = 10;

// Function to draw text on the PDF page
export const drawText = async (
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  size: number = FONT_SIZE,
) => {
  const font = await page.doc.embedFont(StandardFonts.Helvetica);
  page.drawText(text, {
    x,
    y,
    size,
    font,
    color: rgb(0, 0, 0),
  });
};

export const formatDateToString = (
  startPayPeriod: Date,
  endPayPeriod: Date,
): Array<string> => {
  // This is just the written date which is fine.
  const startDate = new Date(startPayPeriod).toISOString().split('T')[0];
  const endDate = new Date(endPayPeriod).toISOString().split('T')[0];
  return [startDate, endDate];
};

// Function to draw work time information on the PDF
export const drawWorkTimeInfo = async (
  page: PDFPage,
  workTime: WorkTimeShiftType,
  x: number,
  y: number,
  routes: RouteType[],
  routeShiftInfo: RouteShiftInfoType[],
) => {
  const route = routes.find((r) => r.id === workTime.routeId);
  const routeNiceName = route ? route.routeNiceName : 'Unknown Route';

  const shiftInfo = routeShiftInfo.find(
    (info) => info.id === workTime.shiftWorked,
  );

  let startTime = 'N/A';
  let endTime = 'N/A';
  let totalTime = 0;
  let totalPageTime: number = 0;
  if (shiftInfo) {
    startTime = shiftInfo.startTime;
    endTime = shiftInfo.endTime;
    totalTime = calculateTotalTime(startTime, endTime);

    totalPageTime += totalTime;
  }

  // Shift Name
  await drawText(
    page,
    shiftInfo?.shiftName || 'N/A',
    x + coordinates.tripNumberPositioning.x,
    y + coordinates.tripNumberPositioning.y,
  );

  // Start time
  await drawText(
    page,
    startTime,
    x + coordinates.timeTextPositioningStart.x,
    y + coordinates.timeTextPositioningStart.y,
  );
  // End time
  await drawText(
    page,
    endTime,
    x + coordinates.timeTextPositioningEnd.x,
    y + coordinates.timeTextPositioningEnd.y,
  );
  // Total time
  await drawText(
    page,
    totalTime.toString(),
    x + coordinates.totalTimePositioning.x,
    y + coordinates.totalTimePositioning.y,
  );

  // Route Nice Name
  await drawText(
    page,
    routeNiceName,
    x + coordinates.routeNiceNamePositioning.x,
    y + coordinates.routeNiceNamePositioning.y,
  );
  return totalPageTime;
};

// Function to draw work times for a specific day
export const drawDateOfWorkTimes = async (
  page: PDFPage,
  workTimes: WorkTimeShiftType[],
  day: string,
) => {
  if (workTimes.length === 0) return;
  const { dateStr } = formatDate(
    workTimes[0].dayScheduled
      ? new Date(workTimes[0].dayScheduled)
      : new Date(),
  );
  const dayAccessor = day as keyof typeof coordinates.dayMonthYearCoordinates;

  // This draws the date.
  await drawText(
    page,
    dateStr,
    coordinates.dayMonthYearCoordinates[dayAccessor][0], // X coordinate
    coordinates.dayMonthYearCoordinates[dayAccessor][1], // Y coordinate
  );
};

// Function to draw work times for a specific day
export const drawDayWorkTimes = async (
  page: PDFPage,
  workTimes: WorkTimeShiftType[],
  routes: RouteType[],
  routeShiftInfo: RouteShiftInfoType[],
  yLower: number,
) => {
  if (workTimes.length === 0) return;

  const dayOfWeek = getDayOfWeek(workTimes[0]);
  const [x, y] = returnDaysOfWeekCoordinates(dayOfWeek);

  // This is not causing the bug with the days written in the bottom
  // left corner:
  await drawText(page, dayOfWeek, x, y);

  // Neither is this:
  const returnValue: number = await drawWorkTimeInfo(
    page,
    workTimes[0],
    x - coordinates.workTimeSpacingX,
    yLower + y - coordinates.workTimeSpacingY,
    routes,
    routeShiftInfo,
  );
  return returnValue || 0.159;
};

export const filterShiftsByDateRange = (
  shifts: WorkTimeShiftType[],
  startPayPeriod: Date,
  endPayPeriod: Date,
): WorkTimeShiftType[] => {
  return shifts.filter((shift) => {
    const shiftDate = new Date(shift.dayScheduled);
    return shiftDate >= startPayPeriod && shiftDate <= endPayPeriod;
  });
};

// Function to get the coordinates for each day of the week
export const returnDaysOfWeekCoordinates = (dayOfWeek: string): number[] => {
  if (dayOfWeek in coordinates.dayOfWeekLocation) {
    return coordinates.dayOfWeekLocation[
      dayOfWeek as keyof typeof coordinates.dayOfWeekLocation
    ];
  }
  return [0, 0]; // Default coordinates if day not found
};

// Function to get the day of the week from a WorkTimeShiftType object
export const getDayOfWeek = (workTime: WorkTimeShiftType): string => {
  const days = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  return days[
    workTime.dayScheduled ? new Date(workTime.dayScheduled).getDay() : 0
  ];
};

// Adds page numbers to a PDF page
export const pageNumbers = (
  font: any, // TODO: Replace 'any' with specific font type
  currentPage: PDFPage,
  pageIndex: number,
  totalPages: number,
): void => {
  const fontSize = 10;
  const text = `${pageIndex + 1} of ${totalPages + 1}`;
  const textWidth = font.widthOfTextAtSize(text, fontSize);
  const pageWidth = currentPage.getWidth();
  const pageHeight = currentPage.getHeight();
  const x = pageWidth - textWidth - 50; // 50 pixels from the right edge
  const y = 30; // 30 pixels from the bottom
  currentPage.drawText(text, {
    x,
    y,
    size: fontSize,
    font,
    color: rgb(0, 0, 0),
  });
};

// Adds a heading to a PDF page, optionally with an underline
export const addPageHeading = (
  currentPage: any, // TODO: Replace 'any' with specific page type
  text: string,
  x: number,
  y: number,
  fontSize: number = 16,
  boldFont: any, // TODO: Replace 'any' with specific font type
  isUnderline: boolean = true,
): void => {
  if (text !== undefined) {
    currentPage.drawText(text, {
      x,
      y,
      size: fontSize,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    if (isUnderline) {
      const textWidth = boldFont.widthOfTextAtSize(text, fontSize);
      currentPage.drawLine({
        start: { x, y: y - 5 },
        end: { x: x + textWidth, y: y - 5 },
        thickness: 1,
        color: rgb(0, 0, 0),
      });
    }
  }
};

// Constants for pagination
const recordsPerPage = 7;
const maxPages = 20;

// Calculates the total number of pages to generate
export const totalPagesToGenerate = (
  workTimeForEmployee: WorkTimeShiftType[],
): number => {
  if (workTimeForEmployee.length === 0) {
    return 0;
  }
  // Find the earliest and latest dates
  const dates = workTimeForEmployee.map(
    (record) => new Date(record.dayScheduled),
  );
  const firstDate = new Date(Math.min(...dates.map((date) => date.getTime())));
  const lastDate = new Date(Math.max(...dates.map((date) => date.getTime())));
  // Calculate the number of weeks
  const msPerWeek = 1000 * 60 * 60 * 24 * 7;
  const weeksBetween = Math.ceil(
    (lastDate.getTime() - firstDate.getTime()) / msPerWeek,
  );
  // Calculate pages based on both weeks and records per page
  const pagesByWeeks = weeksBetween;
  const pagesByRecords = Math.ceil(workTimeForEmployee.length / recordsPerPage);
  // Return the larger of the two calculations, capped at maxPages
  return Math.min(Math.max(pagesByWeeks, pagesByRecords), maxPages);
};

export const writePageHoursBottom = async (
  page: PDFPage,
  hours: number,
  pageIndex: number,
  totalWeeks: number,
  isLastPage: boolean,
) => {
  if (isLastPage == true) {
    await drawText(
      page,
      hours.toString() || '1.0',
      coordinates.bottomBottomHourTimes[0],
      coordinates.bottomBottomHourTimes[1],
    );

    return;
  }
  if (isLastPage == false) {
    // This is the area where we write on the bottom.
    await drawText(
      page,
      hours.toString() || '1.0',
      coordinates.bottomHourTimes[0],
      coordinates.bottomHourTimes[1],
    );
  }
};
