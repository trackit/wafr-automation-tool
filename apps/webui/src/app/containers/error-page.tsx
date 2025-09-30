import { paths } from '@shared/api-schema';

export function ErrorPage(
  data: paths['/assessments/{assessmentId}']['get']['responses']['200']['content']['application/json'],
) {
  return (
    <div className="flex flex-col items-center justify-center h-full space-y-4">
      <h2 className="text-center text-error text-2xl font-bold">
        An error occurred while running the assessment.
      </h2>
      <h3 className="text-center text-error">
        Please contact our support team for assistance.
      </h3>
    </div>
  );
}

export default ErrorPage;
