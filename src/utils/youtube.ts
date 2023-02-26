import ytdl from 'ytdl-core';
import { videoInfo } from 'ytdl-core';
import { Result, Success, Failure } from '@/utils/result';

export const youtube = async (url: string): Promise<Result<videoInfo, Error>> => {
  return await ytdl
    .getInfo(url)
    .then((e) => new Success(e))
    .catch((e) => new Failure(new Error(e)));
};
