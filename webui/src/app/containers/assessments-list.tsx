import { useQuery } from '@tanstack/react-query';
import { getAssessments } from '@webui/api-client';
import { StatusBadge } from '@webui/ui';
import { Server, Calendar, Search } from 'lucide-react';
import { useNavigate } from 'react-router';

function AssessmentsList() {
  const navigate = useNavigate();
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
      <div className="prose mb-2 w-full flex flex-row gap-4 justify-between items-center max-w-none">
        <h2 className="mt-0 mb-0">Assessments</h2>
        <button className="btn btn-primary btn-sm text-sm h-8 min-h-8">
          New Assessment
        </button>
      </div>
      <div className="flex flex-row gap-4">
        <label className="input w-full">
          <Search className="w-4 h-4" />
          <input
            type="search"
            className="grow"
            placeholder="Search an assessment"
          />
        </label>
      </div>
      <div className="flex gap-4 overflow-auto rounded-lg border border-neutral-content shadow-md p-4 flex-wrap ">
        {data?.assessments?.map((assessment) => (
          <div
            className={`
                border border-neutral-content rounded-lg p-4
                w-full
                sm:w-[calc(50%-0.5rem)]
                md:w-[calc(33.333%-0.667rem)]
                lg:w-[calc(25%-0.75rem)]
                hover:shadow-md hover:shadow-primary/20 hover:bg-primary/2
                transition-all duration-300
                cursor-pointer
              `}
            key={`${assessment.id}-${Math.random()}`}
            onClick={() => navigate(`/assessments/${assessment.id}`)}
          >
            <div className="flex flex-col gap-2">
              <div className="flex flex-row gap-2 justify-between">
                <div className="text-lg font-semibold text-primary">
                  {assessment.name}
                </div>
                <StatusBadge status={assessment.step} />
              </div>
              <div className="text-sm text-base-content/80 flex flex-row gap-2">
                <Server className="w-4 h-4" />
                Account: {extractAccountId(assessment.role_arn)}
              </div>
              <div className="text-sm text-base-content/80 flex flex-row gap-2">
                <Calendar className="w-4 h-4" />
                Created:{' '}
                {assessment.created_at
                  ? new Date(assessment.created_at).toLocaleDateString()
                  : 'N/A'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AssessmentsList;
