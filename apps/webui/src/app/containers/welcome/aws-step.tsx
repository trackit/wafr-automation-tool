import { useMemo } from 'react';

type LaunchMode = 'template' | 'review';

function buildCloudFormationLaunchUrl(args: {
  region: string;
  stackName: string;
  templateUrl: string;
  params?: Record<string, string>;
  mode?: LaunchMode;
  capabilities?: Array<
    'CAPABILITY_IAM' | 'CAPABILITY_NAMED_IAM' | 'CAPABILITY_AUTO_EXPAND'
  >;
}) {
  const {
    region,
    stackName,
    templateUrl,
    params = {},
    mode = 'review',
    capabilities,
  } = args;

  const base = `https://console.aws.amazon.com/cloudformation/home?region=${encodeURIComponent(
    region
  )}#/stacks/create/${mode}`;

  const qs = new URLSearchParams();
  qs.set('stackName', stackName);
  qs.set('templateURL', templateUrl);
  Object.entries(params).forEach(([k, v]) => qs.set(`param_${k}`, v));
  if (capabilities?.length) {
    qs.set('capabilities', capabilities.join(','));
  }

  return `${base}?${qs.toString()}`;
}

export function AWSStep() {
  const launchUrl = useMemo(
    () =>
      buildCloudFormationLaunchUrl({
        region: 'us-east-1',
        stackName: 'WAFR-Automation-Tool-ExecutionStack',
        templateUrl:
          'https://s3.amazonaws.com/cloudformation-stackset-sample-templates-us-east-1/AWSCloudFormationStackSetExecutionRole.yml',
        params: {
          AdministratorAccountId: '576872909007',
          ExecutionRoleName: 'WAFR-Automation-Tool-ExecutionRole',
        },
        mode: 'review',
        capabilities: ['CAPABILITY_NAMED_IAM', 'CAPABILITY_AUTO_EXPAND'],
      }),
    []
  );

  const handleLinkClick = () => {
    // Start checking for the role
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold m-0">
        Deploy the CloudFormation stack
      </h3>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <a
          href={launchUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="btn btn-primary btn-md"
          onClick={handleLinkClick}
        >
          <span role="img" aria-label="rocket">
            🚀
          </span>{' '}
          Open CloudFormation & deploy
        </a>

        <div className="flex items-center gap-2 text-xs text-base-content/70">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => navigator.clipboard.writeText(launchUrl)}
          >
            Copy launch link
          </button>
          <span className="hidden sm:inline">or</span>
          <code className="px-2 py-1 rounded bg-base-200">
            CloudFormation → Create stack (standard)
          </code>
        </div>
      </div>

      <div className="rounded-lg bg-base-200 text-xs p-3">
        This dialog is intentionally <b>non-dismissable</b> to guarantee the
        initial setup. Refresh the page after deployment to continue.
      </div>
    </div>
  );
}

export default AWSStep;
