import { useQuery } from '@tanstack/react-query';
import { getAssessments } from '@webui/api-client';

function AssessmentsList() {
  const { data, isLoading } = useQuery({
    queryKey: ['assessments'],
    queryFn: getAssessments,
  });

  const extractAccountId = (roleArn: string | undefined) => {
    if (!roleArn) return '';
    const match = roleArn.match(/arn:aws:iam::(\d+):/);
    return match ? match[1] : '';
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="container py-8 px-4 overflow-auto flex-1 flex flex-col gap-4">
      <div className="prose mb-2 w-full">
        <h2 className="mt-0">Assessments</h2>
      </div>
      <div className="flex gap-4 overflow-auto rounded-lg border border-neutral-content shadow-md p-4 flex-wrap ">
        {data?.assessments?.map((assessment) => (
          <div
            className="border border-neutral-content rounded-lg p-4  min-w-[350px] flex-1 sm:max-w-1/2 md:max-w-1/3 lg:max-w-1/4"
            key={assessment.id}
          >
            <div className="flex flex-col gap-2">
              <div className="text-lg font-bold text-primary">
                {assessment.name}
              </div>
              <div className="text-sm text-base-content/80">
                Account: {extractAccountId(assessment.role_arn)}
              </div>
              <div className="text-sm text-base-content/80">
                Status: {assessment.step}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AssessmentsList;
