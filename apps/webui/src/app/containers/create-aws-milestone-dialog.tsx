import { useMutation } from '@tanstack/react-query';
import { ApiError, createAWSMilestone } from '@webui/api-client';
import { CreateAWSMilestone as CreateAWSMilestoneForm } from '@webui/forms';
import { Modal } from '@webui/ui';
import { Milestone } from 'lucide-react';
import { enqueueSnackbar } from 'notistack';
import { useState } from 'react';

type CreateAWSMilestoneDialogProps = {
  assessmentId: string;
};

export default function CreateAWSMilestoneDialog({
  assessmentId,
}: CreateAWSMilestoneDialogProps) {
  const [open, setOpen] = useState(false);
  const { mutate, isPending } = useMutation({
    mutationFn: async (data: {
      assessmentId: string;
      region: string;
      name: string;
    }) => {
      await createAWSMilestone(
        {
          assessmentId: data.assessmentId,
        },
        {
          region: data.region,
          name: data.name,
        }
      );
    },
    onMutate: () => {
      enqueueSnackbar({
        message: 'Creating AWS Milestone...',
        variant: 'info',
      });
      setOpen(false);
    },
    onSuccess: () => {
      enqueueSnackbar({
        message: 'Milestone successfully created in AWS Console',
        variant: 'success',
      });
    },
    onError: (e: ApiError) => {
      if (e.statusCode === 409) {
        enqueueSnackbar({
          message:
            'No export role found to create AWS milestone, please contact support',
          variant: 'error',
        });
      } else {
        enqueueSnackbar({
          message: 'Failed to create milestone, please contact support',
          variant: 'error',
        });
      }
    },
  });

  const onSubmit = (data: { region: string; name: string }) => {
    mutate({
      assessmentId,
      region: data.region,
      name: data.name,
    });
  };

  return (
    <>
      <button
        className="flex flex-row gap-2 w-full text-left"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
      >
        <Milestone className="w-4 h-4" /> Create AWS Milestone
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        className="w-full max-w-2xl"
      >
        <div className="flex flex-col gap-4 px-6 py-4">
          <h2 className="text-2xl font-bold">Create AWS Milestone</h2>
          <hr />
          <CreateAWSMilestoneForm onSubmit={onSubmit} disabled={isPending} />
        </div>
      </Modal>
    </>
  );
}
