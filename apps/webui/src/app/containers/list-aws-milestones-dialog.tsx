import { useInfiniteQuery } from '@tanstack/react-query';
import { Clock, ExternalLink, List } from 'lucide-react';
import { useMemo, useState } from 'react';

import { getMilestones } from '@webui/api-client';
import { Modal } from '@webui/ui';

type ListAWSMilestonesDialogProps = {
  assessmentId: string;
  disabled?: boolean;
};

export default function ListAWSMilestonesDialog({
  assessmentId,
  disabled = false,
}: ListAWSMilestonesDialogProps) {
  const [open, setOpen] = useState(false);

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['milestones', assessmentId],
    queryFn: ({ pageParam }) =>
      getMilestones({ assessmentId }, { limit: 10, nextToken: pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextToken,
    initialPageParam: '',
    enabled: open, // Only fetch when dialog is open
  });

  const milestones = useMemo(() => {
    return data?.pages.flatMap((page) => page.milestones) || [];
  }, [data]);

  const sortedMilestones = useMemo(() => {
    if (!milestones.length) return [];

    return milestones.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [milestones]);

  const handleMilestoneClick = (milestoneId: number) => {
    window.open(
      `/assessments/${assessmentId}/milestones/${milestoneId}`,
      '_blank',
    );
    setOpen(false); // Close the dialog after navigation
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'N/A';
    }
  };

  const button = (
    <button
      className={`flex flex-row gap-2 w-full text-left ${
        disabled ? 'text-gray-400 cursor-not-allowed opacity-50' : ''
      }`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) {
          setOpen(true);
        }
      }}
      disabled={disabled}
    >
      <List className="w-4 h-4" /> List AWS Milestones
    </button>
  );

  return (
    <>
      {disabled ? (
        <div className="tooltip" data-tip="Please export to AWS first">
          {button}
        </div>
      ) : (
        button
      )}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        className="w-full max-w-2xl max-h-[90vh] flex flex-col"
      >
        <div className="flex flex-col">
          <div className="px-6 py-4 border-b border-neutral-content">
            <h2 className="text-2xl font-bold">AWS Milestones</h2>
            <p className="text-sm text-base-content/70 mt-1">
              Click on a milestone to view its snapshot
            </p>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[70vh] px-6 py-4">
            {isLoading && (
              <div className="flex flex-row gap-2 justify-center items-center w-full py-8">
                <div
                  className="loading loading-ring text-primary w-8 h-8"
                  role="status"
                ></div>
                <span>Loading milestones...</span>
              </div>
            )}

            {error && (
              <div className="text-center text-error py-8">
                Failed to load milestones. Please try again.
              </div>
            )}

            {milestones &&
              !isLoading &&
              (sortedMilestones && sortedMilestones.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {sortedMilestones.map((milestone, index) => (
                    <button
                      key={milestone.id}
                      className="
                        border border-neutral-content rounded-lg p-4
                        hover:shadow-md hover:shadow-primary/20 hover:bg-primary/4 transition-all duration-300 cursor-pointer
                        text-left w-full group
                      "
                      onClick={() => handleMilestoneClick(milestone.id)}
                    >
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-row gap-2 items-center justify-between">
                          <div className="flex flex-row gap-2 items-center">
                            <div className="font-semibold text-primary">
                              {milestone.name}
                            </div>
                            {index === 0 && (
                              <span className="badge badge-primary badge-sm">
                                Latest
                              </span>
                            )}
                          </div>
                          <ExternalLink className="w-4 h-4 text-base-content/50 group-hover:text-primary transition-colors" />
                        </div>
                        <div className="flex flex-row gap-2 items-center text-sm text-base-content/70">
                          <Clock className="w-4 h-4" />
                          Created: {formatDate(milestone.createdAt)}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center text-base-content/70 py-8">
                  No milestones found for this assessment.
                </div>
              ))}

            {!isLoading && hasNextPage && (
              <div className="flex flex-row gap-4 justify-center mt-4">
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
          </div>
        </div>
      </Modal>
    </>
  );
}
