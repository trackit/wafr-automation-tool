import { useQuery } from '@tanstack/react-query';
import { getMilestones } from '@webui/api-client';
import { Modal } from '@webui/ui';
import { Clock, List, ExternalLink } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';

type ListAWSMilestonesDialogProps = {
  assessmentId: string;
  disabled?: boolean;
};

export default function ListAWSMilestonesDialog({
  assessmentId,
  disabled = false,
}: ListAWSMilestonesDialogProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  
  const { data: milestones, isLoading, error } = useQuery({
    queryKey: ['milestones', assessmentId],
    queryFn: () => getMilestones({ assessmentId }),
    enabled: open, // Only fetch when dialog is open
  });

  const sortedMilestones = useMemo(() => {
    if (!milestones) return [];
    
    return milestones.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [milestones]);

  const handleMilestoneClick = (milestoneId: number) => {
    navigate(`/assessments/${assessmentId}/milestones/${milestoneId}`);
    setOpen(false); // Close the dialog after navigation
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'N/A';
    }
  };

  return (
    <>
      <button
        className={`flex flex-row gap-2 w-full text-left ${
          disabled 
            ? 'text-gray-400 cursor-not-allowed opacity-50' 
            : ''
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

            {milestones && !isLoading && (
              sortedMilestones && sortedMilestones.length > 0 ? (
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
              )
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}
