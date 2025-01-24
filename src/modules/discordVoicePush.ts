import type PushClient from '@/client/base';
import type { DiscordStateModule, Klass } from '@/types/modules';
import type * as discord from 'discord.js';

export const discordVoicePush: Klass<PushClient, DiscordStateModule<discord.VoiceState>> = (push) => ({
  name: 'discordVoicePush',
  listener: async (client, before, after) => {
    const member = before.member || after.member;
    if (!member) return;
    if (member.user.bot) return;
    const channel = after.channel ?? before.channel;
    if (!channel) return;
    if (after.channelId == before.channelId) return;
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
    await push.sendList(message);
  },
});
