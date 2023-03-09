import PushClient from '@/client/base';
import axios from 'axios';
import { AxiosResponse } from 'axios';
import { Result, Success, Failure } from '@/utils/result';

class DiscordPushClient extends PushClient {
  url = 'https://discordapp.com/api/webhooks/';
  token: string;

  constructor(token: string) {
    super();
    this.token = token;
  }

  async send(message?: string, user?: string, user_image?: string): Promise<Result<AxiosResponse, Error>> {
    return await axios
      .post(`${this.url}${this.token}`, {
        username: user,
        avatar_url: user_image,
        content: message,
      })
      .then((e) => new Success<AxiosResponse>(e))
      .catch((e) => new Failure<Error>(e as Error));
  }
}
export default DiscordPushClient;
