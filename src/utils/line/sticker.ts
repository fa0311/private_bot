export const getSticker = async (stickerId: string) => {
  const url = `https://stickershop.line-scdn.net/stickershop/v1/sticker/${stickerId}/android/sticker.png`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch sticker');
  }

  return response.arrayBuffer();
};
