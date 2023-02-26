import * as line from '@line/bot-sdk';
import { LineMessageEventModule } from '@/types/modules';
import 'dayjs/locale/ja';
import axios from 'axios';
import { AxiosResponse } from 'axios';
import { Result, Success, Failure } from '@/utils/result';

export const twitterViewer: LineMessageEventModule<line.TextEventMessage> = {
  name: 'TwitterViewer',
  listener: async (client, event, message) => {
    const re = 'https?://(mobile\\.)?twitter\\.com/[a-zA-Z0-9_]{1,15}/status/([0-9]{0,19})';
    const regex = new RegExp(re, 'g');
    const matches = message.text.matchAll(regex);
    const response: string[] = [];
    for (const match of matches) {
      const contents = await getTweet(match[2]);
      const data = contents.get().data;
      response.push(data.user.name);
      response.push(data.text);
    }
    return {
      type: 'text',
      text: response.join('\n'),
    };
  },
};

const getTweet = async (id: string): Promise<Result<AxiosResponse, Error>> => {
  return await axios({
    url: 'https://cdn.syndication.twimg.com/tweet-result',
    method: 'GET',
    params: {
      features:
        'tfw_timeline_list:;tfw_follower_count_sunset:true;tfw_tweet_edit_backend:on;tfw_refsrc_session:on;tfw_mixed_media_15897:treatment;tfw_experiments_cookie_expiration:1209600;tfw_duplicate_scribes_to_settings:on;tfw_video_hls_dynamic_manifests_15082:true_bitrate;tfw_legacy_timeline_sunset:true;tfw_tweet_edit_frontend:on',
      id: id,
      lang: 'ja',
    },
  })
    .then((e) => new Success<AxiosResponse>(e))
    .catch((e) => new Failure<Error, AxiosResponse>(e as Error));
};
