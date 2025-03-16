'use client';

import React, { useState, useRef } from 'react';
import Button from './button';
import { routes } from '#/db/schema';
import { ShiftSlot } from '#/types/UserTypes';
import { AddRouteComponentProps } from '#/types/RouteTypes';
import ChevronAddSampleRouteData from './chevron-add-sample-route-data';
import { uuid } from '#/utils/dbUtils';
ChevronAddSampleRouteData;

type Route = typeof routes.$inferInsert;

export const AddRouteComponent: React.FC<AddRouteComponentProps> = ({
  handleRouteAdd,
}) => {
  const initialFormData: Route = {
    id:uuid(),
    routeNiceName: '',
    organizationID: '',
    routeIDFromPostOffice: '',
    dateRouteAcquired: new Date().toISOString(),
    dateAddedToCB: new Date().toISOString(),
    img: '',
  };

  const [formData, setFormData] = useState<Route>(initialFormData);
  const [shifts, setShifts] = useState<ShiftSlot[]>([]);
  const [shiftName, setShiftName] = useState('');
  const [shiftStartTime, setShiftStartTime] = useState('');
  const [shiftEndTime, setShiftEndTime] = useState('');

  const shiftNameInputRef = useRef<HTMLInputElement>(null);

  const addRoute = async (newRoute: Route) => {
    try {
      const routeToAdd = {
        ...newRoute,
        id: newRoute.id || undefined, // Let the backend handle ID generation if it's empty
        // I think we are going to add orgId in the backend
        dateRouteAcquired: newRoute.dateRouteAcquired,
        dateAddedToCB: Date.now(),
        allocatedShifts: JSON.stringify(shifts),
        img: newRoute.img || '',
      };

      const response = await fetch('/api/add-new-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(routeToAdd),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const addedRoute = await response.json();
      console.log('Route added successfully', addedRoute);
      handleRouteAdd(addedRoute);
      resetForm();
      return 'Route has been added successfully';
    } catch (error) {
      console.error('Error adding route:', error);
      throw error;
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setShifts([]);
    setShiftName('');
    setShiftStartTime('');
    setShiftEndTime('');
  };

  const addShift = () => {
    if (shiftName.trim() && shiftStartTime && shiftEndTime) {
      const newShift = {
        name: shiftName.trim(),
        startTime: shiftStartTime,
        endTime: shiftEndTime,
      };
      const updatedShifts = [...shifts, newShift];
      setShifts(updatedShifts);
      setFormData((prev) => ({
        ...prev,
        allocatedShifts: JSON.stringify(updatedShifts),
      }));
      setShiftName('');
      setShiftStartTime('');
      setShiftEndTime('');
      shiftNameInputRef.current?.focus();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleShiftInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    switch (name) {
      case 'shiftName':
        setShiftName(value);
        break;
      case 'shiftStartTime':
        setShiftStartTime(value);
        break;
      case 'shiftEndTime':
        setShiftEndTime(value);
        break;
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.ctrlKey && event.key === 'Enter') {
      addShift();
    }
  };
  const fillWithSampleData = (
    sampleRoute: Route,
    sampleShifts: ShiftSlot[],
  ) => {
    setFormData(sampleRoute);
    setShifts(sampleShifts);
  };

  return (
    <>
      <div className="mb-4 flex justify-end">
        <ChevronAddSampleRouteData onFillData={fillWithSampleData} />
      </div>
      <div className="space-y-7">
        <div>
          <label htmlFor="routeNiceName">Route name:</label>
          <input
            type="text"
            id="routeNiceName"
            value={formData.routeNiceName}
            onChange={handleInputChange}
            className="text-gray-900"
          />
        </div>

        <div>
          <label htmlFor="routeIDFromPostOffice">
            Route ID from Post Office:
          </label>
          <input
            type="text"
            id="routeIDFromPostOffice"
            value={formData.routeIDFromPostOffice || ''}
            onChange={handleInputChange}
            className="text-gray-900"
          />
        </div>

        <div>
          <h2 className="text-lg font-semibold">Add Route Shifts:</h2>
          <ul className="divide-y divide-gray-300 rounded border border-gray-300">
            {shifts.map((shift, index) => (
              <li
                key={index}
                className="flex items-center justify-between px-4 py-2"
              >
                <span>{`${shift.name}: ${shift.startTime} - ${shift.endTime}`}</span>
                <button className="text-blue-500">Edit</button>
              </li>
            ))}
          </ul>

          <div className="mt-4" onKeyDown={handleKeyPress}>
            <input
              type="text"
              name="shiftName"
              value={shiftName}
              onChange={handleShiftInputChange}
              ref={shiftNameInputRef}
              className="mr-2 rounded border border-gray-300 px-4 py-2 text-gray-600"
              placeholder="Shift Trip Name"
            />
            <input
              type="time"
              name="shiftStartTime"
              value={shiftStartTime}
              onChange={handleShiftInputChange}
              className="mr-2 rounded border border-gray-300 px-4 py-2 text-gray-600"
            />
            <input
              type="time"
              name="shiftEndTime"
              value={shiftEndTime}
              onChange={handleShiftInputChange}
              className="mr-2 rounded border border-gray-300 px-4 py-2 text-gray-600"
            />
            <button
              onClick={addShift}
              className="rounded bg-blue-500 px-4 py-2 text-white"
            >
              Add Shift
            </button>
          </div>
        </div>

        <div className="relative z-10 inline-block text-left">
          <Button
            onClick={() => addRoute(formData)}
            className="inline-flex w-full justify-center rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75"
          >
            Add Route
          </Button>
        </div>
      </div>
    </>
  );
};
