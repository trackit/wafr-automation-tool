import { PostgreSqlContainer } from '@testcontainers/postgresql';

export async function startPostgresContainer(
  port = 5432,
  image = 'postgres:15-alpine',
) {
  const container = new PostgreSqlContainer(image)
    .withDatabase('postgres')
    .withUsername(process.env.DB_USERNAME ?? 'postgres')
    .withPassword(process.env.DB_PASSWORD ?? 'postgres')
    .withExposedPorts(port)
    .withHealthCheck({
      test: ['CMD-SHELL', 'pg_isready -d postgres'],
      interval: 3000,
      timeout: 5000,
      retries: 5,
    });
  const startedContainer = await container.start();

  process.env.DB_HOST = startedContainer.getHost();
  process.env.DB_PORT = startedContainer.getMappedPort(port).toString();
  return startedContainer;
}
