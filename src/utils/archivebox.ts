import { Failure, type Result, Success } from '@/utils/result';
import type { AxiosResponse } from 'axios';
import axios from 'axios';
import * as cheerio from 'cheerio';
import FormData from 'form-data';

class Archivebox {
  endpoint: string;
  cookie: string[] | undefined;
  token: string | undefined;
  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  async getToken() {
    const response = await this._getToken();
    this.cookie = response.get().headers['set-cookie'];
    const $ = cheerio.load(response.get().data);
    this.token = $('input[type="hidden"][name="csrfmiddlewaretoken"]').attr('value');
  }

  async _getToken(): Promise<Result<AxiosResponse, Error>> {
    return await axios({
      method: 'get',
      url: this.endpoint,
    })
      .then((e) => new Success<AxiosResponse>(e))
      .catch((e) => new Failure<Error>(e as Error));
  }

  async addUrl(url: string[], tag: string[] = []): Promise<Result<AxiosResponse, Error>> {
    const params = new FormData();
    params.append('csrfmiddlewaretoken', this.token);
    params.append('url', url.join('\n'));
    params.append('parser', 'url_list');
    params.append('tag', tag.join(','));
    params.append('depth', 0);

    return await axios({
      method: 'post',
      url: this.endpoint,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Cookie: (this.cookie ?? []).join('; '),
        ...params.getHeaders(),
      },
      data: params,
    })
      .then((e) => new Success<AxiosResponse>(e))
      .catch((e) => new Failure<Error>(e as Error));
  }
}

export default Archivebox;
