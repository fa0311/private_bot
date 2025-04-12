import PushClient, { type PutFileType } from '@/client/base';
import { Failure, type Result, Success } from '@/utils/result';
import axios, { type AxiosResponse } from 'axios';
import qs from 'qs';

class LinePushClient extends PushClient {
  url = 'http://127.0.0.1:4535/api/notify';
  token: string;
  putFile: PutFileType;

  constructor(token: string, putFile: PutFileType) {
    super();
    this.token = token;
    this.putFile = putFile;
  }

  async send(message?: string, user?: string): Promise<Result<AxiosResponse, Error>> {
    return await axios({
      method: 'post',
      url: this.url,
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: qs.stringify({
        message: (user || message) && [user && `${user}>>`, message].flatMap((e) => (e ? [e] : [])).join(' '),
      }),
    })
      .then((e) => new Success<AxiosResponse>(e))
      .catch((e) => new Failure<Error>(e as Error));
  }

  async sendFile(
    name: string,
    image: Uint8Array,
    message?: string,
    user?: string,
  ): Promise<Result<AxiosResponse, Error>> {
    const url = await this.putFile(name, image);
    const text = (user || message) && [user && `${user}>>`, message].flatMap((e) => (e ? [e] : [])).join(' ');

    return this.send([text, url].filter((e) => e).join('\n'));
  }
}
export default LinePushClient;
