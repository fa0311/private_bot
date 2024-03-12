import PushClient, { PutFileType } from '@/client/base';
import { Failure, Result, Success } from '@/utils/result';
import axios, { AxiosResponse } from 'axios';
import FormData from 'form-data';
import qs from 'qs';

class LinePushClient extends PushClient {
  url = 'https://notify-api.line.me/api/notify';
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
    const isImage = (e: string | null) => {
      if (!e) return false;
      if (e.split('.').length == 1) return false;
      return ['jpeg', 'png', 'jpg'].includes(e.split('.').slice(-1)[0]);
    };
    const url = await this.putFile(name, image);
    const text = (user || message) && [user && `${user}>>`, message].flatMap((e) => (e ? [e] : [])).join(' ');

    if (isImage(name)) {
      const params = new FormData();
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
    } else {
      return this.send([text, url].filter((e) => e).join('\n'));
    }
  }
}
export default LinePushClient;
