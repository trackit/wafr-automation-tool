import trustPolicyExportJSON from '../../../../assets/trust-policy-export.json';

const ExportRoleAnswer = () => {
  const trustPolicy = JSON.stringify(trustPolicyExportJSON, null, 2)
    .replace('<ACCOUNT_ID>', '394125495069')
    .replace('<ENV>', 'prod');

  return (
    <div className="space-y-6">
      <p>
        You have two options to create the role that allows exporting WAFR
        assessments to the AWS Well-Architected Tool console:
      </p>

      {/* Option 1 */}
      <div>
        <h3 className="font-semibold">
          Option 1 (Recommended): Use CloudFormation Stack
        </h3>
        <p>
          Launch our preconfigured CloudFormation stack to automatically create
          the export role with the correct permissions.
        </p>
        <p>
          <a
            href="https://app.wafr.trackit.io/cloudformation-templates/export-role.yaml"
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
                <strong>WellArchitectedConsoleFullAccess</strong>
              </li>
            </ul>
          </li>
          <li>Finish the setup by naming the role.</li>
        </ol>
      </div>

      <p>
        Once created (via either option), use the role ARN to export assessments
        to the Well-Architected Tool console from the SaaS platform.
      </p>
    </div>
  );
};

export default ExportRoleAnswer;
