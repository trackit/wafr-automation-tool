import { useQuery } from '@tanstack/react-query';
import { Server, Earth, Search, Info } from 'lucide-react';
import { getFindings } from '@webui/api-client';
import { components } from '@webui/types';
import { useState } from 'react';

interface FindingsDetailsProps {
  assessmentId: string;
  bestPractice: components['schemas']['BestPractice'];
  pillarId: string;
  questionId: string;
}

function FindingItem({
  finding,
}: {
  finding: components['schemas']['Finding'];
}) {
  return (
    <div className="w-full  px-8 py-8">
      <div className="text-md font-bold flex flex-row gap-2 items-center text-primary mb-2">
        {finding.status_detail}
      </div>
      {finding.risk_details && (
        <p className="text-sm text-base-content/80">{finding.risk_details}</p>
      )}
      {finding.resources?.map((resource) => (
        <div
          className="flex flex-row gap-2 items-center mt-2"
          key={resource.uid}
        >
          <div className="text-sm text-base-content flex flex-row gap-2 items-center badge badge-soft badge-primary">
            <Server className="w-4 h-4" />
            {resource.name || resource.uid}
          </div>
          <div className="text-sm text-base-content flex flex-row gap-2 items-center badge badge-soft badge-primary">
            <Earth className="w-4 h-4" />
            {resource.region}
          </div>
        </div>
      ))}
      {finding.remediation && (
        <div role="alert" className="alert alert-info alert-soft mt-4">
          <Info className="w-6 h-6 text-info" />
          <div className="flex flex-col gap-2">
            <p className="text-sm text-base-content">
              {finding.remediation.desc}
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
  const [searchQuery, setSearchQuery] = useState('');
  const { data, isLoading } = useQuery<
    components['schemas']['BestPracticeExtra']
  >({
    queryKey: ['findings', assessmentId, pillarId, questionId, bestPractice.id],
    queryFn: () =>
      getFindings(assessmentId, pillarId, questionId, bestPractice.id || ''),
  });

  const findings: components['schemas']['Finding'][] = data?.results || [];
  const sortedFindings = findings.sort((a, b) => {
    // Sort findings with remediation to the top
    if (a.remediation && !b.remediation) return -1;
    if (!a.remediation && b.remediation) return 1;
    return 0;
  });

  const filteredFindings = sortedFindings.filter((finding) => {
    if (!searchQuery) return true;

    const searchLower = searchQuery.toLowerCase();

    // Search through status detail
    if (finding.status_detail?.toLowerCase().includes(searchLower)) return true;

    // Search through risk details
    if (finding.risk_details?.toLowerCase().includes(searchLower)) return true;

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
          {data?.risk && (
            <div
              className={`font-bold badge ${
                data?.risk === 'High'
                  ? 'badge-error'
                  : data?.risk === 'Medium'
                  ? 'badge-warning'
                  : 'badge-info'
              } ml-auto`}
            >
              {data?.risk}
            </div>
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
      <div className="flex flex-col divide-y divide-base-content/30 overflow-y-auto">
        {filteredFindings.map((finding) => (
          <FindingItem key={finding.id} finding={finding} />
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
