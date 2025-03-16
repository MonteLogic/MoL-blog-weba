import React, { useState } from 'react';
import { TailSpin } from 'react-loader-spinner';

interface FormData {
  employeeName: string;
}

interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export const AddEmployeeForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    employeeName: '',
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [confirmationMessage, setConfirmationMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const addEmployee = async (newEmployee: FormData): Promise<void> => {
    setLoading(true);
    setConfirmationMessage('');
    setErrorMessage('');
    try {
      const response = await fetch('/api/add-employee', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newEmployee),
      });
      const responseData: ApiResponse = await response.json();
      if (response.ok && responseData.success) {
        setConfirmationMessage('Employee added successfully.');
        setFormData({ employeeName: '' });
      } else {
        throw new Error(responseData.error || `HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error adding employee', error);
      setErrorMessage(`Failed to add employee: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    await addEmployee(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="employeeName" className="block text-sm font-medium text-gray-700">
          Employee Name
        </label>
        <input
          type="text"
          id="employeeName"
          name="employeeName"
          value={formData.employeeName}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>
      <div className="w-full">
        <button
          type="submit"
          disabled={loading}
          className="flex h-10 w-full items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-400"
        >
          {loading ? (
            <TailSpin
              visible={true}
              height="20"
              width="20"
              color="white"
              ariaLabel="tail-spin-loading"
              radius="1"
            />
          ) : (
            'Add Employee'
          )}
        </button>
      </div>
      {confirmationMessage && (
        <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">{confirmationMessage}</div>
      )}
      {errorMessage && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{errorMessage}</div>
      )}
    </form>
  );
};

export default AddEmployeeForm;