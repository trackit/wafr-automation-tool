import inlinePolicyJSON from '../../../../assets/inline-policy.json';

const CreateRoleAnswer = () => {
  const inlinePolicy = JSON.stringify(inlinePolicyJSON, null, 2);

  return (
    <div className="space-y-6">
      <p>
        To get started, you'll need to create a policy that grants the tool
        access to the AWS account where you want to perform assessments:
      </p>
      <ul className="list-disc pl-6 text-gray-700 space-y-2">
        <li>
          Navigate to the <strong>IAM Dashboard</strong> and select{' '}
          <strong>"Policies"</strong>.
        </li>
        <li>
          Click on <strong>"Create policy"</strong> and switch to the{' '}
          <strong>"JSON"</strong> tab.
        </li>
        <li>
          Copy and paste the following policy into the JSON editor:
          <pre className="bg-gray-100 p-4 rounded-md text-sm text-gray-700">
            <code>{inlinePolicy}</code>
          </pre>
        </li>
        <li>
          Add a <strong>"Name"</strong> and <strong>"Description"</strong> to
          the policy.
          <br />
          This will be used to associate the policy with the role.
        </li>
      </ul>
      <p>Next, create the remote role in AWS by following these steps:</p>
      <ul className="list-decimal pl-6 text-gray-700 space-y-2">
        <li>
          Navigate to the <strong>IAM Dashboard</strong> and select{' '}
          <strong>"Roles"</strong>.
        </li>
        <li className="space-y-2">
          <p>
            Click on <strong>"Create role"</strong>, then select{' '}
            <strong>"AWS account"</strong> and choose
            <strong>"Another AWS account"</strong>.
          </p>
          <p>
            Enter the following Account ID:
            <strong> 394125495069</strong>.
          </p>
        </li>
        <li className="space-y-2">
          <p>
            Add your <strong>previously created policy</strong> to the role
            along with the following policies:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>
              <strong>SecurityAudit</strong>
            </li>
            <li>
              <strong>job-function/ViewOnlyAccess</strong>
            </li>
          </ul>
        </li>
        <li>Finish the setup by naming the role.</li>
      </ul>
      <p>
        Once the role is created, you can use the role ARN to perform
        assessments on this specific AWS account within the SaaS platform.
      </p>
    </div>
  );
};

export default CreateRoleAnswer;
