import * as line from '@line/bot-sdk';
import { LineMessageEventModule } from '@/types/modules';
import 'dayjs/locale/ja';
import { TwitterOpenApi } from 'twitter-openapi-typescript';

export const twitterViewer: LineMessageEventModule<line.TextEventMessage> = {
  name: 'TwitterViewer',
  listener: async (client, event, message) => {
    const api = await new TwitterOpenApi().getClient();

    const re = 'https?://(mobile\\.)?(twitter|x)\\.com/[a-zA-Z0-9_]{1,15}/status/([0-9]{0,19})';
    const regex = new RegExp(re, 'g');
    const matches = message.text.matchAll(regex);
    const response: string[] = [];
    for (const match of matches) {
      const data = await api.getDefaultApi().getTweetResultByRestId({ tweetId: match[2] });
      response.push(data.data.user.legacy.name);
      response.push(data.data.tweet.legacy.fullText);
    }
    if (response.length == 0) return;
    return {
      type: 'text',
      text: response.join('\n'),
    };
  },
};
