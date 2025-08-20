import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  deleteAssessment,
  getAssessments,
  rescanAssessment,
} from '@webui/api-client';
import { ConfirmationModal, StatusBadge } from '@webui/ui';
import {
  Calendar,
  Computer,
  Earth,
  EllipsisVertical,
  RefreshCw,
  Search,
  Server,
  Trash2,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useDebounceValue } from 'usehooks-ts';
import ExportToAWSDialog from './export-to-aws-dialog';
import NewAssessmentDialog from './new-assessment-dialog';
import CreateAWSMilestoneDialog from './create-aws-milestone-dialog';

function AssessmentsList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useDebounceValue('', 500);
  const [idToDelete, setIdToDelete] = useState<string | null>(null);
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);
  const [idToRescan, setIdToRescan] = useState<string | null>(null);
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['assessments', search],
    queryFn: ({ pageParam }) =>
      getAssessments({ limit: 24, search, nextToken: pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextToken,
    initialPageParam: '',
  });

  const extractAccountId = (roleArn: string | undefined) => {
    if (!roleArn) return '';
    const match = roleArn.match(/arn:aws:iam::(\d+):/);
    return match ? match[1] : '';
  };

  const { mutate: deleteAssessmentMutation } = useMutation({
    mutationFn: (id: string) => deleteAssessment({ assessmentId: id }),
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

  const rescanAssessmentMutation = useMutation({
    mutationFn: (id: string) => rescanAssessment({ assessmentId: id }),
    onMutate: async () => {
      queryClient.invalidateQueries({ queryKey: ['assessment', idToRescan] });
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      setIdToRescan(null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessment', idToRescan] });
      refetch();
    },
  });

  const handleDeleteAssessment = (id: string) => {
    deleteAssessmentMutation(id);
  };

  return (
    <div className="container py-8 px-4 overflow-auto flex-1 flex flex-col gap-4">
      <div className="prose mb-2 w-full flex flex-row gap-4 justify-between items-center max-w-none">
        <h2 className="mt-0 mb-0 font-medium text-2xl">Assessments</h2>
        <div className="flex flex-row gap-4">
          <label className="input input-sm rounded-lg w-full max-w-xs">
            <Search className="w-4 h-4" />
            <input
              type="search"
              className="grow"
              placeholder="Search "
              defaultValue={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <NewAssessmentDialog />
        </div>
      </div>
      <div className="flex flex-row gap-4"></div>
      <div
        className="grid gap-4 overflow-auto rounded-lg border border-neutral-content bg-base-100 shadow-md p-4 w-full"
        style={{
          gridTemplateColumns: `repeat(auto-fit, minmax(300px, ${
            data?.pages?.[0]?.assessments?.length === 1 && isLargeScreen
              ? '50%'
              : '1fr'
          }))`,
        }}
      >
        {isLoading ? (
          <div className="flex flex-row gap-2 justify-center items-center w-full h-full col-span-full">
            <div
              className="loading loading-ring text-primary w-8 h-8"
              role="status"
            ></div>
          </div>
        ) : null}
        {data?.pages.length === 0 ||
        data?.pages?.[0]?.assessments?.length === 0 ? (
          <div className="text-center text-base-content/80 col-span-full">
            No assessments found
          </div>
        ) : null}
        {data?.pages.map((page) =>
          page.assessments?.map((assessment) => (
            <div
              className={`
                border border-neutral-content rounded-lg p-4
                hover:shadow-md hover:shadow-primary/20 hover:bg-primary/4
                transition-all duration-300
                cursor-pointer
                w-full h-full
              `}
              key={`${assessment.id}-${Math.random()}`}
              onClick={() => navigate(`/assessments/${assessment.id}`)}
            >
              <div className="flex flex-col gap-2 justify-between h-full w-full">
                <div className="flex flex-row justify-between items-start mb-2 gap-1">
                  <div className="lg:text-lg md:text-base text-sm font-semibold text-primary">
                    {assessment.name}
                  </div>
                  <div className="flex flex-row items-center gap-1 flex-1 flex-grow justify-end">
                    <StatusBadge
                      status={assessment.step}
                      className="badge-sm flex-shrink-0 "
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
                            className="flex flex-row gap-2 text-primary w-full text-left"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setIdToRescan(assessment.id ?? null);
                            }}
                          >
                            <RefreshCw className="w-4 h-4" /> Rescan
                          </button>
                        </li>
                        <li className="m-1"></li>
                        <li>
                          <ExportToAWSDialog
                            assessmentId={assessment.id ?? ''}
                          />
                        </li>
                        <li>
                          <CreateAWSMilestoneDialog
                            assessmentId={assessment.id ?? ''}
                          />
                        </li>
                        <li className="m-1"></li>
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
                <div className="flex flex-col gap-1">
                  <div className="text-sm text-base-content flex flex-row gap-2 items-center">
                    <Server className="w-4 h-4" />
                    Account: {extractAccountId(assessment.roleArn)}
                  </div>
                  <div className="text-sm text-base-content flex flex-row gap-2 items-center">
                    <Calendar className="w-4 h-4" />
                    Created:{' '}
                    {assessment.createdAt
                      ? new Date(assessment.createdAt).toLocaleDateString()
                      : 'N/A'}
                  </div>
                  <div className="text-sm text-base-content flex flex-row gap-2 items-center">
                    <Earth className="w-4 h-4" />
                    {assessment.regions?.join(', ') || 'Global'}
                  </div>
                  <div className="text-sm text-base-content flex flex-row gap-2 items-center">
                    <Computer className="w-4 h-4" />
                    Workflow:
                    {Array.isArray(assessment.workflows)
                      ? assessment.workflows.length
                        ? assessment.workflows.join(', ')
                        : ' -'
                      : assessment.workflows || ' -'}
                  </div>
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
      {idToRescan && (
        <ConfirmationModal
          title="Rescan Assessment"
          message="Are you sure you want to rescan this assessment? This might take a while."
          onConfirm={() => rescanAssessmentMutation.mutate(idToRescan)}
          open={true}
          onClose={() => setIdToRescan(null)}
          onCancel={() => setIdToRescan(null)}
        />
      )}
    </div>
  );
}

export default AssessmentsList;
