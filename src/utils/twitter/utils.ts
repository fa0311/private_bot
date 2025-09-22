import { spawn } from 'node:child_process';

const arrayStringChecker = (arr: unknown, length: number): arr is string[] => {
  return Array.isArray(arr) && arr.length === length && arr.every((e) => typeof e === 'string');
};

export const exportTwitterUrl = (text: string) => {
  const re = 'https?://(www\\.)?(mobile\\.)?(x|twitter)\\.com/([a-zA-Z0-9_]+)/status/([0-9]+)';

  const regex = new RegExp(re, 'g');
  const matches = text.matchAll(regex);
  const urls = Array.from(matches)
    .map((e) => [e[0], e[4], e[5]])
    .filter((url): url is [string, string, string] => arrayStringChecker(url, 3));

  return urls;
};

export const exportPixivUrl = (text: string) => {
  const re = 'https?://(www\\.)?pixiv\\.net/artworks/([0-9]+)';

  const regex = new RegExp(re, 'g');
  const matches = text.matchAll(regex);
  const urls = Array.from(matches)
    .map((e) => [e[0], e[2]])
    .filter((url): url is [string, string] => arrayStringChecker(url, 2));
  return urls;
};

export const exec = (cmd: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      const child = spawn(cmd, { shell: '/bin/bash' });
      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject();
        }
      });
    } catch (_) {
      reject();
    }
  });
};

export const encodeCheck = ({ format, codec }: { format: string; codec: string }): Promise<boolean> => {
  const res = exec(
    `ffmpeg -f lavfi -i testsrc=duration=1:size=427x240:rate=5 -c:v ${codec} -preset default -y -f ${format} /dev/null`
  );
  return res.then(() => true).catch(() => false);
};
