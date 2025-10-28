import { components } from '@shared/api-schema';

export function StatusBadge({
  status,
  className,
}: {
  status: components['schemas']['AssessmentStep'];
  className?: string;
}) {
  const statusMap = {
    SCANNING_STARTED: 'Scanning',
    PREPARING_ASSOCIATIONS: 'Preparing',
    ASSOCIATING_FINDINGS: 'Associating Findings to Best Practices',
    FINISHED: 'Ready',
    ERRORED: 'Failed',
  };

  const statusColor = {
    SCANNING_STARTED: 'info',
    PREPARING_ASSOCIATIONS: 'info',
    ASSOCIATING_FINDINGS: 'info',
    FINISHED: 'success',
    ERRORED: 'error',
  };

  if (!status) return null;
  return (
    <div
      className={`badge font-bold badge-soft badge-${statusColor[status]} ${className}`}
    >
      {statusMap[status]}
    </div>
  );
}

export default StatusBadge;
