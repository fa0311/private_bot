import crypto from 'node:crypto';
import { promises as fs } from 'node:fs';
import { getSnapAppRenderWithCache } from 'twitter-snap';

type TwitterSnapConfig = {
  cookiesFile: string;
  ffmpegAdditonalOption?: string;
};

export const getRand = () => {
  const S = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const N = 16;
  return Array.from(crypto.randomFillSync(new Uint8Array(N)))
    .map((n) => S[n % S.length])
    .join('');
};

export const createTwitterSnapClient = async (config: TwitterSnapConfig) => {
  const api = getSnapAppRenderWithCache({});

  const callback = async (url: string, outputDir: string) => {
    const data = await api({
      url: url,
      limit: 1,
      cookiesFile: config.cookiesFile,
      sessionType: 'file',
      callback: async (run) => {
        const output = await run({
          ffmpegTimeout: 6000,
          output: `${outputDir}/{id}.{if-photo:png:mp4}`,
          theme: 'RenderOceanBlueColor',
          scale: 2,
          width: 1440,
          ffmpegAdditonalOption: config.ffmpegAdditonalOption ? JSON.parse(config.ffmpegAdditonalOption) : [],
        });
        await output.file.tempCleanup();
        return await fs.readdir(outputDir);
      },
    });
    return data[0] ?? [];
  };
  return callback;
};
