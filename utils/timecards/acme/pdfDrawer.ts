import { PDFDocument, rgb, StandardFonts, PDFPage } from 'pdf-lib';
import { WorkTimeShiftType } from '#/types/WorkTimeShiftTypes';
import { RouteType } from '#/types/RouteTypes';
import { RouteShiftInfoType } from '#/types/RouteShiftInfoTypes';
import { formatDate, filterWorkTimeByPayPeriod } from './utils';
import coordinates from '../pdf-coordinates.json';

import {
  drawText,
  drawDayWorkTimes,
  addPageHeading,
  formatDateToString,
  filterShiftsByDateRange,
  drawDateOfWorkTimes,
  writePageHoursBottom,
} from '../fns/pdfFns';

/** The default font size for text in the PDF */
const FONT_SIZE = 10;

/**
 * Draws the header section of a PDF page including employee name, date range, and page number
 * @param page - The PDF page to draw on
 * @param selectedEmployeeName - The name of the employee
 * @param startDate - The start date of the week in ISO string format
 * @param endDate - The end date of the week in ISO string format
 * @param pageIndex - The zero-based index of the current page
 * @param totalPages - The total number of pages in the document
 * @param boldFont - The bold font to use for certain text elements
 */
const drawPageHeader = async (
  page: PDFPage,
  selectedEmployeeName: string,
  startDate: string,
  endDate: string,
  pageIndex: number,
  totalPages: number,
  boldFont: any,
): Promise<void> => {
  // Add page heading
  addPageHeading(
    page,
    `Week ${pageIndex + 1} of ${totalPages}`,
    505,
    760,
    8,
    boldFont,
    false,
  );

  // Draw employee name
  await drawText(
    page,
    selectedEmployeeName,
    coordinates.driverNamePosition[0],
    coordinates.driverNamePosition[1],
  );

  // Draw date range
  const startDateObj = new Date(startDate);
  startDateObj.setHours(startDateObj.getHours() + 12);
  const endDateObj = new Date(endDate);
  endDateObj.setHours(endDateObj.getHours() + 12);

  const startDateStr = formatDate(new Date(startDateObj)).dateStr;
  const endDateStr = formatDate(new Date(endDateObj)).dateStr;

  await drawText(
    page,
    startDateStr,
    coordinates.startDatePosition[0],
    coordinates.dateDashPosition[1],
  );
  await drawText(
    page,
    '-',
    coordinates.dateDashPosition[0],
    coordinates.dateDashPosition[1],
    14,
  );
  await drawText(
    page,
    endDateStr,
    coordinates.endDatePosition[0],
    coordinates.endDatePosition[1],
  );
};

/**
 * Calculates the weekly date ranges between two dates
 * @param startDate - The start date of the pay period
 * @param endDate - The end date of the pay period
 * @returns An array of date ranges, where each range contains a start and end date in ISO string format
 */
const getWholeDateRangesWeek = (
  startDate: Date,
  endDate: Date,
): string[][][] => {
  const startOfPayPeriod = new Date(startDate);
  const endOfPayPeriod = new Date(endDate);

  startOfPayPeriod.setHours(0, 0, 0, 0);
  endOfPayPeriod.setHours(23, 59, 59, 999);

  const oneWeekInMs = 7 * 24 * 60 * 60 * 1000;
  const dateRanges: string[][][] = [];

  let currentStartDate = new Date(startOfPayPeriod);

  while (currentStartDate <= endOfPayPeriod) {
    let currentEndDate = new Date(
      currentStartDate.getTime() + 6 * 24 * 60 * 60 * 1000,
    );

    if (currentEndDate > endOfPayPeriod) {
      currentEndDate = new Date(endOfPayPeriod);
    }

    dateRanges.push([
      [currentStartDate.toISOString().split('T')[0]],
      [currentEndDate.toISOString().split('T')[0]],
    ]);

    currentStartDate = new Date(currentStartDate.getTime() + oneWeekInMs);
  }

  return dateRanges;
};

/**
 * Calculates the week number for a given date
 * @param date - The date to calculate the week number for
 * @returns The week number (1-53)
 */
const getWeekNumber = (date: Date): number => {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};

