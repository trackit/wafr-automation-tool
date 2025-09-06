import { components } from '@shared/api-schema';
import { useMutation } from '@tanstack/react-query';
import { getOrganizationStatus } from '@webui/api-client';
import { useEffect, useState } from 'react';
import AssessmentsList from './assessments-list';
import WelcomeModal from './welcome/welcome-modal';

function HomePage() {
  const [organizationStatus, setOrganizationStatus] = useState<
    components['schemas']['OrganizationStatus'] | 'NOT_FOUND' | null
  >(null);

  const { mutate: mutateGetOrganizationStatus } = useMutation({
    mutationFn: getOrganizationStatus,
    onMutate: () => {
      console.log('Fetching organization status...');
      setOrganizationStatus(null);
    },
    onError: (err) => {
      console.error(err);
      setOrganizationStatus('NOT_FOUND');
    },
    onSuccess: (status) => {
      setOrganizationStatus(status);
    },
  });

  useEffect(() => {
    mutateGetOrganizationStatus();
  }, [mutateGetOrganizationStatus]);

  switch (organizationStatus) {
    case 'NOT_FOUND':
      return (
        <div className="flex flex-col gap-4">
          <div className="flex flex-row gap-4">
            <h2 className="text-2xl font-bold">Welcome to TrackIt</h2>
            <div className="flex flex-row gap-2"></div>
          </div>
          <div className="flex flex-row gap-4">
            <div className="flex flex-col gap-2">
              <div className="text-center text-base-content/80 col-span-full">
                Your organization is not ready to use TrackIt. Please complete
                the setup process.
              </div>
            </div>
          </div>
        </div>
      );
    case 'UNCOMPLETED':
      return (
        <>
          <WelcomeModal />
          <AssessmentsList />
        </>
      );
    case 'COMPLETED':
      return <AssessmentsList />;
    default:
      return (
        <div className="text-center text-base-content/80 col-span-full">
          <div>Loading...</div>
        </div>
      );
  }
}
export default HomePage;
