import { useState } from 'react';
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { deleteAssessment, getAssessments } from '@webui/api-client';
import { StatusBadge } from '@webui/ui';
import {
  Server,
  Calendar,
  Search,
  EllipsisVertical,
  Trash2,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { useDebounceValue } from 'usehooks-ts';
import NewAssessmentDialog from './new-assessment-dialog';
import { ConfirmationModal } from '@webui/ui';

function AssessmentsList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useDebounceValue('', 500);
  const [idToDelete, setIdToDelete] = useState<string | null>(null);
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ['assessments', search],
      queryFn: ({ pageParam }) =>
        getAssessments({ limit: 24, search, next_token: pageParam }),
      getNextPageParam: (lastPage) => lastPage.next_token,
      initialPageParam: '',
    });

  const extractAccountId = (roleArn: string | undefined) => {
    if (!roleArn) return '';
    const match = roleArn.match(/arn:aws:iam::(\d+):/);
    return match ? match[1] : '';
  };

  const { mutate: deleteAssessmentMutation } = useMutation({
    mutationFn: (id: string) =>
      deleteAssessment({ assessmentId: parseInt(id) }),
    onMutate: () => {
      setIdToDelete(null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
    },
    onError: () => {
      setIdToDelete(null);
    },
  });

  const handleDeleteAssessment = (id: string) => {
    deleteAssessmentMutation(id);
  };

  return (
    <div className="container py-8 px-4 overflow-auto flex-1 flex flex-col gap-4">
      <div className="prose mb-2 w-full flex flex-row gap-4 justify-between items-center max-w-none">
        <h2 className="mt-0 mb-0">Assessments</h2>
        <NewAssessmentDialog />
      </div>
      <div className="flex flex-row gap-4">
        <label className="input w-full">
          <Search className="w-4 h-4" />
          <input
            type="search"
            className="grow"
            placeholder="Search an assessment"
            defaultValue={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </div>
      <div className="flex gap-4 overflow-auto rounded-lg border border-neutral-content shadow-md p-4 flex-wrap ">
        {isLoading ? (
          <div className="flex flex-row gap-2 justify-center items-center w-full h-full">
            <div className="loading loading-ring text-primary w-8 h-8"></div>
          </div>
        ) : null}
        {data?.pages.length === 0 ||
        data?.pages?.[0]?.assessments?.length === 0 ? (
          <div className="text-center text-base-content/80">
            No assessments found
          </div>
        ) : null}
        {data?.pages.map((page) =>
          page.assessments?.map((assessment) => (
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
                <div className="flex flex-row justify-between items-start mb-2 gap-1">
                  <div className="text-lg font-semibold text-primary">
                    {assessment.name}
                  </div>
                  <div className="flex flex-row items-center gap-1">
                    <StatusBadge
                      status={assessment.step}
                      className="badge-sm flex-shrink-0"
                    />
                    <div
                      className="dropdown dropdown-end"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                    >
                      <div
                        tabIndex={0}
                        role="button"
                        className="btn btn-ghost btn-xs p-1"
                      >
                        <EllipsisVertical className="w-4 h-4" />
                      </div>
                      <ul
                        tabIndex={0}
                        className="dropdown-content menu bg-base-100 rounded-box z-50 w-52 p-2 shadow-sm"
                      >
                        <li>
                          <button
                            className="flex flex-row gap-2 text-error w-full text-left"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setIdToDelete(assessment.id ?? null);
                            }}
                          >
                            <Trash2 className="w-4 h-4" /> Delete
                          </button>
                        </li>
                      </ul>
                    </div>
                  </div>
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
          ))
        )}
      </div>
      {!isLoading && hasNextPage && (
        <div className="flex flex-row gap-4 justify-center">
          <button
            className="btn btn-accent btn-soft text-sm"
            onClick={() => fetchNextPage()}
            disabled={!hasNextPage || isFetchingNextPage}
          >
            {isFetchingNextPage
              ? 'Loading more...'
              : hasNextPage
              ? 'Load More'
              : 'Nothing more to load'}
          </button>
        </div>
      )}
      {idToDelete && (
        <ConfirmationModal
          title="Delete Assessment"
          message="Are you sure you want to delete this assessment?"
          onConfirm={() => handleDeleteAssessment(idToDelete)}
          open={true}
          onClose={() => setIdToDelete(null)}
          onCancel={() => setIdToDelete(null)}
        />
      )}
    </div>
  );
}

export default AssessmentsList;
