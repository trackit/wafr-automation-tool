import { useMutation } from '@tanstack/react-query';
import { exportToAWS } from '@webui/api-client';
import { ExportToAWS } from '@webui/forms';
import { Modal } from '@webui/ui';
import { ArrowRightFromLine } from 'lucide-react';
import { enqueueSnackbar } from 'notistack';
import { useState } from 'react';

type ExportToAWSDialogProps = {
  assessmentId: string;
};

function ExportToAWSDialog({ assessmentId }: ExportToAWSDialogProps) {
  const [open, setOpen] = useState(false);
  const { mutate, isPending } = useMutation({
    mutationFn: async (data: { assessmentId: string; region: string }) => {
      await exportToAWS(
        {
          assessmentId: data.assessmentId,
        },
        {
          region: data.region,
        }
      );
    },
    onMutate: () => {
      enqueueSnackbar({
        message: 'Exporting to AWS...',
        variant: 'info',
      });
      setOpen(false);
    },
    onSuccess: () => {
      enqueueSnackbar({
        message: 'Assessment sent successfully to AWS Console',
        variant: 'success',
      });
    },
    onError: () => {
      enqueueSnackbar({
        message: 'Failed to send data. Please try again later',
        variant: 'error',
      });
    },
  });

  const onSubmit = (data: { region: string }) => {
    mutate({
      assessmentId,
      region: data.region,
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
        <ArrowRightFromLine className="w-4 h-4" /> Export to AWS
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        className="w-full max-w-2xl"
      >
        <div className="flex flex-col gap-4 px-6 py-4">
          <h2 className="text-2xl font-bold">Export to AWS</h2>
          <hr />
          <ExportToAWS onSubmit={onSubmit} disabled={isPending} />
        </div>
      </Modal>
    </>
  );
}

export default ExportToAWSDialog;
