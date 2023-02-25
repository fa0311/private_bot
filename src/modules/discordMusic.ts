import { DiscordMessageModule } from "src/types/modules";
import * as discord from "discord.js";
import "dayjs/locale/ja";
import * as env from "src/utils/env";
import * as voice from "@discordjs/voice";
import MusicQueue from "src/music";
import { youtube } from "src/utils/youtube";

import fs from "fs";
import ytdl from "ytdl-core";

export const discordMusic: DiscordMessageModule<discord.Message> = {
  name: "DiscordSynchronize",
  listener: async (client, message) => {
    if (message.channel.type != discord.ChannelType.GuildVoice) return;
    if (message.author.bot) return;
    const command = message.content.split(" ");
    if (command[0] != "play") return;

    if (!message.member?.voice.channelId) return;
    if (!message.guildId) return;
    if (!message.guild) return;

    client.music = client.music.filter(
      (e) => e.connection.state.status != voice.VoiceConnectionStatus.Destroyed
    );

    const yt = ytdl(command[1], {
      filter: "audioonly",
      highWaterMark: 1 << 62,
      liveBuffer: 1 << 62,
      dlChunkSize: 0,
      quality: "lowestaudio",
    });
    const info = (await youtube(command[1])).get()!;

    yt.on("error", (stream) => {
      if (message.channel.type != discord.ChannelType.GuildVoice) return;
      message.channel.send(stream.message);
      client.logger.warn(stream.stack);
    });

    if (client.music.some((e) => e.guildId == message.guildId)) {
      const queue = client.music.find((e) => e.guildId == message.guildId)!;
      queue.push(voice.createAudioResource(yt));
      queue.info.push(info);
      message.channel.send(`\`${queue.state.length + 1} ${getTitle(info.videoDetails)}\``);
    } else {
      const connection = voice.joinVoiceChannel({
        channelId: message.member?.voice.channelId,
        guildId: message.guildId,
        adapterCreator: message.guild.voiceAdapterCreator,
      });
      const queue = new MusicQueue(message.guildId, connection, client.logger);
      queue.start(voice.createAudioResource(yt));
      queue.info.push(info);
      client.music.push(queue);
      message.channel.send(`\`${queue.state.length + 1} ${getTitle(info.videoDetails)}\``);
    }
  },
};

export const discordMusicList: DiscordMessageModule<discord.Message> = {
  name: "DiscordMusicList",
  listener: async (client, message) => {
    if (message.channel.type != discord.ChannelType.GuildVoice) return;
    if (message.author.bot) return;
    const command = message.content.split(" ");
    if (command[0] != "list") return;

    if (!message.member?.voice.channelId) return;
    if (!message.guildId) return;
    if (!message.guild) return;

    if (client.music.some((e) => e.guildId == message.guildId)) {
      const connection = client.music.find((e) => e.guildId == message.guildId)!;
      message.channel.send(
        connection.info.map((e, i) => `\`${i + 1} ${getTitle(e.videoDetails)}\``).join("\n")
      );
    }
  },
};

export const discordMusicSkip: DiscordMessageModule<discord.Message> = {
  name: "DiscordMusicSkip",
  listener: async (client, message) => {
    if (message.channel.type != discord.ChannelType.GuildVoice) return;
    if (message.author.bot) return;
    const command = message.content.split(" ");
    if (command[0] != "skip") return;

    if (!message.member?.voice.channelId) return;
    if (!message.guildId) return;
    if (!message.guild) return;

    const key = command[1] ? Number.parseInt(command[1]) : 1;

    if (client.music.some((e) => e.guildId == message.guildId)) {
      const connection = client.music.find((e) => e.guildId == message.guildId)!;
      if (key == 1 && connection.state.length > 0) {
        message.channel.send(`\`${getTitle(connection.info[0].videoDetails)}\``);
        connection.player.play(connection.pop()!);
      } else if (key == 1 && connection.state.length == 0) {
        connection.destroy();
      } else if (key > 1 && connection.state.length > key - 2) {
        message.channel.send(`\`${getTitle(connection.info[key - 1].videoDetails)}\``);
        connection.remove(key - 2);
      }
    }
  },
};

const getTime = (l: number): string => {
  const [hour, h] = division(l, 3600);
  const [min, sec] = division(h, 60);
  if (hour == 0) return `${("00" + min).slice(-2)}:${("00" + sec).slice(-2)}`;
  return `${("00" + hour).slice(-2)}:${("00" + min).slice(-2)}:${("00" + sec).slice(-2)}`;
};

const getTitle = (details: ytdl.MoreVideoDetails): string => {
  const time = getTime(Number.parseInt(details.lengthSeconds));
  return `${details.title} (${time})`;
};

const division = (i: number, ii: number): [number, number] => {
  return [Math.floor(i / ii), i % ii];
};
