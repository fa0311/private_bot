import axios from 'axios';

import { Failure, type Result, Success } from '@/utils/result';

const download = async (url: string): Promise<Result<Uint8Array, Error>> => {
  return await axios({
    method: 'get',
    url: url,
    responseType: 'arraybuffer',
  })
    .then((e) => new Success<Buffer>(e.data))
    .catch((e) => new Failure<Error>(e as Error));
};
export default download;
