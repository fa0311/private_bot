import PushClient, { type PutFileType } from '@/client/base';
import { Failure, type Result, Success } from '@/utils/result';
import axios, { type AxiosResponse } from 'axios';

class DiscordPushClient extends PushClient {
  url = 'https://discordapp.com/api/webhooks/';
  token: string;
  putFile: PutFileType;

  constructor(token: string, putFile: PutFileType) {
    super();
    this.token = token;
    this.putFile = putFile;
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

  async sendFile(
    name: string,
    contents: Uint8Array,
    message?: string,
    user?: string,
    user_image?: string,
  ): Promise<Result<AxiosResponse, Error>> {
    const url = await this.putFile(name, contents);
    return this.send(url, user, user_image);
  }
}
export default DiscordPushClient;
