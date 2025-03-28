import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Server, Earth, Search, Info, FileCheck } from 'lucide-react';
import { getFindings, hideFinding } from '@webui/api-client';
import { components } from '@webui/types';
import { useState, useMemo } from 'react';

interface FindingsDetailsProps {
  assessmentId: string;
  bestPractice: components['schemas']['BestPractice'];
  pillarId: string;
  questionId: string;
}

const SeverityBadge = ({
  severity,
  className,
}: {
  severity: 'High' | 'Medium' | 'Low' | 'Critical';
  className?: string;
}) => {
  return (
    <div
      className={`font-bold badge badge-soft ${
        severity === 'High' || severity === 'Critical'
          ? 'badge-error'
          : severity === 'Medium'
          ? 'badge-warning'
          : 'badge-warning'
      } ${className}`}
    >
      {severity}
    </div>
  );
};

const highlightText = (text: string | undefined, searchQuery: string) => {
  if (!text || !searchQuery) return text;
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
}: {
  finding: components['schemas']['Finding'];
  searchQuery: string;
  onHide: (findingId: string, hidden: boolean) => void;
}) {
  return (
    <div className="w-full  px-8 py-8">
      <div className="flex flex-row gap-2 items-start">
        <div className="text-md font-bold mb-2">
          {finding.severity && (
            <SeverityBadge
              className="badge-sm mr-2"
              severity={finding.severity as 'High' | 'Medium' | 'Low'}
            />
          )}
          {highlightText(finding.status_detail, searchQuery)}
        </div>
        {!finding.hidden && (
          <div
            className="tooltip ml-auto tooltip-left"
            data-tip="Force resolve"
          >
            <button
              className="btn btn-xs btn-primary btn-outline mt-[-0.5em]"
              onClick={() =>
                onHide(finding.id?.toString() || '', !finding.hidden)
              }
            >
              <FileCheck className="w-4 h-4 " />
            </button>
          </div>
        )}
      </div>
      {finding.risk_details && (
        <p className="text-sm text-base-content">
          {highlightText(finding.risk_details, searchQuery)}
        </p>
      )}
      {finding.resources?.map((resource) => (
        <div
          className="flex flex-row gap-2 items-center mt-2"
          key={resource.uid}
        >
          <div className="text-sm text-base-content flex flex-row gap-2 items-center badge badge-soft">
            <Server className="w-4 h-4" />
            <div>
              {highlightText(resource.name || resource.uid, searchQuery)}
            </div>
          </div>
          <div className="text-sm text-base-content flex flex-row gap-2 items-center badge badge-soft">
            <Earth className="w-4 h-4" />
            <div>{highlightText(resource.region, searchQuery)}</div>
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
            <div className="flex flex-row gap-2 items-center">
              {finding.remediation.references?.map((reference, index) => (
                <a
                  href={reference}
                  className="text-sm underline text-primary"
                  key={index}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Reference {index + 1}
                </a>
              ))}
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
}: FindingsDetailsProps) {
  const [showHidden, setShowHidden] = useState(false);
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const { data, isLoading } = useQuery<
    components['schemas']['BestPracticeExtra']
  >({
    queryKey: ['findings', assessmentId, pillarId, questionId, bestPractice.id],
    queryFn: () =>
      getFindings(assessmentId, pillarId, questionId, bestPractice.id || ''),
  });

  const findings: components['schemas']['Finding'][] = data?.results || [];
  const sortedFindings = useMemo(() => {
    return findings.sort((a, b) => {
      // Sort findings with remediation to the top
      if (a.remediation && !b.remediation) return -1;
      if (!a.remediation && b.remediation) return 1;
      return 0;
    });
  }, [findings]);

  const filteredFindings = useMemo(() => {
    return sortedFindings.filter((finding) => {
      if (!showHidden && finding.hidden) return false;
      if (!searchQuery) return true;

      const searchLower = searchQuery.toLowerCase();

      // Search through status detail
      if (finding.status_detail?.toLowerCase().includes(searchLower))
        return true;

      // Search through risk details
      if (finding.risk_details?.toLowerCase().includes(searchLower))
        return true;

      // Search through resources
      if (
        finding.resources?.some(
          (resource) =>
            resource.name?.toLowerCase().includes(searchLower) ||
            resource.uid?.toLowerCase().includes(searchLower) ||
            resource.region?.toLowerCase().includes(searchLower)
        )
      )
        return true;

      // Search through remediation
      return !!finding.remediation?.desc?.toLowerCase().includes(searchLower);
    });
  }, [sortedFindings, showHidden, searchQuery]);

  const { mutate } = useMutation({
    mutationFn: ({
      findingId,
      hidden,
    }: {
      findingId: string;
      hidden: boolean;
    }) => hideFinding(assessmentId, findingId, hidden),
    onMutate: async ({ findingId, hidden }) => {
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
          finding.id && finding.id.toString() === findingId
            ? { ...finding, hidden }
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

  console.log(showHidden);

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-full py-8">
        <div className="w-16 h-16 loading loading-ring loading-lg text-primary"></div>
      </div>
    );
  return (
    <div className="overflow-y-auto max-h-[95vh] flex flex-col">
      <div className="flex flex-col gap-2  px-8 py-4 border-b border-base-content/30">
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
          {data?.risk && <SeverityBadge severity={data?.risk} />}
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
      <div className="flex flex-col divide-y divide-base-content/30 overflow-y-auto">
        {filteredFindings.map((finding) => (
          <FindingItem
            key={finding.id}
            finding={finding}
            searchQuery={searchQuery}
            onHide={(findingId, hidden) => mutate({ findingId, hidden })}
          />
        ))}
        {filteredFindings.length === 0 && (
          <div className="flex flex-col gap-2 px-8 py-4">
            <p className="text-sm text-base-content/80">
              No findings found for "{searchQuery}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default FindingsDetails;
