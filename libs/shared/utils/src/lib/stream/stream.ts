import { Readable } from 'stream';
export { Readable } from 'stream';

export const streamToString = async (stream: Readable): Promise<string> => {
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
};

export const stringToStream = (str: string): Readable => {
  return Readable.from([str]);
};
