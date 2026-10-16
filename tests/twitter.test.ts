import { describe, expect, it } from "vitest";
import { tweetReplace } from "../src/utils/twitter.js";
import { exportPixivUrl, exportTwitterUrl } from "../src/utils/twitter/utils.js";

describe("twitter utils", () => {
  it("extracts tweet urls", () => {
    const text = "see https://x.com/elonmusk/status/1349129669258448897 and https://twitter.com/SpaceX/status/1768794901586804837 !";
    expect(exportTwitterUrl(text)).toEqual([
      ["https://x.com/elonmusk/status/1349129669258448897", "elonmusk", "1349129669258448897"],
      ["https://twitter.com/SpaceX/status/1768794901586804837", "SpaceX", "1768794901586804837"],
    ]);
    expect(exportTwitterUrl("no links")).toEqual([]);
  });

  it("extracts pixiv urls", () => {
    expect(exportPixivUrl("https://www.pixiv.net/artworks/123456")).toEqual([
      ["https://www.pixiv.net/artworks/123456", "123456"],
    ]);
  });

  it("unescapes tweet text", () => {
    expect(tweetReplace("a &amp; b &lt;c&gt; &quot;d&quot; &apos;e&apos;")).toBe("a & b <c> \"d\" 'e'");
  });
});
