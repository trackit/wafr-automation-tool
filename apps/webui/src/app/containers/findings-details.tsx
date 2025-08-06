import { components } from '@shared/api-schema';
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useDebounce } from '@uidotdev/usehooks';
import {
  addComment,
  deleteComment,
  getFindings,
  updateComment,
  updateFinding,
} from '@webui/api-client';
import { CommentsPane, Modal } from '@webui/ui';
import {
  Earth,
  FileCheck,
  Info,
  NotebookPen,
  Search,
  Server,
} from 'lucide-react';
import { enqueueSnackbar } from 'notistack';
import { RefObject, useEffect, useMemo, useRef, useState } from 'react';

interface FindingsDetailsProps {
  assessmentId: string;
  bestPractice: components['schemas']['BestPractice'];
  pillarId: string;
  questionId: string;
}

export type Severity =
  | 'Unknown'
  | 'Informational'
  | 'Low'
  | 'Medium'
  | 'High'
  | 'Critical'
  | 'Fatal'
  | 'Other';

const severityBadgeClass: Record<Severity, string> = {
  Unknown: 'badge-secondary',
  Informational: 'badge-info',
  Low: 'badge-info',
  Medium: 'badge-warning',
  High: 'badge-error',
  Critical: 'badge-error',
  Fatal: 'badge-error',
  Other: 'badge-info',
};

const SeverityBadge = ({
  severity,
  className,
}: {
  severity: Severity;
  className?: string;
}) => {
  return (
    <div
      className={`font-bold badge badge-soft ${severityBadgeClass[severity]} ${className}`}
    >
      {severity}
    </div>
  );
};

const AIBadge = ({ className }: { className?: string }) => {
  return (
    <div className={`font-bold badge badge-soft badge-info ${className}`}>
      AI Associated
    </div>
  );
};

