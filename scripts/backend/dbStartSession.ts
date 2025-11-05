import { spawn } from 'child_process';
import net from 'net';

const LOCAL_PORT = 5434;
const LOCAL_HOST = '127.0.0.1';
const PING_INTERVAL_MS = 10 * 60 * 1000;

function startTcpKeepalive(
  localHost = LOCAL_HOST,
  localPort = LOCAL_PORT,
  intervalMs = PING_INTERVAL_MS,
) {
  let timer: NodeJS.Timeout | null = null;
  let stopped = false;

  const ping = () => {
    if (stopped) return;
    const s = new net.Socket();
    s.setTimeout(3000);
    s.once('error', () => s.destroy());
    s.once('timeout', () => s.destroy());
    s.once('connect', () => {
      s.end();
      s.destroy();
    });
    s.connect(localPort, localHost);
  };

  ping();
  timer = setInterval(ping, intervalMs);

  return {
    stop() {
      stopped = true;
      if (timer) clearInterval(timer);
    },
  };
}

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
  let keepalive = null;
  child.on('spawn', () => {
    keepalive = startTcpKeepalive(LOCAL_HOST, LOCAL_PORT, PING_INTERVAL_MS);
  });
  child.on('error', (err) =>
    console.error('Failed to start aws process:', err),
  );
  child.on('close', (code) => {
    if (keepalive) {
      keepalive.stop();
      keepalive = null;
    }
    console.log(`SSM session exited with code ${code}, reconnecting...`);
    setTimeout(() => main(instanceId, auroraEndpoint), 5000);
  });
};

const [, , instanceId, auroraEndpoint] = process.argv;
if (!instanceId || !auroraEndpoint) {
  console.error(
    'Usage: pnpm db:startSession <EC2_INSTANCE_ID> <AURORA_ENDPOINT>',
  );
  process.exit(1);
}
main(instanceId, auroraEndpoint);
