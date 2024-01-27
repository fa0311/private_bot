import * as discord from 'discord.js';
import { DiscordStateModule } from '@/types/modules';

export const discordVoicePush: DiscordStateModule<discord.VoiceState> = {
  name: 'discordVoicePush',
  listener: async (client, before, after) => {
    const member = before.member || after.member;
    if (!member) return;
    if (member.user.bot) return;
    const channel = after.channel ?? before.channel;
    if (!channel) return;
    if(after.channelId == before.channelId) return;
    const members = channel.members.filter((e) => !e.user.bot);

    const message = (() => {
      if (before.channel && after.channel) {
        return [`${member.user.tag}が${before.channel.name}から${after.channel.name}に移動しました`];
      } else if (before.channel) {
        return [
          members.size == 0 && '[通話が終了しました]',
          `${member.user.tag}が${before.channel.name}から退出しました`,
        ];
      } else if (after.channel) {
        return [members.size == 1 && '[通話が開始しました]', `${member.user.tag}が${after.channel.name}に参加しました`];
      }
    })();
    if (!message) return;
    const list = [client.linePush, client.discordPush].map((e) => e.sendList(message));
    (await Promise.all(list)).map((e) => e.get());
  },
};
