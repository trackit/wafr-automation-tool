import { tokenTypeORMClientManager } from '@backend/infrastructure';
import { inject } from '@shared/di-container';

export const main = async (): Promise<void> => {
  const clientManager = inject(tokenTypeORMClientManager);
  await clientManager.initialize();
  const client = await clientManager.getClient();
  await client.query(
    `DROP DATABASE IF EXISTS "database_trackit_io" WITH (FORCE);`,
  );
  await client.query(`DROP TABLE IF EXISTS "organizations" CASCADE;`);
  await client.query(`DROP TABLE IF EXISTS "tenants" CASCADE;`);
  await client.query(`DROP TABLE IF EXISTS "migrations" CASCADE;`);
};
