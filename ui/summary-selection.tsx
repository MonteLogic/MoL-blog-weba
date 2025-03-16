'use client';
import { useState, MouseEventHandler, useEffect } from 'react';
import {
  updateSummary,
  searchForSummary,
  createRecordForSummary,
  updateSummaryWithAttachment,
} from '#/network-fns/SummaryNetworkFns';
import TextareaAutosize from 'react-textarea-autosize';
import { UploadButton } from '#/app/utils/uploadthing';
import { ImageString } from './image-slider';
import StandardModal from './standard-modal';
import { FormattedRouteType } from '#/types/RouteTypes';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import ConfirmingButton from './confirming-button';

interface WorkTimeObjectSummary {
  earlyMorning?: { text?: string; imgURLs?: string[] }[];
  midMorning?: { text?: string; imgURLs?: string[] }[];
  midDay?: { text?: string; imgURLs?: string[] }[];
  afternoon?: { text?: string; imgURLs?: string[] }[];
}

export const SummarySelection = ({
  initSelectedDate,
  initSelectedRoute,
  initRoutes,
  shouldPerformInitialSearch,
}: {
  initSelectedDate: string | undefined;
  initSelectedRoute: string | undefined;
  initRoutes: FormattedRouteType;
  shouldPerformInitialSearch: boolean;
}) => {
  const [dateSelection, setDateSelection] = useState(
    initSelectedDate || new Date().toISOString().split('T')[0],
  );
  const [routeIDFromURL, setRouteIDFromURL] = useState<string | null>(
    initSelectedRoute || null,
  );
  const [routeIDs, setRouteIDs] = useState(initRoutes);
  const [summaryObject, setSummaryObject] =
    useState<WorkTimeObjectSummary | null>(null);
  const [entryID, setEntryID] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const RouteSelect = () => {
    const defaultValue = searchParams.get('route')?.toString();
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedRoute = e.target.value;
      setSearchURL(dateSelection, selectedRoute);
      setRouteIDFromURL(selectedRoute);
      searchForSummary(
        dateSelection ?? '',
        routeIDFromURL ?? '',
        setEntryID,
        setSummaryObject,
      );
    };
    return (
      <select
        className="text-gray-900"
        id="routes"
        name="routes"
        value={routeIDFromURL ?? ''}
        defaultValue={defaultValue}
        onChange={handleChange}
      >
        {routeIDs.length > 0 ? (
          routeIDs.map((route: any) => (
            <option key={route[0]} value={route[0]}>
              {`${route[0]}-${route[1]}`}
            </option>
          ))
        ) : (
          <option value="No routes found">No routes found</option>
        )}
      </select>
    );
  };

  const setSearchURL = (date: string, route: string) => {
    const params = new URLSearchParams(searchParams);
    if (date) {
      params.set('date', date);
    } else {
      params.delete('date');
    }
    if (route) {
      params.set('route', route);
    } else {
      params.delete('route');
    }
    replace(`${pathname}?${params.toString()}`);
  };

  const routeComponents = [
    { shiftNiceName: 'Early Morning', shiftName: 'earlyMorning' },
    { shiftNiceName: 'Mid Morning', shiftName: 'midMorning' },
    { shiftNiceName: 'Mid Day', shiftName: 'midDay' },
    { shiftNiceName: 'Afternoon', shiftName: 'afternoon' },
  ];

  const summaryObjectFunc = (summaryObject: any) => {
    if (!summaryObject) {
      return null;
    }
    return (
      <>
        {routeComponents.map((routeComponent, index) => {
          const key = `${routeComponent.shiftName}-${index}`;
          const shifts = routeIDs[index];

          return (
            <div key={key}>
              <p>Shift: {routeComponent.shiftNiceName}</p>
              <TextareaAutosize
                className="text-gray-900"
                id="newSummaryInputID"
                name="newSummaryInputName"
                minRows={3}
                value={
                  (summaryObject &&
                    (summaryObject as WorkTimeObjectSummary)[
                      routeComponent.shiftName as keyof WorkTimeObjectSummary
                    ]?.[0]?.text) ||
                  ''
                }
                onChange={(e) => {
                  setSummaryObject(
                    (prevSummaryObject: WorkTimeObjectSummary | null) => ({
                      ...prevSummaryObject,
                      [routeComponent.shiftName as keyof WorkTimeObjectSummary]:
                        [
                          {
                            text: e.target.value || '',
                            imgURLs:
                              (prevSummaryObject &&
                                prevSummaryObject[
                                  routeComponent.shiftName as keyof WorkTimeObjectSummary
                                ]?.[0]?.imgURLs) ||
                              [],
                          },
                        ],
                    }),
                  );
                }}
              />

              {(summaryObject as WorkTimeObjectSummary)[
                routeComponent.shiftName as keyof WorkTimeObjectSummary
              ]?.[0] ? (
                <ImageString
                  imgStringArray={
                    (summaryObject as WorkTimeObjectSummary)[
                      routeComponent.shiftName as keyof WorkTimeObjectSummary
                    ]?.[0]?.imgURLs?.map((image) => image) ?? []
                  }
                />
              ) : (
                <div>
                  <p>No images</p>
                </div>
              )}

              <UploadButton
                endpoint="imageUploader"
                content={{
                  button({ ready }) {
                    if (ready)
                      return (
                        <div>
                          Upload Image for {routeComponent.shiftNiceName} Shift
                        </div>
                      );

                    return 'Getting ready...';
                  },
                  allowedContent({ ready, fileTypes, isUploading }) {
                    if (!ready) return 'Checking what you allow';
                    if (isUploading) return 'Seems like stuff is uploading';
                    return `Stuff you can upload: ${fileTypes.join(', ')}`;
                  },
                }}
                onClientUploadComplete={(res) => {
                  console.log('Files: ', res);
                  console.log(346, res[0].url);

                  if (res[0].url) {
                    setSummaryObject(
                      (prevSummaryObject: WorkTimeObjectSummary | null) => {
                        const updatedObject = { ...prevSummaryObject };
                        const shiftName =
                          routeComponent.shiftName as keyof WorkTimeObjectSummary;

                        if (updatedObject.hasOwnProperty(shiftName)) {
                          const existingArray = updatedObject[shiftName] as {
                            text: string;
                            imgURLs?: string[];
                          }[];
                          updatedObject[shiftName] = existingArray.map(
                            (item) => ({
                              ...item,
                              imgURLs: [...(item.imgURLs || []), res[0].url],
                            }),
                          );
                        } else {
                          updatedObject[shiftName] = [
                            { imgURLs: [res[0].url] },
                          ];
                        }
                        updateSummaryWithAttachment(entryID, updatedObject);

                        return updatedObject;
                      },
                    );
                  }

                  alert('Upload Completed');
                }}
                onUploadError={(error: Error) => {
                  alert(`ERROR! ${error.message}`);
                }}
              />
            </div>
          );
        })}
        <ConfirmingButton
          onClick={updateSummaryObject}
          type="submit"
          disabled={saveEditedClicked}
        >
          {saveEditedClicked ? 'Saving...' : 'Save Edited Stuff'}
        </ConfirmingButton>
      </>
    );
  };

  const [saveEditedClicked, setSaveEditedClicked] = useState(false);

  const updateSummaryObject: MouseEventHandler<HTMLButtonElement> = async (
    event,
  ) => {
    setSaveEditedClicked(true);
    setTimeout(() => {
      setSaveEditedClicked(false);
    }, 1000);

    if (summaryObject) {
      if (entryID) {
        updateSummary(
          entryID,
          dateSelection ?? '',
          routeIDFromURL ?? '',
          setSummaryObject,
          summaryObject,
        );
      } else {
        createRecordForSummary(
          dateSelection ?? '',
          routeIDFromURL ?? '',
          setSummaryObject,
          summaryObject,
        );
      }
    }
  };

  const [clicked, setClicked] = useState(false);
  const viewResults = async (event: React.FormEvent<HTMLFormElement>) => {
    setSearchURL(dateSelection, routeIDFromURL ?? '');
    event.preventDefault();
    searchForSummary(
      dateSelection ?? '',
      routeIDFromURL ?? '',
      setEntryID,
      setSummaryObject,
    );
    setClicked(true);
    setTimeout(() => {
      setClicked(false);
    }, 1000);
  };

  useEffect(() => {
    if (shouldPerformInitialSearch) {
      searchForSummary(
        dateSelection ?? '',
        routeIDFromURL ?? '',
        setEntryID,
        setSummaryObject,
      );
    }
  }, [shouldPerformInitialSearch, dateSelection, routeIDFromURL]);

  useEffect(() => {
    if (!shouldPerformInitialSearch && initRoutes.length > 0) {
      const defaultRoute = initRoutes[0][0]; // Get the first route ID from initRoutes
      setRouteIDFromURL(defaultRoute);
      searchForSummary(
        dateSelection ?? '',
        routeIDFromURL ?? '',
        setEntryID,
        setSummaryObject,
      );
    }
  }, [shouldPerformInitialSearch, dateSelection, initRoutes]);

  const [modalIsOpen, setModalIsOpen] = useState(false);

  const closeModal = () => {
    setModalIsOpen(false);
  };

  return (
    <>
      <div>
        {modalIsOpen && (
          <StandardModal
            setIsOpen={setModalIsOpen}
            isOpen={modalIsOpen}
            closeModal={closeModal}
          />
        )}
      </div>
      <div>
        <div className="space-y-1">
          <label htmlFor="dateID" className="block">
            Date to search:
          </label>
          <input
            className="text-gray-900"
            type="date"
            id="dateID"
            name="date"
            value={dateSelection}
            onChange={(e) => {
              setSearchURL(e.target.value, routeIDFromURL ?? '');
              setDateSelection(e.target.value);
            }}
            defaultValue={searchParams.get('date')?.toString()}
          />
          <label htmlFor="routes" className="block">
            Choose a route:
          </label>
          {RouteSelect()}
          <ConfirmingButton
            onClick={
              viewResults as unknown as MouseEventHandler<HTMLButtonElement>
            }
            disabled={clicked}
          >
            {clicked ? 'Searching...' : 'View Summary of Day'}
          </ConfirmingButton>
        </div>
        {summaryObjectFunc(summaryObject)}
      </div>
    </>
  );
};
