import { paths } from '@webui/types';
import { Modal } from '@webui/ui';
import { useState } from 'react';

export function ErrorPage(
  data: paths['/assessments/{assessmentId}']['get']['responses']['200']['content']['application/json']
) {
  const [showErrorModal, setShowErrorModal] = useState<boolean>(false);

  return (
    <div className="h-full">
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <h2 className="text-center text-error font-bold">
          An error occurred while running the assessment.
        </h2>
        <button
          className="btn btn-error btn-sm text-sm h-8 min-h-8"
          onClick={() => setShowErrorModal(true)}
        >
          View Error
        </button>
      </div>
      <Modal
        open={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        className="w-full p-4"
      >
        <h2 className="text-2xl font-semibold text-red-600 mb-4">Error</h2>
        <p className="text-lg text-gray-700">
          <strong>Error Message:</strong>{' '}
          {data?.error?.Error || 'No error message available'}
        </p>
        <p className="text-lg text-gray-700 mt-2">
          <strong>Cause:</strong>{' '}
          {data?.error?.Cause || 'No cause information available'}
        </p>
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => setShowErrorModal(false)}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition duration-200"
          >
            Close
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default ErrorPage;
