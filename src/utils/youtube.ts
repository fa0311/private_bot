import { Failure, type Result, Success } from '@/utils/result';
import type { videoInfo } from 'ytdl-core';
import ytdl from 'ytdl-core';

export const youtube = async (url: string): Promise<Result<videoInfo, Error>> => {
  return await ytdl
    .getInfo(url)
    .then((e) => new Success(e))
    .catch((e) => new Failure(new Error(e)));
};
