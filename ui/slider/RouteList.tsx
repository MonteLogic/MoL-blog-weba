import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import '#/styles/component-styles/styles.css';
import { Route } from '#/types/RouteTypes';
import SwiperSlideComponent from './SwiperSlideComponent';
import { generateSlides } from '#/utils/slideUtils';
import { RouteListProps } from '#/types/RouteTypes';

const RouteList: React.FC<RouteListProps> = ({
  initialRoutes,
  workTime,
  selectedEmployeeName,
  selectedEmployeeID,
  handleButtonClick,
}) => {
  return (
    <ul>
      {initialRoutes.map((route) => (
        <div key={route.id} className="mb-8">
          <div className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
            {route.routeNiceName}
          </div>
          <Swiper
            slidesPerView={2}
            centeredSlides={true}
            grabCursor={true}
            initialSlide={20}
            pagination={{
              clickable: true,
            }}
            modules={[Pagination]}
            className="mb-8"
             breakpoints={{
    // Mobile first - smallest screens
    320: {
      slidesPerView: 1.1,
    },
    // Larger phones
    480: {
      slidesPerView: 1.1,
    },
    // Tablets
    640: {
      slidesPerView: 2,
      spaceBetween: 20,
    },
    // Desktop
    768: {
      slidesPerView: 3,
      spaceBetween: 20,
    }
  }}
           
        
          >
            {generateSlides(workTime, route.id, selectedEmployeeID).map(
              (slideProps, index) => (
                <SwiperSlide key={index}>
                  <SwiperSlideComponent
                    {...slideProps}
                    employeeName={selectedEmployeeName}
                    onButtonClick={() =>
                      handleButtonClick(
                        slideProps.date,
                        route.id,
                        slideProps.workTimeData
                          ? [slideProps.workTimeData]
                          : undefined,
                      )
                    }
                  />
                </SwiperSlide>
              ),
            )}
          </Swiper>
        </div>
      ))}
    </ul>
  );
};

export default RouteList;
