import MusicQueue from '@/client/music';
import { DiscordMessageModule, Klass } from '@/types/modules';
import { youtube } from '@/utils/youtube';
import * as voice from '@discordjs/voice';
import 'dayjs/locale/ja';
import * as discord from 'discord.js';
import ytdl from 'ytdl-core';

export const discordMusic: Klass<undefined, DiscordMessageModule<discord.Message>[]> = () => {
  let musicQueue: MusicQueue[] = [];

  const music: DiscordMessageModule<discord.Message> = {
    name: 'DiscordMusic',
    listener: async (client, message) => {
      if (message.channel.type != discord.ChannelType.GuildVoice) return;
      if (message.author.bot) return;
      const command = message.content.split(' ');
      if (command[0] != 'play') return;

      if (!message.member?.voice.channelId) return;
      if (!message.guildId) return;
      if (!message.guild) return;

      musicQueue = musicQueue.filter((e) => e.connection.state.status != voice.VoiceConnectionStatus.Destroyed);

      const yt = ytdl(command[1], {
        filter: 'audioonly',
        highWaterMark: 1 << 62,
        liveBuffer: 1 << 62,
        dlChunkSize: 0,
        quality: 'lowestaudio',
      });
      const info = (await youtube(command[1])).get();

      yt.on('error', (stream) => {
        if (message.channel.type != discord.ChannelType.GuildVoice) return;
        message.channel.send(stream.message);
        client.logger.warn(stream.stack);
      });

      const queue = getConnection(musicQueue, message.guildId);
      if (queue) {
        queue.push(voice.createAudioResource(yt));
        queue.info.push(info);
        message.channel.send(`\`${queue.state.length + 1} ${getTitle(info.videoDetails)}\``);
      } else {
        const connection = voice.joinVoiceChannel({
          channelId: message.member?.voice.channelId,
          guildId: message.guildId,
          adapterCreator: message.guild.voiceAdapterCreator as any,
        });
        const queue = new MusicQueue(message.guildId, connection, client.logger);
        queue.start(voice.createAudioResource(yt));
        queue.info.push(info);
        musicQueue.push(queue);
        message.channel.send(`\`${queue.state.length + 1} ${getTitle(info.videoDetails)}\``);
      }
    },
  };

  const musicList: DiscordMessageModule<discord.Message> = {
    name: 'DiscordMusicList',
    listener: async (client, message) => {
      if (message.channel.type != discord.ChannelType.GuildVoice) return;
      if (message.author.bot) return;
      const command = message.content.split(' ');
      if (command[0] != 'list') return;

      if (!message.member?.voice.channelId) return;
      if (!message.guildId) return;
      if (!message.guild) return;

      const queue = getConnection(musicQueue, message.guildId);

      if (queue) {
        message.channel.send(queue.info.map((e, i) => `\`${i + 1} ${getTitle(e.videoDetails)}\``).join('\n'));
      }
    },
  };

  const musicSkip: DiscordMessageModule<discord.Message> = {
    name: 'DiscordMusicSkip',
    listener: async (client, message) => {
      if (message.channel.type != discord.ChannelType.GuildVoice) return;
      if (message.author.bot) return;
      const command = message.content.split(' ');
      if (command[0] != 'skip') return;

      if (!message.member?.voice.channelId) return;
      if (!message.guildId) return;
      if (!message.guild) return;

      const key = command[1] ? Number.parseInt(command[1]) : 1;

      const queue = getConnection(musicQueue, message.guildId);

      if (queue) {
        if (key == 1 && queue.state.length > 0) {
          message.channel.send(`\`${getTitle(queue.info[0].videoDetails)}\``);
          const next = queue.pop();
          if (!next) return;
          queue.player.play(next);
        } else if (key == 1 && queue.state.length == 0) {
          queue.destroy();
        } else if (key > 1 && queue.state.length > key - 2) {
          message.channel.send(`\`${getTitle(queue.info[key - 1].videoDetails)}\``);
          queue.remove(key - 2);
        }
      }
    },
  };
  return [music, musicList, musicSkip];
};

const getTime = (l: number): string => {
  const [hour, h] = division(l, 3600);
  const [min, sec] = division(h, 60);
  if (hour == 0) return `${('00' + min).slice(-2)}:${('00' + sec).slice(-2)}`;
  return `${('00' + hour).slice(-2)}:${('00' + min).slice(-2)}:${('00' + sec).slice(-2)}`;
};

const getTitle = (details: ytdl.MoreVideoDetails): string => {
  const time = getTime(Number.parseInt(details.lengthSeconds));
  return `${details.title} (${time})`;
};

const division = (i: number, ii: number): [number, number] => {
  return [Math.floor(i / ii), i % ii];
};

const getConnection = (client: MusicQueue[], guildId: string) => {
  return client.find((e) => e.guildId == guildId);
};
