'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { routes, routeShiftInfo, workTimeShift } from '#/db/schema';
import { GenerateTemplateB } from '#/utils/timecards/GenerateTemplateB';
import { CBudTemplatePDF } from '#/utils/timecards/acme';
import Button from '#/ui/button';
import Calendar from '#/ui/calendar';
import { WorkTimeShiftType } from '#/types/WorkTimeShiftTypes';
import { RouteShiftInfoType } from '#/types/RouteShiftInfoTypes';
import { RouteType } from '#/types/RouteTypes';
import payDefaults from '#/default-data/pay-period-default-1.json';
import { useTimecardsMetadata } from '#/ui/clerk/clerk-metadata';

/**
 * Props interface for the TimeCard component
 * @interface TimeCardComponentProps
 */
interface TimeCardComponentProps {
  /** Array of initial route configurations */
  initialRoutes: RouteType[];
  /** Work time shifts data or function that returns work time shifts */
  workTimeTop: WorkTimeShiftType[] | (() => WorkTimeShiftType[]);
  /** Unique identifier for the selected employee */
  selectedEmployeeID: string;
  /** Full name of the selected employee */
  selectedEmployeeName: string;
  /** Array of route shift information data */
  routeShiftInfoData: RouteShiftInfoType[];
}

/**
 * Enum representing different types of timecard templates
 * @enum {number}
 */
enum TemplateType {
  /** Acme Trucking template format */
  Acme = 1,
  /** Standard template format */
  Standard = 2,
}

/**
 * TimeCardComponent handles the generation and display of employee timecards
 * with support for multiple template types and pay periods.
 *
 * @component
 * @param {TimeCardComponentProps} props - Component props
 * @returns {JSX.Element} Rendered TimeCard component
 */
