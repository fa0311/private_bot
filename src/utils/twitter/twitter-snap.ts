import { promises as fs } from 'node:fs';
import { getSnapAppRender } from 'twitter-snap';

type TwitterSnapConfig = {
  cookiesFile: string;
  ffmpegAdditonalOption?: string;
};

export const createTwitterSnapClient = async (config: TwitterSnapConfig) => {
  const client = getSnapAppRender({ url: 'https://x.com/elonmusk/status/1463584025822821890' });
  const font = await client.getFont();
  const session = await client.login({ sessionType: 'file', cookiesFile: config.cookiesFile });

  const snap = async (path: string, id: string, url: string) => {
    const client = getSnapAppRender({ url: url });
    const render = await client.getRender({ limit: 1, session });

    await client.run(render, async (run) => {
      const output = await run({
        ffmpegTimeout: 6000,
        output: `${path}/${id}.{if-photo:png:mp4}`,
        theme: 'RenderOceanBlueColor',
        scale: 2,
        width: 1440,
        font: font,
        ffmpegAdditonalOption: config.ffmpegAdditonalOption ? JSON.parse(config.ffmpegAdditonalOption) : [],
      });
      await output.file.tempCleanup();
    });
    return (await fs.readdir(path)).filter((file) => file.includes(id));
  };

  const twitterSnap = async (output: string, id: string) => {
    return await snap(output, id, `https://twitter.com/elonmusk/status/${id}`);
  };

  const pixivSnap = async (output: string, id: string) => {
    return await snap(output, id, `https://www.pixiv.net/artworks/${id}`);
  };

  return { twitterSnap, pixivSnap };
};
