'use client';
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { AddEmployeeForm } from './add-employee-form';

interface StandardModalProps {
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isOpen: boolean;
  closeModal: () => void;
}

const StandardModal: React.FC<StandardModalProps> = ({
  setIsOpen,
  isOpen,
  closeModal,
}) => {
  const modalRoot = document.getElementById('modal-root') || document.body;

  useEffect(() => {
    const originalOverflow = window.getComputedStyle(document.body).overflow;

    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = originalOverflow;
    }

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  const modalClasses = isOpen
    ? 'fixed inset-0 flex items-center justify-center z-50'
    : 'hidden';

  return ReactDOM.createPortal(
    <div className={modalClasses}>
      <div
        className="fixed inset-0 bg-black opacity-50"
        onClick={() => {
          closeModal();
          setIsOpen(false);
        }}
      ></div>
      <div className="z-50 rounded-md bg-white p-6 shadow-md">
        <div className="flex justify-between">
          <div>
            <button
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
              onClick={() => {
                closeModal();
                setIsOpen(false);
              }}
            >
              Close
            </button>
          </div>
        </div>
        <div className="mt-4">
          {/* Your modal content goes here */}
          <AddEmployeeForm />
        </div>
      </div>
    </div>,
    modalRoot,
  );
};

export default StandardModal;
