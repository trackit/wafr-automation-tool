import { streamToString, stringToStream } from './stream';

describe('stream', () => {
  describe('streamToString', () => {
    it('should convert a stream to a string', async () => {
      const input = 'Hello, World!';
      const stream = stringToStream(input);
      const result = await streamToString(stream);
      expect(result).toBe(input);
    });

    it('should handle an empty stream', async () => {
      const stream = stringToStream('');
      const result = await streamToString(stream);
      expect(result).toBe('');
    });
  });

  describe('stringToStream', () => {
    it('should convert a string to a stream', () => {
      const input = 'Hello, World!';
      const stream = stringToStream(input);
      let output = '';
      stream.on('data', (chunk) => {
        output += chunk.toString();
      });
      stream.on('end', () => {
        expect(output).toBe(input);
      });
    });
  });
});
