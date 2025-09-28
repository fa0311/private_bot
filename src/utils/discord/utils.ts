export const toQuoted = (text: string) => `> ${text.split("\n").join("\n> ")}`;
export const toSummary = (text: string) => {
  const noLine = text.split("\n").join();
  return noLine.length > 100 ? `${noLine.slice(0, 100)}...` : noLine;
};
