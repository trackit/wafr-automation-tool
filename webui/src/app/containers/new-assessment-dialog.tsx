import { useMutation } from '@tanstack/react-query';
import { postAssessment } from '@webui/api-client';
import { NewAssessment } from '@webui/forms';
import { paths } from '@webui/types';
import { Modal } from '@webui/ui';
import { useState } from 'react';
import { useNavigate } from 'react-router';

function NewAssessmentDialog() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { mutate, isPending } = useMutation({
    mutationFn: async (data: {
      name: string;
      roleArn?: string;
      regions?: string[];
      workflow?: string;
    }) => {
      const response = (await postAssessment(
        data
      )) as paths['/assessments']['post']['responses']['201']['content']['application/json'];
      return { id: response.assessmentId?.toString() || '' };
    },
    onSuccess: (data: { id: string }) => {
      setOpen(false);
      navigate(`/assessments/${data.id}`);
    },
  });

  const onSubmit = (data: {
    name: string;
    roleArn?: string;
    regions?: string[];
    workflow?: string;
  }) => {
    mutate({
      name: data.name,
      roleArn: data.roleArn || undefined,
      regions: data.regions?.length ? data.regions : undefined,
      workflow: data.workflow || undefined,
    });
  };

  return (
    <>
      <button
        className="btn btn-primary btn-sm text-sm h-8 min-h-8"
        onClick={() => setOpen(true)}
      >
        New Assessment
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        className="w-full max-w-2xl"
      >
        <div className="flex flex-col gap-4 px-6 py-4">
          <h2 className="text-2xl font-bold">New Assessment</h2>
          <hr />
          <NewAssessment onSubmit={onSubmit} disabled={isPending} />
        </div>
      </Modal>
    </>
  );
}

export default NewAssessmentDialog;
