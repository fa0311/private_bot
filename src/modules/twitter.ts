import { Klass, LineMessageEventModule } from '@/types/modules';
import * as line from '@line/bot-sdk';
import { spawn } from 'child_process';
import 'dayjs/locale/ja';
import { promises as fs } from 'fs';
import { TwitterOpenApiClient } from 'twitter-openapi-typescript';
import { Tweet } from 'twitter-openapi-typescript-generated';

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



const tweetReplace = (tweet: string): string => {
  return tweet.replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

const tweetNormalize = (tweet: Tweet): string => {
  if (tweet.noteTweet?.noteTweetResults.result.text) {
    return tweetReplace(tweet.noteTweet.noteTweetResults.result.text);
  }
  if (tweet.legacy?.fullText) {
    if ((tweet.legacy.entities.media ?? []).length > 0) {
      return tweetReplace(tweet.legacy.fullText.replace(/https:\/\/t\.co\/[a-zA-Z0-9]{10}$/, ''));
    } else {
      return tweetReplace(tweet.legacy.fullText);
    }
  } else {
    return "";
  }
}


export const twitterViewer: Klass<Promise<TwitterOpenApiClient>, LineMessageEventModule<line.TextEventMessage>> = (api) => ({
  name: 'TwitterViewer',
  listener: async (client, event, message) => {
    const re = 'https?://(mobile\\.)?(twitter|x)\\.com/[a-zA-Z0-9_]{1,15}/status/([0-9]{0,19})';
    const regex = new RegExp(re, 'g');
    const matches = message.text.matchAll(regex);
    const response: string[] = [];
    for (const match of matches) {
      const data = await (await api).getTweetApi().getTweetDetail({ focalTweetId: match[3] });
      if (data.data.data.length > 0) {
        const index = data.data.data.findIndex((e) => e.tweet.restId == match[3]);
        for (let i = 0; i < index; i++) {
          const tweet = data.data.data[i];
          response.push(tweet.user.legacy.name);
          response.push(tweetNormalize(tweet.tweet));
          response.push("----------");
        }
        const tweet = data.data.data[index];
        if (tweet.quoted) {
          response.push(tweet.quoted.user.legacy.name);
          response.push(tweetNormalize(tweet.quoted.tweet));
          response.push("----------");
        }
        response.push(tweet.user.legacy.name);
        response.push(tweetNormalize(tweet.tweet));
      }
    }
    if (response.length == 0) return;
    return {
      type: 'text',
      text: response.join('\n'),
    };
  },
});


type twitterSnapParam = (id: string, name: string) => Promise<string>;
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
        const id = event.source.userId ?? 'unknown';
        const name = await put(id, file);
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
