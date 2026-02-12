import trustPolicyCreateOpportunityJSON from '../../../../assets/trust-policy-ace-opportunity.json';

const AceOpportunityRoleAnswer = () => {
  const trustPolicy = JSON.stringify(trustPolicyCreateOpportunityJSON, null, 2)
    .replaceAll('<ACCOUNT_ID>', import.meta.env.VITE_ACCOUNT_ID)
    .replaceAll('<ENV>', import.meta.env.VITE_STAGE);

  return (
    <div className="space-y-6">
      <p>
        To allow Partner Central (ACE) opportunities you have two options to
        create the role associated: create it via CloudFormation Stack
        (recommended) or create it manually (alternative).
      </p>

      {/* Option 1 */}
      <div>
        <h3 className="font-semibold">
          Option 1 (Recommended): Use CloudFormation Stack
        </h3>

        <p>
          Launch our preconfigured CloudFormation stack to automatically create
          the ace opportunity role with the correct permissions.
        </p>
        <p>
          <a
            href="https://app.wafr.trackit.io/cloudformation-templates/ace-opportunity-role.yaml"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Click here to download the CloudFormation template for the ACE role
          </a>
        </p>
      </div>

      {/* Option 2 */}
      <div>
        <h3 className="font-semibold">Option 2: Create the Role Manually</h3>
        <p>
          Create a role in the <strong>target</strong> account with the managed
          policy <code>AWSPartnerCentralOpportunityManagement</code> .
        </p>
        <p>
          If you prefer fewer roles, you can add minimal inline permissions
          <code>
            <ol className="list-disc pl-6 text-gray-700">
              <li>partnercentral:CreateOpportunity</li>
              <li>partnercentral:AssociateOpportunity</li>
            </ol>
          </code>
          to your existing export role. This is less secure (mixes
          responsibilities) but may be acceptable for small teams.
        </p>
      </div>

      <div>
        <ol className="list-decimal pl-6 text-gray-700 space-y-2">
          <li>
            Navigate to the <strong>IAM Dashboard</strong> and select{' '}
            <strong>"Roles"</strong>.
          </li>
          <li>
            Click on <strong>"Create role"</strong>, then choose
            <strong> "Custom trust policy"</strong> and paste the trust policy
            provided below.
          </li>
          <pre className="bg-gray-100 p-4 rounded-md text-sm text-gray-700 overflow-auto">
            <code>{trustPolicy}</code>
          </pre>
          <li className="space-y-1">
            Attach the following AWS managed policy:
            <ul className="list-disc pl-6">
              <li>
                <strong>AWSPartnerCentralOpportunityManagement</strong>
              </li>
            </ul>
          </li>
          <li>Finish the setup by naming the role.</li>
        </ol>
      </div>

      <p>
        Once created (via either option), provide the role ARN in
        aceIntegration.roleArn when creating the organization to create ACE
        opportunities from the SaaS platform.
      </p>
    </div>
  );
};

export default AceOpportunityRoleAnswer;
