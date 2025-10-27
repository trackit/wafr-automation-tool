import { spawn } from 'child_process';

export const main = (instanceId: string, auroraEndpoint: string) => {
  const args = [
    'ssm',
    'start-session',
    '--region',
    'us-west-2',
    '--target',
    instanceId,
    '--document-name',
    'AWS-StartPortForwardingSessionToRemoteHost',
    '--parameters',
    JSON.stringify({
      host: [auroraEndpoint],
      portNumber: ['5432'],
      localPortNumber: ['5434'],
    }),
  ];

  const child = spawn('aws', args, { stdio: 'inherit' });

  child.on('error', (err) =>
    console.error('Failed to start aws process:', err),
  );
  child.on('close', (code) => {
    console.log(`SSM session exited with code ${code}`);
    process.exit(code ?? 0);
  });
};

const [, , instanceId, auroraEndpoint] = process.argv;
if (!instanceId || !auroraEndpoint) {
  console.error('Usage: pnpm dbconnect <EC2_INSTANCE_ID> <AURORA_ENDPOINT>');
  process.exit(1);
}
main(instanceId, auroraEndpoint);
