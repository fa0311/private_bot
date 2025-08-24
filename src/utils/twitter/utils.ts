export const exportTwitterUrl = (text: string) => {
  const re = 'https?://(www\\.)?(mobile\\.)?(x|twitter)\\.com/([a-zA-Z0-9_]+)/status/([0-9]+)';

  const regex = new RegExp(re, 'g');
  const matches = text.matchAll(regex);
  const urls = Array.from(matches)
    .map((e) => e[5])
    .filter((id): id is string => typeof id === 'string');

  return urls;
};

export const exportPixivUrl = (text: string) => {
  const re = 'https?://(www\\.)?pixiv\\.net/artworks/([0-9]+)';

  const regex = new RegExp(re, 'g');
  const matches = text.matchAll(regex);
  const urls = Array.from(matches)
    .map((e) => e[2])
    .filter((id): id is string => typeof id === 'string');
  return urls;
};