const highlightText = (
  text: string | null | undefined,
  searchQuery: string
) => {
  if (!text || !searchQuery) return text || undefined;
  const regex = new RegExp(`(${searchQuery})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) => {
    if (part.toLowerCase() === searchQuery.toLowerCase()) {
      return (
        <mark key={i} className="bg-yellow-200">
          {part}
        </mark>
      );
    }
    return part;
  });
};

function FindingItem({
  finding,
  searchQuery,
  onHide,
  showCommentsFor,
  onComment,
  commentBtnRefs,
}: {
  finding: components['schemas']['Finding'];
  searchQuery: string;
  onHide: (findingId: string, hidden: boolean) => void;
  showCommentsFor: components['schemas']['Finding'] | null;
  onComment: (
    finding: components['schemas']['Finding'] | null,
    e: React.MouseEvent<HTMLButtonElement>
  ) => void;
  commentBtnRefs: RefObject<{ [id: string]: HTMLButtonElement | null }>;
}) {
  const remediations = useMemo(() => {
    const isUrl = (str: string) => {
      try {
        new URL(str);
        return true;
      } catch {
        return false;
      }
    };
    let refs = finding.remediation?.references ?? [];
    if (!refs.length) return null;
    refs = refs.filter((ref) => ref !== 'No command available.');
    const urls = refs.filter(isUrl);
    const nonUrls = refs.filter((ref) => !isUrl(ref));
    return { urls, nonUrls };
  }, [finding.remediation?.references]);

  useEffect(() => {
    console.log(finding.comments);
  }, [finding.comments]);

  return (
    <div className="w-full px-8 py-8 border-b border-base-content/30">
      <div className="flex flex-row gap-2 items-start justify-between">
        <div className="text-md font-bold mb-2 max-w-[90%]">
          {finding.severity && (
            <SeverityBadge
              className="badge-sm mr-2"
              severity={finding.severity as 'High' | 'Medium' | 'Low'}
            />
          )}
          {highlightText(finding.statusDetail, searchQuery)}
          {finding.isAIAssociated && <AIBadge className="badge-sm ml-2" />}
        </div>
        <div className="flex flex-row gap-2 justify-between">
          {!finding.hidden && (
            <button
              className="tooltip tooltip-left btn btn-xs btn-primary btn-outline mt-[-0.5em]"
              data-tip="Force resolve"
              onClick={() => {
                onHide(finding.id || '', !finding.hidden);
                finding.hidden = !finding.hidden;
              }}
            >
              <FileCheck className="w-4 h-4 " />
            </button>
          )}
          <div className="indicator">
            <button
              ref={(el) => {
                if (el && finding.id) {
                  commentBtnRefs.current[finding.id] = el;
                }
              }}
              className="comment-btn tooltip tooltip-left btn btn-xs btn-primary btn-outline mt-[-0.5em]"
              data-tip="Comments"
              onClick={(e) => {
                if (showCommentsFor?.id === finding.id) {
                  onComment(null, e);
                } else {
                  onComment(finding, e);
                }
              }}
            >
              <NotebookPen className="w-4 h-4 " />
            </button>
            {finding.comments && Object.keys(finding.comments).length > 0 && (
              <span className="indicator-item badge badge-xs badge-primary w-4 h-4 -mt-1">
                {Object.keys(finding.comments).length}
              </span>
            )}
          </div>
        </div>
      </div>
      {finding.riskDetails && (
        <p className="text-sm text-base-content">
          {highlightText(finding.riskDetails, searchQuery)}
        </p>
      )}
      {finding.resources?.map((resource) => (
        <div
          className="flex flex-row flex-wrap gap-2 items-start mt-2"
          key={resource.uid}
        >
          <div className="text-sm text-base-content inline-flex items-start badge badge-soft whitespace-normal break-all py-1 min-h-fit h-auto">
            <Server className="w-4 h-4 flex-shrink-0 mr-2 mt-0.5" />
            <div className="break-all">
              {highlightText(
                resource.name || resource.uid || 'N/A',
                searchQuery
              )}
            </div>
          </div>
          <div className="text-sm text-base-content inline-flex items-start badge badge-soft whitespace-normal break-all py-1 min-h-fit h-auto">
            <Earth className="w-4 h-4 flex-shrink-0 mr-2 mt-0.5" />
            <div className="break-all">
              {highlightText(resource.region, searchQuery)}
            </div>
          </div>
        </div>
      ))}
      {finding.remediation && (
        <div role="alert" className="alert alert-info alert-soft mt-4">
          <Info className="w-6 h-6 text-info" />
          <div className="flex flex-col gap-2">
            <p className="text-sm text-base-content">
              {highlightText(finding.remediation.desc, searchQuery)}
            </p>
            <div className="flex flex-col gap-2">
              {remediations?.nonUrls.length ? (
                <div className="flex flex-col gap-1">
                  <p className="text-sm text-base-content">Commands:</p>
                  {remediations?.nonUrls.map((reference, index) => {
                    return (
                      <p className="bg-gray-100 rounded-md pl-3 pr-3 p-1 text-sm text-base-content">
                        {reference}
                      </p>
                    );
                  })}
                </div>
              ) : null}
              <div className="flex flex-row gap-2 items-center">
                {remediations?.urls.map((reference, index) => {
                  return (
                    <a
                      href={reference}
                      className="text-sm underline text-primary"
                      key={index}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Reference {index + 1}
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FindingsDetails({
  assessmentId,
  bestPractice,
  pillarId,
  questionId,
  setBestPractice,
}: FindingsDetailsProps & {
  setBestPractice: (
    bestPractice: components['schemas']['BestPractice'] | null
  ) => void;
}) {
  const queryClient = useQueryClient();
  const [showHidden, setShowHidden] = useState(false);
  const [showCommentsFor, setShowCommentsFor] = useState<
    components['schemas']['Finding'] | null
  >(null);
  const [commentPos, setCommentPos] = useState<{
    y: number;
    maxHeight: number;
    minHeight: number;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const containerRef = useRef<HTMLDivElement>(null);
  const commentBtnRefs = useRef<{ [id: string]: HTMLButtonElement | null }>({});

  function handleCommentClick(
    e: React.MouseEvent<HTMLButtonElement>,
    finding: components['schemas']['Finding'] | null
  ) {
    if (!containerRef.current) return;
    if (!finding) {
      setShowCommentsFor(null);
      setCommentPos(null);
    }
    const containerRect = containerRef.current.getBoundingClientRect();
    const btnRect = e.currentTarget.getBoundingClientRect();

    const y = btnRect.top - containerRect.top + btnRect.height / 2;

    const maxHeight = window.innerHeight - btnRect.bottom;

    const cardEl = e.currentTarget.closest('.w-full');
    const cardHeight = cardEl
      ? (cardEl as HTMLElement).getBoundingClientRect().height
      : 150;

    setCommentPos({ y, maxHeight, minHeight: cardHeight });
    setShowCommentsFor(finding);
  }

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: [
        'findings',
        assessmentId,
        pillarId,
        questionId,
        bestPractice.id,
        debouncedSearchQuery,
        showHidden,
      ],
      queryFn: ({ pageParam }) =>
        getFindings(
          assessmentId,
          pillarId,
          questionId,
          bestPractice.id || '',
          100,
          debouncedSearchQuery,
          showHidden,
          pageParam
        ),
      getNextPageParam: (lastPage) => lastPage.nextToken,
      initialPageParam: '',
    });

  const findings = useMemo(() => {
    return data?.pages.flatMap((page) => page.items || []) || [];
  }, [data]);

  const sortedFindings = useMemo(() => {
    return findings.sort((a, b) => {
      // Sort findings with remediation to the top
      if (a.remediation && !b.remediation) return -1;
      if (!a.remediation && b.remediation) return 1;
      return 0;
    });
  }, [findings]);

  const { mutate } = useMutation({
    mutationFn: ({
      findingId,
      hidden,
      comments,
    }: {
      findingId: string;
      hidden?: boolean;
      comments?: components['schemas']['Comment'][];
    }) =>
      updateFinding({
        assessmentId,
        findingId,
        findingDto: {
          ...(hidden ? { hidden } : {}),
          ...(comments ? { comments } : {}),
        },
      }),
    onMutate: async ({ findingId, hidden, comments }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: [
          'findings',
          assessmentId,
          pillarId,
          questionId,
          bestPractice.id,
        ],
      });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData([
        'findings',
        assessmentId,
        pillarId,
        questionId,
        bestPractice.id,
      ]) as components['schemas']['BestPracticeExtra'] | undefined;

      if (!previousData?.results) {
        return { previousData };
      }

      // Create a deep copy of the data
      const newData = JSON.parse(
        JSON.stringify(previousData)
      ) as components['schemas']['BestPracticeExtra'];

      // Update the finding's hidden status
      if (newData.results) {
        const findings = newData.results as components['schemas']['Finding'][];

        const updatedFindings = findings.map((finding) =>
          finding.id === findingId
            ? {
                ...finding,
                hidden: hidden ?? finding.hidden,
                comments: comments ?? finding.comments,
              }
            : finding
        );

        // Create a new object that explicitly matches BestPracticeExtra type
        const updatedData = {
          ...newData,
          results: updatedFindings,
        } as unknown as components['schemas']['BestPracticeExtra'];

        // Update the cache with our optimistic value
        queryClient.setQueryData(
          ['findings', assessmentId, pillarId, questionId, bestPractice.id],
          updatedData
        );
      }

      // Return a context object with the snapshotted value
      return { previousData };
    },
    onError: (_err, _variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousData) {
        queryClient.setQueryData(
          ['findings', assessmentId, pillarId, questionId, bestPractice.id],
          context.previousData
        );
      }
    },
    onSettled: () => {
      // Always refetch after error or success to ensure data is in sync with server
      queryClient.invalidateQueries({
        queryKey: [
          'findings',
          assessmentId,
          pillarId,
          questionId,
          bestPractice.id,
        ],
      });
    },
  });

  const { mutate: mutateComment } = useMutation({
    mutationFn: async (args: { findingId: string; text: string }) => {
      const { findingId, text } = args;
      const response = await addComment({
        assessmentId,
        findingId,
        text,
      });
      return response;
    },
    onError: (err) => {
      console.error(err);
      enqueueSnackbar({
        message: 'Failed to add comment. Please try again later',
        variant: 'error',
      });
    },
    onSuccess: (comment: components['schemas']['Comment']) => {
      if (!showCommentsFor) return;
      if (!showCommentsFor.comments) {
        showCommentsFor.comments = {};
      }
      showCommentsFor.comments[comment.id] = comment;
    },
  });

  const { mutate: mutateUpdateComment } = useMutation({
    mutationFn: async (args: {
      findingId: string;
      commentId: string;
      text: string;
    }) => {
      const { findingId, commentId, text } = args;
      const comment = showCommentsFor?.comments?.[commentId];
      if (comment && comment.text !== text) {
        await updateComment({
          assessmentId,
          findingId,
          commentId,
          commentDto: {
            text,
          },
        });
        return {
          text,
          comment,
        };
      }
      return {
        text,
        comment: null,
      };
    },
    onError: (err) => {
      console.error(err);
      enqueueSnackbar({
        message: 'Failed to update comment. Please try again later',
        variant: 'error',
      });
    },
    onSuccess: (args: {
      text: string;
      comment: components['schemas']['Comment'] | null;
    }) => {
      const { text, comment } = args;
      if (!comment) return;
      comment.text = text;
    },
  });

  const { mutate: mutateDeleteComment, isPending: isDeleteCommentPending } =
    useMutation({
      mutationFn: async (args: { findingId: string; commentId: string }) => {
        const { findingId, commentId } = args;
        await deleteComment({
          assessmentId,
          findingId,
          commentId,
        });
        return commentId;
      },
      onError: (err) => {
        console.error(err);
        enqueueSnackbar({
          message: 'Failed to update comment. Please try again later',
          variant: 'error',
        });
      },
      onSuccess: (commentId: string) => {
        delete showCommentsFor?.comments?.[commentId];
      },
    });

  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: sortedFindings.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 150,
    overscan: 5,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    if (virtualItems.length === 0) return;
    const lastItem = virtualItems[virtualItems.length - 1];
    if (lastItem.index >= sortedFindings.length - 10) {
      fetchNextPage();
    }
  }, [
    virtualItems,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    sortedFindings.length,
  ]);

  useEffect(() => {
    if (!showCommentsFor || !parentRef.current || !containerRef.current) return;

    const scrollEl = parentRef.current;

    const onScroll = () => {
      if (!showCommentsFor || !showCommentsFor.id) return;

      const btn = commentBtnRefs.current[showCommentsFor.id];
      const btnRect = btn?.getBoundingClientRect();
      const containerRect = containerRef.current?.getBoundingClientRect();

      if (!containerRect || !btnRect) return;

      const availableBelow = window.innerHeight - btnRect.bottom;

      let y;
      if (btnRect.top === 0) {
        y = -window.innerHeight;
      } else {
        y = btnRect.top - containerRect.top + btnRect.height / 2;
      }

      setCommentPos((prev) =>
        prev
          ? { y, maxHeight: availableBelow, minHeight: prev.minHeight }
          : prev
      );
    };

    scrollEl.addEventListener('scroll', onScroll);
    return () => scrollEl.removeEventListener('scroll', onScroll);
  }, [showCommentsFor]);

  return (
    <Modal
      open={true}
      onClose={() => setBestPractice(null)}
      className={`w-full ${
        showCommentsFor ? 'mr-[25vw] max-w-6xl' : 'max-w-6xl'
      }`}
      notCentered
    >
      <div
        ref={containerRef}
        className="relative h-[95vh] flex overflow-visible"
      >
        <div className="flex-1 flex flex-col h-[95vh]">
          <div className="flex flex-col gap-2 px-8 py-4 border-b border-base-content/30">
            <div className="flex flex-row gap-2 items-center">
              <h3 className="text-lg font-bold">{bestPractice.label}</h3>
              <label className="fieldset-label text-sm ml-auto text-base-content">
                <input
                  type="checkbox"
                  defaultChecked={false}
                  className="toggle toggle-xs"
                  onChange={() => setShowHidden(!showHidden)}
                />
                Show resolved
              </label>
              {bestPractice.risk && (
                <SeverityBadge severity={bestPractice.risk} />
              )}
            </div>
            <label className="input w-full flex flex-row gap-2 items-center">
              <Search className="h-[1em] opacity-50" />
              <input
                type="search"
                className="grow"
                placeholder="Search findings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </label>
          </div>
          <div ref={parentRef} className="flex-1 overflow-auto">
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {virtualItems.map((virtualRow) => (
                <div
                  key={virtualRow.key}
                  data-index={virtualRow.index}
                  ref={rowVirtualizer.measureElement}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <FindingItem
                    finding={sortedFindings[virtualRow.index]}
                    searchQuery={searchQuery}
                    onHide={(findingId, hidden) =>
                      mutate({ findingId, hidden })
                    }
                    showCommentsFor={showCommentsFor}
                    onComment={(f, e) => handleCommentClick(e, f)}
                    commentBtnRefs={commentBtnRefs}
                  />
                </div>
              ))}
            </div>
            {!hasNextPage && !isFetchingNextPage && !isLoading && (
              <div className="flex flex-col gap-2 px-8 py-4">
                <p className="text-sm text-base-content/80 text-center">
                  You've reached the end.
                </p>
              </div>
            )}
            {sortedFindings.length === 0 && (
              <div className="flex flex-col gap-2 px-8 py-4">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full py-8">
                    <div className="w-16 h-16 loading loading-ring loading-lg text-primary"></div>
                  </div>
                ) : (
                  <p className="text-sm text-base-content/80">
                    No findings found for "{searchQuery}"
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
        {showCommentsFor && commentPos && (
          <div
            className="absolute w-[25vw] bg-base-100 rounded-lg shadow-lg border border-base-content/30 overflow-auto z-50 left-full ml-2 -mt-6"
            style={{
              top: commentPos.y,
            }}
          >
            <CommentsPane
              key={showCommentsFor.id}
              finding={showCommentsFor}
              maxHeight={commentPos.maxHeight}
              minHeight={commentPos.minHeight}
              isDeleteCommentPending={isDeleteCommentPending}
              onAdded={(text: string) =>
                mutateComment({
                  findingId: showCommentsFor.id ?? '',
                  text,
                })
              }
              onUpdate={(commentId, text) =>
                mutateUpdateComment({
                  findingId: showCommentsFor.id ?? '',
                  commentId,
                  text,
                })
              }
              onDelete={(commentId) =>
                mutateDeleteComment({
                  findingId: showCommentsFor.id ?? '',
                  commentId,
                })
              }
              onCancel={() => {
                setCommentPos(null);
                setShowCommentsFor(null);
              }}
            />
          </div>
        )}
      </div>
    </Modal>
  );
}

export default FindingsDetails;
