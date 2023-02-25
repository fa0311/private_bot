import { getLineProfile } from "src//utils/line";
import { DiscordMessageModule } from "src/types/modules";
import * as line from "@line/bot-sdk";
import * as discord from "discord.js";
import { LineMessageEventModule } from "src/types/modules";
import dayjs from "dayjs";
import "dayjs/locale/ja";
import { makedirs, streamToBuffer } from "src/utils/webdav";
import * as env from "src/utils/env";
import * as webdav from "webdav";
import download from "src/utils/download";

export const lineSynchronizeText: LineMessageEventModule<line.TextEventMessage> = {
  name: "LineSynchronizeText",
  listener: async (client, event, message) => {
    const profile = (await getLineProfile(client.line, event.source)).get()!;
    (await client.discordPush.send(message.text, profile.displayName, profile.pictureUrl)).get();
  },
};

type ContentType =
  | line.ImageEventMessage
  | line.VideoEventMessage
  | line.AudioEventMessage
  | line.FileEventMessage;

export const lineSynchronizeFile: LineMessageEventModule<ContentType> = {
  name: "LineSynchronizeFile",
  listener: async (client, event, message) => {
    const extension = (() => {
      switch (message.type) {
        case "image":
          return "jpg";
        case "audio":
          return "mp3";
        case "video":
          return "mp4";
        case "file":
          return message.fileName.split(".").slice(-1)[0];
      }
    })();

    const stream = await client.line.getMessageContent(message.id);
    const contents = await streamToBuffer(stream);
    const path = await putFile(client.webdav, `${message.id}.${extension}`, contents);
    const profile = (await getLineProfile(client.line, event.source)).get()!;
    const url = `${env.getString("WEBDAV.SHARE_BASE_URL")}/${path}`;
    (await client.discordPush.send(url, profile.displayName, profile.pictureUrl)).get();
  },
};

export const discordSynchronize: DiscordMessageModule<discord.Message> = {
  name: "DiscordSynchronize",
  listener: async (client, message) => {
    // if (message.channelId != env.getString("DISOCRD_SYNCHRONIZE_CHAT.CHANNNEL_ID")) return
    if (message.author.bot) return;

    const isImage = (e: string | null) => {
      if (!e) return false;
      if (e.split(".").length == 1) return false;
      return ["jpeg", "png"].includes(e.split(".").slice(-1)[0]);
    };
    const getExtension = (e: string | null) => {
      if (!e) return "";
      if (e.split(".").length == 1) return "";
      return "." + e.split(".").slice(-1)[0];
    };

    const results = await Promise.all(message.attachments.map((e) => download(e.proxyURL)));
    const buffer = results.map((e) => e.get()!);
    const names = message.attachments.map((e) => e.id + getExtension(e.name));
    const auther = message.author.username;

    const textList = (
      await Promise.all(
        names.map(async (e, i) => {
          const path = await putFile(client.webdav, e, buffer[i]);
          if (isImage(path)) return null;
          return `${env.getString("WEBDAV.SHARE_BASE_URL")}/${path}`;
        })
      )
    ).flatMap((e) => (e ? [e] : []));

    const text = [message.content + textList.join("\n")];
    names.map((e, i) => isImage(e));

    const sendResults = (
      await Promise.all(
        names.map(
          (e, i) => isImage(e) && client.linePush.sendImage(text.shift(), buffer[i], auther)
        )
      )
    ).flatMap((e) => (e ? [e] : []));

    if (text.length > 0) {
      (await client.linePush.sendList(text, auther)).get();
    }

    sendResults.map((e) => e.get()!);
  },
};

const putFile = async (
  client: webdav.WebDAVClient,
  name: string,
  contents: Uint8Array
): Promise<string> => {
  const time = dayjs(new Date()).locale("ja").format("YYYY-MM");
  const path = `LINE/${time}/${name}`;
  await makedirs(client, `LINE/${time}`);
  await client.putFileContents(path, contents);
  return path;
};
