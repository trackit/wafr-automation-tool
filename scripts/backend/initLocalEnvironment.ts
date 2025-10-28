/* eslint no-console: 0 */

import { promises as fs } from 'fs';
import { env } from './localEnvironment';

type Env = {
  [variableName: string]: string;
};

const envValuesToString = (values: Env) => {
  const lines = Object.entries(values).map((value) => value.join('='));
  return lines.join('\n');
};

const createEnv = async ({ name, values }: { name: string; values: Env }) => {
  const fileContent = envValuesToString(values);
  await fs.writeFile(`./${name}`, fileContent);
  return name;
};

const main = async () => {
  await createEnv({
    name: '.env.test',
    values: env,
  });
};

main()
  .then(() => {
    console.log('Environment file created: .env.test');
  })
  .catch((err) => {
    console.error(err);
  });
