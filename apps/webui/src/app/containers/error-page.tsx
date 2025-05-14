import { paths } from '@webui/types';

export function ErrorPage(
  data: paths['/assessments/{assessmentId}']['get']['responses']['200']['content']['application/json']
) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 space-y-4">
      <h2 className="text-center text-error font-bold">
        An error occurred while running the assessment.
      </h2>
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body flex items-center ">
          <p className="text-error text-lg font-bold">
            {data?.error?.Error || 'No error message available'}
          </p>
          <pre className="whitespace-pre-wrap mt-2 bg-gray-800 text-white p-2 rounded-md shadow-md">
            <code>
              {data?.error?.Cause || 'No cause information available'}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
}

export default ErrorPage;
