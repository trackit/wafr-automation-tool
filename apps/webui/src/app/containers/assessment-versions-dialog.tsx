import { useInfiniteQuery } from '@tanstack/react-query';
import { Clock, ExternalLink, History } from 'lucide-react';
import { useMemo, useState } from 'react';

import { type components } from '@shared/api-schema';
import { getAssessmentVersions } from '@webui/api-client';
import { Modal } from '@webui/ui';

type VersionStatus = 'COMPLETED' | 'ONGOING' | 'ERRORED';

function usernameFromEmail(email?: string) {
  if (!email) return 'Unknown';
  return email.replace(/@.*$/, '');
}

function getVersionStatus(
  version: components['schemas']['AssessmentVersionSummary'],
): VersionStatus {
  if (version.error) return 'ERRORED';
  if (version.finishedAt) return 'COMPLETED';
  return 'ONGOING';
}

function VersionStatusBadge({ status }: { status: VersionStatus }) {
  switch (status) {
    case 'COMPLETED':
      return (
        <div className="badge badge-success badge-sm font-bold">Completed</div>
      );
    case 'ONGOING':
      return (
        <div className="badge badge-primary badge-sm font-bold">Ongoing</div>
      );
    case 'ERRORED':
      return (
        <div className="badge badge-error badge-sm font-bold">Errored</div>
      );
  }
}

type AssessmentVersionsDialogProps = {
  assessmentId: string;
  disabled?: boolean;
};

export default function AssessmentVersionsDialog({
  assessmentId,
  disabled = false,
}: AssessmentVersionsDialogProps) {
  const [open, setOpen] = useState(false);

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['assessments', assessmentId, 'versions'],
    queryFn: ({ pageParam }) =>
      getAssessmentVersions(
        { assessmentId },
        { limit: 10, nextToken: pageParam },
      ),
    getNextPageParam: (lastPage) => lastPage.nextToken,
    initialPageParam: '',
    enabled: open,
  });

  const versions = useMemo(() => {
    return data?.pages.flatMap((page) => page.versions) || [];
  }, [data]);

  const handleVersionClick = (versionNumber: number) => {
    window.open(
      `/assessments/${assessmentId}/versions/${versionNumber}`,
      '_blank',
    );
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
      <History className="w-4 h-4" /> View Versions
    </button>
  );

  return (
    <>
      {disabled ? (
        <div className="tooltip" data-tip="No versions available">
          {button}
        </div>
      ) : (
        button
      )}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        className="w-full max-w-3xl max-h-[90vh] flex flex-col"
      >
        <div className="flex flex-col">
          <div className="px-6 py-4 border-b border-neutral-content">
            <h2 className="text-2xl font-bold">Assessment Versions</h2>
            <p className="text-sm text-base-content/70 mt-1">
              View the history of assessment scans
            </p>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[70vh] px-6 py-4">
            {isLoading && (
              <div className="flex flex-row gap-2 justify-center items-center w-full py-8">
                <div
                  className="loading loading-ring text-primary w-8 h-8"
                  role="status"
                ></div>
                <span>Loading versions...</span>
              </div>
            )}

            {error && (
              <div className="text-center text-error py-8">
                Failed to load versions. Please try again.
              </div>
            )}

            {!isLoading && !error && versions.length === 0 && (
              <div className="text-center text-base-content/70 py-8">
                No versions found for this assessment.
              </div>
            )}

            {!isLoading && versions.length > 0 && (
              <div className="overflow-x-auto rounded-box border border-base-content/5 bg-base-100">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Version</th>
                      <th>Status</th>
                      <th>Created By</th>
                      <th>Created At</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {versions.map((assessmentVersion, index) => {
                      const status = getVersionStatus(assessmentVersion);
                      const username = usernameFromEmail(
                        assessmentVersion.createdBy,
                      );
                      return (
                        <tr key={assessmentVersion.version}>
                          <td>
                            <div className="flex flex-row gap-2 items-center">
                              <span className="font-semibold">
                                Version {assessmentVersion.version}
                              </span>
                              {index === 0 && (
                                <span className="badge badge-primary badge-sm">
                                  Latest
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            <VersionStatusBadge status={status} />
                          </td>
                          <td>
                            <div className="flex flex-row gap-1 items-center text-sm">
                              {username.length > 0
                                ? username.charAt(0).toUpperCase() +
                                  username.slice(1)
                                : '?'}
                            </div>
                          </td>
                          <td>
                            <div className="flex flex-row gap-1 items-center text-sm">
                              <Clock className="w-3 h-3" />
                              {formatDate(assessmentVersion.createdAt)}
                            </div>
                          </td>
                          <td>
                            {status === 'COMPLETED' && (
                              <button
                                className="btn btn-xs btn-ghost group"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleVersionClick(assessmentVersion.version);
                                }}
                              >
                                <ExternalLink className="w-4 h-4 text-base-content/50 group-hover:text-primary transition-colors" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

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
