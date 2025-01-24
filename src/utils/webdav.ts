import type { Readable } from 'stream';
import type * as webdav from 'webdav';

export const makedirs = async (client: webdav.WebDAVClient, dir: string) => {
  if (!(await client.exists(dir))) {
    await makedirs(client, splitdirs(dir)[1]);
    await client.createDirectory(dir);
  }
};

export const splitdirs = (dir: string): (string | string)[] => {
  const list = dir.split('/');
  const next = list.pop();
  return [next ?? '', list.join('/')];
};

export const streamToBuffer = async (stream: Readable): Promise<Buffer> => {
  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on('error', (err) => reject(err));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
};
