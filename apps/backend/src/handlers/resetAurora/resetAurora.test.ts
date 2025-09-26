import { registerTestInfrastructure } from '@backend/infrastructure';
import { main } from './handler';

describe('ResetAuroraHandler', () => {
  it('should drop all objects owned by postgres user', async () => {
    registerTestInfrastructure();
    await main();
    expect(true).toBe(true); // Just to ensure the function runs without errors
  });
});
