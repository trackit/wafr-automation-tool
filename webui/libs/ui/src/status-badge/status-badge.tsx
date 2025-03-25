import { components } from '@webui/types';

export function StatusBadge({
  status,
  className,
}: {
  status: components['schemas']['Assessment']['step'];
  className?: string;
}) {
  const statusMap = {
    SCANNING_STARTED: 'Scanning Started',
    PREPARING_PROMPTS: 'Preparing Prompts',
    INVOKING_LLM: 'Invoking LLM',
    FINISHED: 'Ready',
    ERRORED: 'Errored',
  };

  const statusColor = {
    SCANNING_STARTED: 'info',
    PREPARING_PROMPTS: 'info',
    INVOKING_LLM: 'info',
    FINISHED: 'success',
    ERRORED: 'error',
  };

  if (!status) return null;
  return (
    <div
      className={`badge font-bold badge-${statusColor[status]} ${className}`}
    >
      {statusMap[status]}
    </div>
  );
}

export default StatusBadge;
