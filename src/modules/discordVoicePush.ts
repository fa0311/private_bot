import * as discord from "discord.js";
import { DiscordStateModule } from "src/types/modules";

export const discordVoicePush: DiscordStateModule<discord.VoiceState> = {
  name: "discordVoicePush",
  listener: async (client, before, after) => {
    const member = before.member || after.member!;
    if (after.channel && before.channel) return;
    const message = (() => {
      if (before.channel) {
        return [
          before.channel.members.filter((e) => !e.user.bot).size == 0 && "[通話が終了しました]",
          `${member.user.tag}が${before.channel.name}から退出しました`,
        ];
      } else if (after.channel) {
        return [
          after.channel.members.filter((e) => !e.user.bot).size == 1 && "[通話が開始しました]",
          `${member.user.tag}が${after.channel.name}に参加しました`,
        ];
      }
    })();
    const list = [client.linePush, client.discordPush].map((e) => e.sendList(message));
    (await Promise.all(list)).map((e) => e.get());
  },
};
