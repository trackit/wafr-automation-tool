import { Modal } from '@webui/ui';
import { useState } from 'react';
import AWSStep from './aws-step';
import WelcomeStep from './welcome-step';

enum Step {
  WELCOME,
  AWS_DEPLOY,
}

export function WelcomeModal() {
  const [open, setOpen] = useState(true);
  const [step, setStep] = useState<Step>(Step.WELCOME);

  const [region, setRegion] = useState('us-east-1');
  const [stackName, setStackName] = useState('StackSet-ExecutionRole');

  return (
    <Modal
      open={open}
      onClose={() => {
        /* non-dismissable on purpose */
      }}
      className="max-w-2xl w-[92vw] p-6"
    >
      {step === Step.WELCOME && (
        <WelcomeStep onNext={() => setStep(Step.AWS_DEPLOY)} />
      )}

      {step === Step.AWS_DEPLOY && (
        <AWSStep
          region={region}
          setRegion={setRegion}
          stackName={stackName}
          setStackName={setStackName}
          params={params}
          setParam={setParam}
          templateUrl={templateUrl}
          launchUrl={launchUrl}
          regions={AWS_REGIONS}
        />
      )}
    </Modal>
  );
}

export default WelcomeModal;
