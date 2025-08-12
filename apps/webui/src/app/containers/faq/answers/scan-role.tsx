import inlinePolicyJSON from '../../../../assets/inline-policy.json';
import trustPolicyJSON from '../../../../assets/trust-policy-scan.json';

const ScanRoleAnswer = () => {
  const inlinePolicy = JSON.stringify(inlinePolicyJSON, null, 2);
  const trustPolicy = JSON.stringify(trustPolicyJSON, null, 2)
    .replace('<ACCOUNT_ID>', import.meta.env.VITE_ACCOUNT_ID)
    .replace('<ENV>', import.meta.env.VITE_STAGE);

  return (
    <div className="space-y-6">
      <p>
        You have two options for creating the role required to run assessments:
      </p>

      <div className="space-y-4">
        {/* Option 1 */}
        <div>
          <h3 className="font-semibold">
            Option 1 (Recommended): Use CloudFormation Stack
          </h3>
          <p>
            This option will automatically create the required role with all
            necessary permissions, making setup faster and less error-prone.
          </p>
          <p>
            <a
              href="https://app.wafr.trackit.io/cloudformation-templates/scan-role.yaml"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Click here to download the CloudFormation template
            </a>
          </p>
        </div>

        {/* Option 2 */}
        <div>
          <h3 className="font-semibold">Option 2: Create the Role Manually</h3>
          <p>
            If you prefer, you can manually create the IAM role and policies by
            following these steps:
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
              Add a <strong>"Name"</strong> and <strong>"Description"</strong>{' '}
              to the policy. This will be used to associate the policy with the
              role.
            </li>
          </ul>

          <p>Then, create the remote role in AWS:</p>
          <ul className="list-decimal pl-6 text-gray-700 space-y-2">
            <li>
              Navigate to the <strong>IAM Dashboard</strong> and select{' '}
              <strong>"Roles"</strong>.
            </li>
            <li>
              Click on <strong>"Create role"</strong>, then choose
              <strong> "Custom trust policy"</strong> and paste the trust policy
              provided below.
            </li>
            <pre className="bg-gray-100 p-4 rounded-md text-sm text-gray-700">
              <code>{trustPolicy}</code>
            </pre>
            <li>
              Add your <strong>previously created policy</strong> along with:
              <ul className="list-disc pl-6 text-gray-700 mt-1">
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
        </div>
      </div>

      <p>
        Once the role is created (via either method), you can use the role ARN
        to perform assessments on this specific AWS account within the SaaS
        platform.
      </p>
    </div>
  );
};

export default ScanRoleAnswer;
