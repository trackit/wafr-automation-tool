import {
  type CountryCode,
  type Industry,
} from '@aws-sdk/client-partnercentral-selling';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CirclePlus } from 'lucide-react';
import { enqueueSnackbar } from 'notistack';
import { useState } from 'react';

import { type ApiError, createOpportunity } from '@webui/api-client';
import { NewAceOpportunity } from '@webui/forms';
import { Modal } from '@webui/ui';

type CreateOpportunityDialogProps = {
  assessmentId: string;
  hasOpportunityId: boolean;
  hasWafrWorkloadArn: boolean;
};

type NewOpportunityForm = {
  companyName: string;
  duns: string;
  industry?: Industry;
  companyWebsiteUrl: string;
  monthlyRecurringRevenue: string;
  customerType: string;
  targetCloseDate: string;
  country?: CountryCode;
  postalCode: string;
  city?: string;
  streetAddress?: string;
};

type MutationPayload = {
  assessmentId: string;
} & NewOpportunityForm;

type CustomerType = 'INTERNAL_WORKLOAD' | 'CUSTOMER';

function CreateOpportunityDialog({
  assessmentId,
  hasOpportunityId,
  hasWafrWorkloadArn,
}: CreateOpportunityDialogProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: MutationPayload) => {
      await createOpportunity(
        {
          assessmentId: data.assessmentId,
        },
        {
          companyName: data.companyName,
          duns: data.duns,
          industry: data.industry ?? 'N/A',
          customerType: data.customerType as CustomerType,
          companyWebsiteUrl: data.companyWebsiteUrl,
          customerCountry: data.country ?? 'N/A',
          customerPostalCode: data.postalCode,
          monthlyRecurringRevenue: data.monthlyRecurringRevenue,
          targetCloseDate: data.targetCloseDate,
          customerCity: data.city ?? '',
          customerAddress: data.streetAddress ?? '',
        },
      );
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['assessment', assessmentId],
        }),
        queryClient.invalidateQueries({ queryKey: ['assessments'] }),
      ]);
      return {};
    },
    onMutate: () => {
      enqueueSnackbar({
        message: 'Creating ACE opportunity...',
        variant: 'info',
      });
    },
    onSuccess: () => {
      setOpen(false);
      enqueueSnackbar({
        message: 'ACE opportunity successfully created',
        variant: 'success',
      });
    },
    onError: (e: ApiError) => {
      if (e.statusCode === 409) {
        enqueueSnackbar({
          message:
            'No ACE details found for your organization, please contact support',
          variant: 'error',
        });
      } else {
        enqueueSnackbar({
          message: 'Failed to create ACE opportunity, please contact support',
          variant: 'error',
        });
      }
    },
  });

  const onSubmit = (data: NewOpportunityForm) => {
    mutate({
      assessmentId,
      companyName: data.companyName,
      duns: data.duns,
      industry: data.industry,
      city: data.city ?? '',
      streetAddress: data.streetAddress ?? '',
      companyWebsiteUrl: data.companyWebsiteUrl,
      monthlyRecurringRevenue: data.monthlyRecurringRevenue,
      customerType: data.customerType as CustomerType,
      targetCloseDate: data.targetCloseDate,
      country: data.country,
      postalCode: data.postalCode,
    });
  };

  const disabled = !hasWafrWorkloadArn || hasOpportunityId;
  const button = (
    <button
      className={`flex flex-row gap-2 w-full text-left ${
        disabled ? 'text-gray-400 cursor-not-allowed opacity-50' : ''
      }`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setOpen(true);
      }}
      disabled={disabled}
    >
      <CirclePlus className="w-4 h-4" /> Create ACE opportunity
    </button>
  );

  const dataTipMessage = !hasWafrWorkloadArn
    ? 'Please export to AWS first'
    : 'Assessment has already an opportunity';

  return (
    <>
      <div className="not-prose">
        {disabled ? (
          <div className="tooltip" data-tip={dataTipMessage}>
            {button}
          </div>
        ) : (
          button
        )}
      </div>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        className="w-full max-w-2xl"
      >
        <div className="flex flex-col gap-4 px-6 py-4">
          <h2 className="text-2xl font-bold">New ACE Opportunity</h2>
          <hr />
          <NewAceOpportunity onSubmit={onSubmit} disabled={isPending} />
        </div>
      </Modal>
    </>
  );
}

export default CreateOpportunityDialog;
