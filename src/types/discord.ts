import type * as discord from 'discord.js';

export type SendChannnel =
  | discord.DMChannel
  | discord.PartialDMChannel
  | discord.NewsChannel
  | discord.TextChannel
  | discord.AnyThreadChannel
  | discord.VoiceChannel;
