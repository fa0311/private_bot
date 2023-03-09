import axios from 'axios';
import qs from 'qs';
import PushClient from '@/client/base';
import { AxiosResponse } from 'axios';
import { Result, Success, Failure } from '@/utils/result';
import FormData from 'form-data';

class LinePushClient extends PushClient {
  url = 'https://notify-api.line.me/api/notify';
  token: string;

  constructor(token: string) {
    super();
    this.token = token;
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

  async sendImage(message?: string, image?: Uint8Array, user?: string): Promise<Result<AxiosResponse, Error>> {
    const params = new FormData();
    const text = (user || message) && [user && `${user}>>`, message].flatMap((e) => (e ? [e] : [])).join(' ');
    if (image) params.append('imageFile', image, 'test.png');
    params.append('message', text ?? '');

    return await axios({
      method: 'post',
      url: this.url,
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'multipart/form-data',
        ...params.getHeaders(),
      },
      data: params,
    })
      .then((e) => new Success<AxiosResponse>(e))
      .catch((e) => new Failure<Error>(e as Error));
  }
}
export default LinePushClient;
