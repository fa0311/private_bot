import { Klass, LineMessageEventModule } from '@/types/modules';
import * as line from '@line/bot-sdk';
import { spawn } from 'child_process';
import 'dayjs/locale/ja';
import { promises as fs } from 'fs';
import { TwitterOpenApiClient } from 'twitter-openapi-typescript';

const exec = (cmd: string): Promise<void> => new Promise((resolve, reject) => {
  try {
    const child = spawn(cmd, { shell: '/bin/bash' });
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject();
      }
    });
  } catch (e) {
    reject();
  }

});


export const twitterViewer: Klass<Promise<TwitterOpenApiClient>, LineMessageEventModule<line.TextEventMessage>> = (api) => ({
  name: 'TwitterViewer',
  listener: async (client, event, message) => {
    const re = 'https?://(mobile\\.)?(twitter|x)\\.com/[a-zA-Z0-9_]{1,15}/status/([0-9]{0,19})';
    const regex = new RegExp(re, 'g');
    const matches = message.text.matchAll(regex);
    const response: string[] = [];
    for (const match of matches) {
      const data = await (await api).getTweetApi().getTweetDetail({ focalTweetId: match[3] });
      if (!data.data) continue;
      if (!data.data.data) continue;
      if (data.data.data.length == 0) continue;
      const index = data.data.data.findIndex((e) => e.tweet.restId == match[3]);
      Array.from({ length: index + 1 }, (_, i) => i).forEach((i) => {
        const tweet = data.data.data[i];
        if (!tweet.tweet.legacy) return;
        response.push(tweet.user.legacy.name);
        response.push(tweet.tweet.legacy.fullText);
        response.push("----------");
      });
      response.pop();
    }
    if (response.length == 0) return;
    return {
      type: 'text',
      text: response.join('\n'),
    };
  },
});


type twitterSnapParam = (name: string) => Promise<string>;
export const twitterSnap: Klass<twitterSnapParam, LineMessageEventModule<line.TextEventMessage>> = (put) => ({
  name: 'TwitterSnap',
  listener: async (client, event, message) => {

    const re = 'https?://(mobile\\.)?(twitter|x)\\.com/[a-zA-Z0-9_]{1,15}/status/([0-9]{0,19})';
    const regex = new RegExp(re, 'g');
    const matches = message.text.matchAll(regex);
    const response: string[] = [];

    for (const match of matches) {
      const cmd = `/usr/local/bin/npx twitter-snap ${match[3]} -o "temp/${match[3]}.{if-photo:png:mp4}" --session-type file --cookies-file cookie.json --simple-log --api getTweetDetail --limit 1 --width 1440 --scale 2`;
      await exec(cmd);
      const files = (await fs.readdir('temp')).filter((file) => file.includes(match[3]));

      for (const file of files) {
        const name = await put(file);
        await fs.unlink(`temp/${file}`);
        response.push(name);
      }
    }
    if (response.length == 0) return;
    return {
      type: 'text',
      text: 'スナップしました\n' + response.join('\n'),
    };
  },
});
