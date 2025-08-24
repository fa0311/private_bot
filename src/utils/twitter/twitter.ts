import { promises as fs } from 'node:fs';
import { TwitterOpenApi } from 'twitter-openapi-typescript';
import { exportTwitterUrl } from './utils';

export type Cookie = {
  name: string;
  domain: string;
  value: string;
};

const sequentialMap = async <T, U>(array: T[], callback: (item: T) => Promise<U>): Promise<U[]> => {
  const results: U[] = [];
  for (const item of array) {
    results.push(await callback(item));
  }
  return results;
};

export const createTwitterClient = async (filename: string) => {
  const api = new TwitterOpenApi();
  const data = await fs.readFile(filename, 'utf-8');
  const parsed = JSON.parse(data);
  const cookies = parsed as Cookie[];
  const json = Object.fromEntries(cookies.filter((e) => e.domain === '.x.com').map((e) => [e.name, e.value]));
  const client = await api.getClientFromCookies(json);

  const fromText = (text: string) => {
    const urls = exportTwitterUrl(text);
    return sequentialMap(urls, async (e) => {
      return [e, await client.getTweetApi().getTweetDetail({ focalTweetId: e })] as const;
    });
  };

  return { fromText };
};
