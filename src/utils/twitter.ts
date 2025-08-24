import type { Tweet } from 'twitter-openapi-typescript-generated';

export const tweetReplace = (tweet: string): string => {
  return tweet
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
};

export const tweetNormalize = (tweet: Tweet): string => {
  if (tweet.noteTweet?.noteTweetResults.result.text) {
    return tweetReplace(tweet.noteTweet.noteTweetResults.result.text);
  }
  if (tweet.legacy?.fullText) {
    if ((tweet.legacy.entities.media ?? []).length > 0) {
      return tweetReplace(tweet.legacy.fullText.replace(/https:\/\/t\.co\/[a-zA-Z0-9]{10}$/, ''));
    } else {
      return tweetReplace(tweet.legacy.fullText);
    }
  } else {
    return '';
  }
};