export const TimeCardComponent: React.FC<TimeCardComponentProps> = ({
  initialRoutes,
  workTimeTop,
  selectedEmployeeID,
  selectedEmployeeName,
  routeShiftInfoData
}) => {
  // State declarations with type annotations
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [timeCardTemplate, setTimecardTemplate] = useState<TemplateType>(
    TemplateType.Acme,
  );
  const [startPayPeriod, setStartPayPeriod] = useState<number>(
    payDefaults.payPeriod1[0],
  );
  const [endPayPeriod, setEndPayPeriod] = useState<number>(
    payDefaults.payPeriod1[0],
  );
  const [dateSelection, setDateSelection] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [calendar, setCalendar] = useState<(Date | null)[][]>([]);
  const [routeShiftInfoVar, setRouteShiftInfoVar] = useState<
    RouteShiftInfoType[]
  >([]);
  const [generatedCount, setGeneratedCount] = useState<number>(0);

  let lastDayOfSelectedMonth = 31;

  /**
   * Determines the current pay period based on the selected month and current date
   * @returns {{ start: number; end: number }} Object containing start and end days of the pay period
   */
  const getCurrentPayPeriod = () => {
    const today = new Date();
    const currentDay = today.getDate();
    const month = selectedMonth !== null ? selectedMonth : today.getMonth();
    const year = today.getFullYear();

    lastDayOfSelectedMonth = new Date(year, month + 1, 0).getDate();

    return currentDay <= 14
      ? { start: payDefaults.payPeriod1[0], end: payDefaults.payPeriod1[1] }
      : { start: payDefaults.payPeriod2[0], end: lastDayOfSelectedMonth };
  };

  /**
   * Initialize pay period and calendar on component mount
   */
  useEffect(() => {
    const { start, end } = getCurrentPayPeriod();
    setStartPayPeriod(start);
    setEndPayPeriod(end);
    generateCalendar();
  }, []);

  /**
   * Update calendar when date selection or pay period changes
   */
  useEffect(() => {
    generateCalendar();
  }, [dateSelection, startPayPeriod, endPayPeriod]);

  /**
   * Generates the calendar grid for the selected month
   */
  const generateCalendar = () => {
    const startDate = new Date(dateSelection);
    const year = startDate.getFullYear();
    const month = startDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const calendarData: (Date | null)[][] = [];
    let week: (Date | null)[] = Array(firstDay.getDay()).fill(null);

    for (let day = 1; day <= lastDay.getDate(); day++) {
      if (week.length === 7) {
        calendarData.push(week);
        week = [];
      }
      week.push(new Date(year, month, day));
    }

    while (week.length < 7) {
      week.push(null);
    }
    calendarData.push(week);

    setCalendar(calendarData);
  };

  /**
   * Formats a date object to MM/DD/YYYY string format
   * @param {Date} date - Date to format
   * @returns {string} Formatted date string
   */
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    });
  };

  /**
   * Generates a PDF timecard based on the selected template and current settings
   */
  const generatePDFClientSide = async () => {
    const selectedDate = new Date(dateSelection);
    const startPayPeriodDate = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      startPayPeriod,
    );
    const endPayPeriodDate = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      endPayPeriod,
    );

    const startPayPeriodFormatted = formatDate(startPayPeriodDate);
    const endPayPeriodFormatted = formatDate(endPayPeriodDate);

    const workTimeArray: WorkTimeShiftType[] = Array.isArray(workTimeTop)
      ? workTimeTop
      : workTimeTop();

    switch (timeCardTemplate) {
      case TemplateType.Acme:
        CBudTemplatePDF(
          workTimeArray,
          selectedEmployeeID,
          selectedEmployeeName,
          initialRoutes,
          startPayPeriodFormatted,
          endPayPeriodFormatted,
          routeShiftInfoData,
        );
        break;
      case TemplateType.Standard:
        if (selectedMonth !== null) {
          GenerateTemplateB(
            workTimeArray,
            selectedMonth,
            selectedEmployeeID,
            selectedEmployeeName,
          );
        }
        break;
    }
    // Don't know what this does?
    setGeneratedCount((prev) => prev + 1);

    // Update metadata after successful generation
    if (incrementTimecardsGenerated) {
      await incrementTimecardsGenerated();
    }
  };

  /**
   * Memoized function to check if a date falls within the current pay period
   */
  const isInPayPeriod = useMemo(
    () =>
      (date: Date | null): boolean => {
        if (!date) return false;
        const day = date.getDate();
        const lastDayOfMonth = new Date(
          date.getFullYear(),
          date.getMonth() + 1,
          0,
        ).getDate();
        const effectiveEndDay =
          endPayPeriod === lastDayOfSelectedMonth
            ? lastDayOfMonth
            : endPayPeriod;
        return day >= startPayPeriod && day <= effectiveEndDay;
      },
    [startPayPeriod, endPayPeriod],
  );

  const { count, incrementTimecardsGenerated } = useTimecardsMetadata();

  return (
    <div className="space-y-4">
      <p>Selected Employee: {selectedEmployeeName}</p>
      <h2 className="text-xl font-bold">Time Cards</h2>
      <div className="space-y-2">
        <label htmlFor="template-select">Select a template:</label>
        <select
          id="template-select"
          onChange={(e) =>
            setTimecardTemplate(Number(e.target.value) as TemplateType)
          }
          className="w-full rounded bg-black p-2 text-white"
          value={timeCardTemplate}
        >
          <option value={TemplateType.Acme}>Acme Trucking</option>
          <option value={TemplateType.Standard}>Standard Template</option>
        </select>
      </div>
      <div className="space-y-2">
        <label htmlFor="pay-period-select">Current pay period:</label>
        <select
          id="pay-period-select"
          onChange={(e) => {
            const [start, end] = e.target.value.split('-').map(Number);
            setStartPayPeriod(start);
            setEndPayPeriod(end);
          }}
          className="w-full rounded bg-black p-2 text-white"
          value={`${startPayPeriod}-${endPayPeriod}`}
        >
          <option
            value={`${payDefaults.payPeriod1[0]}-${payDefaults.payPeriod1[1]}`}
          >
            1st - 14th
          </option>
          <option
            value={`${payDefaults.payPeriod2[0]}-${lastDayOfSelectedMonth}`}
          >
            15th - {lastDayOfSelectedMonth}
          </option>
        </select>
      </div>
      <div className="space-y-2">
        <label htmlFor="date-selection">Starting on:</label>
        <input
          id="date-selection"
          className="w-full rounded p-2 text-gray-900"
          type="date"
          value={dateSelection}
          onChange={(e) => setDateSelection(e.target.value)}
        />
      </div>
      <Calendar calendar={calendar} isInPayPeriod={isInPayPeriod} />
      <Button
        onClick={generatePDFClientSide}
        className="w-full justify-center rounded-md bg-blue-500 px-4 py-2 text-sm font-bold text-white hover:bg-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75"
      >
        Generate Timecard
      </Button>
      <div className="flex justify-center text-sm text-gray-600">
        Timecards generated: {count ?? 'Loading...'}
      </div>
    </div>
  );
};
