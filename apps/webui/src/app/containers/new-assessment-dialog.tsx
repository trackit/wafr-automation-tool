import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router';

import { paths } from '@shared/api-schema';
import { postAssessment } from '@webui/api-client';
import { NewAssessment } from '@webui/forms';
import { Modal } from '@webui/ui';

function NewAssessmentDialog() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { mutate, isPending } = useMutation({
    mutationFn: async (data: {
      name: string;
      roleArn: string;
      regions?: string[];
      workflows?: string[];
    }) => {
      const response = (await postAssessment(
        data,
      )) as paths['/assessments']['post']['responses']['201']['content']['application/json'];
      if (!response.assessmentId) {
        console.error('Assessment ID is missing from response');
      }
      return { assessmentId: response.assessmentId?.toString() || '' };
    },
    onSuccess: (data: { assessmentId: string }) => {
      setOpen(false);
      void navigate(`/assessments/${data.assessmentId}`);
    },
  });

  const onSubmit = (data: {
    name: string;
    roleArn: string;
    regions?: string[];
    workflows?: string[];
  }) => {
    mutate({
      name: data.name,
      roleArn: data.roleArn,
      regions: data.regions?.length ? data.regions : undefined,
      workflows: data.workflows?.length ? data.workflows : undefined,
    });
  };

  return (
    <>
      <div className="not-prose">
        <button
          className="btn btn-primary btn-sm border-none rounded-lg font-semibold min-w-[140px]"
          onClick={() => setOpen(true)}
        >
          New Assessment
        </button>
      </div>
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
