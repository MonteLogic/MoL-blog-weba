import React from 'react';
import { WorkTimeShiftType } from '#/types/WorkTimeShiftTypes';
import { SwiperSlideComponentProps } from '#/types/ScheduleTypes';

const SwiperSlideComponent: React.FC<SwiperSlideComponentProps> = ({
  date,
  isScheduled,
  isWorked,
  employeeName,
  onButtonClick,
}) => {
  return (
    <div
      className={`swiper-slide flex flex-col items-center ${
        isWorked ? 'bg-blue-500' : isScheduled ? 'bg-yellow-500' : 'bg-white'
      }`}
    >
      <div className="mb-8 text-center text-black">
        <p>{isScheduled ? employeeName : ''}</p>
        <p>{date.toDateString()}</p>
        <p>{isWorked ? 'Worked' : isScheduled ? 'Scheduled' : 'No work'}</p>
      </div>
      <button
        onClick={onButtonClick}
        className="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
      >
        View
      </button>
    </div>
  );
};

export default SwiperSlideComponent;