/**
 * Generates a PDF timecard document for an employee
 * @param workTimeTop - Array of work time shifts
 * @param selectedEmployeeID - The ID of the selected employee
 * @param selectedEmployeeName - The name of the selected employee
 * @param startPayPeriod - The start date of the pay period
 * @param endPayPeriod - The end date of the pay period
 * @param initialRoutes - Array of route information
 * @param routeShiftInfo - Array of route shift information
 * @returns Promise resolving to an ArrayBuffer containing the generated PDF
 * @throws Error if PDF generation fails
 */
export const generateCBudPDF = async (
  workTimeTop: WorkTimeShiftType[],
  selectedEmployeeID: string,
  selectedEmployeeName: string,
  startPayPeriod: Date,
  endPayPeriod: Date,
  initialRoutes: RouteType[],
  routeShiftInfo: RouteShiftInfoType[],
): Promise<ArrayBuffer> => {
  try {
    // Calculate total weeks based on pay period
    const dateRanges = getWholeDateRangesWeek(startPayPeriod, endPayPeriod);
    const totalWeeks = dateRanges.length;

    // Fetch the PDF template
    const templatePath =
      '/timecard-pdfs/cbud-acme-timecard-template-no7_10_20_2024.pdf';
    const response = await fetch(templatePath);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const existingPdfBytes = await response.arrayBuffer();

    // Load the PDF document
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Generate pages for each week
    const pages = [pdfDoc.getPages()[0]];
    for (let i = 1; i < totalWeeks; i++) {
      const [newPage] = await pdfDoc.copyPages(pdfDoc, [0]);
      pdfDoc.addPage(newPage);
      pages.push(newPage);
    }

    // Process work time data if it exists
    let workTimesByWeek: Record<number, WorkTimeShiftType[]> = {};
    if (workTimeTop && workTimeTop.length > 0) {
      workTimeTop = filterShiftsByDateRange(
        workTimeTop,
        startPayPeriod,
        endPayPeriod,
      );

      // Sort work times by date
      workTimeTop.sort(
        (a, b) =>
          new Date(a.dayScheduled).getTime() -
          new Date(b.dayScheduled).getTime(),
      );

      // Group work times by week
      workTimesByWeek = workTimeTop.reduce((acc, workTime) => {
        const date = new Date(workTime.dayScheduled);
        const weekNumber = getWeekNumber(date);
        if (!acc[weekNumber]) {
          acc[weekNumber] = [];
        }
        acc[weekNumber].push(workTime);
        return acc;
      }, {} as Record<number, WorkTimeShiftType[]>);
    }

    // Process each page
    for (let i = 0; i < totalWeeks; i++) {
      const page = pages[i];
      const dateRange = dateRanges[i];

      // Always draw the header
      await drawPageHeader(
        page,
        selectedEmployeeName,
        dateRange[0][0],
        dateRange[1][0],
        i,
        totalWeeks,
        boldFont,
      );

      // Process work times if they exist for this week
      const weekWorkTimes = Object.values(workTimesByWeek)[i] || [];
      if (weekWorkTimes.length > 0) {
        const daysOfWeek = [
          'Sunday',
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
        ].map((day, dayIndex) => ({
          name: day,
          times: weekWorkTimes.filter(
            (wt) => new Date(wt.dayScheduled).getDay() === dayIndex,
          ),
        }));

        let totalHours = 0;
        let totalTotalHours = 0;
        const isLastPage = i === totalWeeks - 1;

        for (const day of daysOfWeek) {
          if (day.times.length > 0) {
            let yLower = 0;
            drawDateOfWorkTimes(page, day.times, day.name);
            for (let j = 0; j < day.times.length; j++) {
              totalHours =
                (await drawDayWorkTimes(
                  page,
                  [day.times[j]],
                  initialRoutes,
                  routeShiftInfo,
                  yLower,
                )) || 0;
              yLower -= coordinates.workTimeSpacingY2;
            }
          }
          totalTotalHours += totalHours;
        }

        writePageHoursBottom(
          page,
          isLastPage ? totalTotalHours : totalHours,
          i + 1,
          totalWeeks,
          isLastPage,
        );
      }
    }

    // Save and return the PDF
    return await pdfDoc.save();
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};
