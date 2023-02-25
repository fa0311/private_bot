import { getLineProfile } from "src//utils/line";
import { DiscordMessageModule } from "src/types/modules";
import * as line from "@line/bot-sdk";
import * as discord from "discord.js";
import { LineMessageEventModule } from "src/types/modules";
import dayjs from "dayjs";
import "dayjs/locale/ja";
import { makedirs, streamToBuffer } from "src/utils/webdav";
import * as env from "src/utils/env";
import * as webdav from "webdav";
import axios from "axios";
import { AxiosResponse } from "axios";
import download from "src/utils/download";
import { Result, Success, Failure } from "src/utils/result";

export const twitterViewer: LineMessageEventModule<line.TextEventMessage> = {
  name: "TwitterViewer",
  listener: async (client, event, message) => {
    const re = "https?://(mobile\\.)?twitter\\.com/[a-zA-Z0-9_]{1,15}/status/([0-9]{0,19})";
    const regex = new RegExp(re, "g");
    const matches = message.text.matchAll(regex);

    const response: string[] = [];

    for (const match of matches) {
      const contents = await getTweet(match[2]);
      const data = contents.get()!.data;
      response.push(data.user.name);
      response.push(data.text);
    }
    return {
      type: "text",
      text: response.join("\n"),
    };
  },
};

const getTweet = async (id: string): Promise<Result<AxiosResponse, Error>> => {
  return await axios({
    url: "https://cdn.syndication.twimg.com/tweet-result",
    method: "GET",
    params: {
      features:
        "tfw_timeline_list:;tfw_follower_count_sunset:true;tfw_tweet_edit_backend:on;tfw_refsrc_session:on;tfw_mixed_media_15897:treatment;tfw_experiments_cookie_expiration:1209600;tfw_duplicate_scribes_to_settings:on;tfw_video_hls_dynamic_manifests_15082:true_bitrate;tfw_legacy_timeline_sunset:true;tfw_tweet_edit_frontend:on",
      id: id,
      lang: "ja",
    },
  })
    .then((e) => new Success<AxiosResponse>(e))
    .catch((e) => new Failure<Error>(e as Error));
};
