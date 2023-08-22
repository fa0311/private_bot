import * as discord from 'discord.js';
import * as line from '@line/bot-sdk';
import { BotClient } from '@/types/bot';

type LineThings = line.DeviceLinkEvent | line.DeviceUnlinkEvent | line.LINEThingsScenarioExecutionEvent;

export type HookType = {
  lineReadyModule: ListenExpressModule[];
  lineTextMessageEventModule: LineMessageEventModule<line.TextEventMessage>[];
  lineImageMessageEventModule: LineMessageEventModule<line.ImageEventMessage>[];
  lineVideoMessageEventModule: LineMessageEventModule<line.VideoEventMessage>[];
  lineAudioMessageEventModule: LineMessageEventModule<line.AudioEventMessage>[];
  lineLocationMessageEventModule: LineMessageEventModule<line.LocationEventMessage>[];
  lineFileMessageEventModule: LineMessageEventModule<line.FileEventMessage>[];
  lineStickerMessageEventModule: LineMessageEventModule<line.StickerEventMessage>[];
  lineUnsendMessageEventModule: LineEventModule<line.UnsendEvent>[];
  lineFollowMessageEventModule: LineReplyableEventModule<line.FollowEvent>[];
  lineUnfollowMessageEventModule: LineEventModule<line.UnfollowEvent>[];
  lineJoinMessageEventModule: LineReplyableEventModule<line.JoinEvent>[];
  lineLeaveMessageEventModule: LineEventModule<line.LeaveEvent>[];
  lineMemberJoinMessageEventModule: LineReplyableEventModule<line.MemberJoinEvent>[];
  lineMenberLeaveMessageEventModule: LineEventModule<line.MemberLeaveEvent>[];
  linePostBackMessageEventModule: LineReplyableEventModule<line.PostbackEvent>[];
  lineVideoEventMessageEventModule: LineReplyableEventModule<line.VideoPlayCompleteEvent>[];
  lineBeaconMessageEventModule: LineReplyableEventModule<line.BeaconEvent>[];
  lineAccountLinkMessageEventModule: LineReplyableEventModule<line.AccountLinkEvent>[];
  lineThingsMessageEventModule: LineReplyableEventModule<LineThings>[];
  discordReadyModule: DiscordClientReadyModule[];
  discordMessageCreateModule: DiscordMessageModule<discord.Message>[];
  discordVoiceStateUpdate: DiscordStateModule<discord.VoiceState>[];
};

export type SubHookType = {
  lineCondition: (event: line.WebhookEvent) => boolean;
  lineReadyModule: ListenExpressModule[];
  lineTextMessageEventModule: LineMessageEventModule<line.TextEventMessage>[];
  lineImageMessageEventModule: LineMessageEventModule<line.ImageEventMessage>[];
  lineVideoMessageEventModule: LineMessageEventModule<line.VideoEventMessage>[];
  lineAudioMessageEventModule: LineMessageEventModule<line.AudioEventMessage>[];
  lineLocationMessageEventModule: LineMessageEventModule<line.LocationEventMessage>[];
  lineFileMessageEventModule: LineMessageEventModule<line.FileEventMessage>[];
  lineStickerMessageEventModule: LineMessageEventModule<line.StickerEventMessage>[];
  lineUnsendMessageEventModule: LineEventModule<line.UnsendEvent>[];
  lineFollowMessageEventModule: LineReplyableEventModule<line.FollowEvent>[];
  lineUnfollowMessageEventModule: LineEventModule<line.UnfollowEvent>[];
  lineJoinMessageEventModule: LineReplyableEventModule<line.JoinEvent>[];
  lineLeaveMessageEventModule: LineEventModule<line.LeaveEvent>[];
  lineMemberJoinMessageEventModule: LineReplyableEventModule<line.MemberJoinEvent>[];
  lineMenberLeaveMessageEventModule: LineEventModule<line.MemberLeaveEvent>[];
  linePostBackMessageEventModule: LineReplyableEventModule<line.PostbackEvent>[];
  lineVideoEventMessageEventModule: LineReplyableEventModule<line.VideoPlayCompleteEvent>[];
  lineBeaconMessageEventModule: LineReplyableEventModule<line.BeaconEvent>[];
  lineAccountLinkMessageEventModule: LineReplyableEventModule<line.AccountLinkEvent>[];
  lineThingsMessageEventModule: LineReplyableEventModule<LineThings>[];
};

export type ListenerType<T> = Promise<T | void | false>;

export type ModuleBase = {
  name: string;
};

export type ListenExpressModule = {
  listener: (client: BotClient, port: number) => ListenerType<null>;
} & ModuleBase;

export type LineMessageEventModule<T> = {
  listener: (client: BotClient, event: line.MessageEvent, message: T) => ListenerType<null | line.Message>;
} & ModuleBase;

export type LineReplyableEventModule<T> = {
  listener: (client: BotClient, event: T) => ListenerType<null | line.Message>;
} & ModuleBase;

export type LineEventModule<T> = {
  listener: (client: BotClient, event: T) => ListenerType<null>;
} & ModuleBase;

export type DiscordClientReadyModule = {
  listener: (client: BotClient) => ListenerType<null>;
} & ModuleBase;

export type DiscordMessageModule<T> = {
  listener: (client: BotClient, message: T) => ListenerType<null>;
} & ModuleBase;

export type DiscordStateModule<T> = {
  listener: (client: BotClient, before: T, after: T) => ListenerType<null>;
} & ModuleBase;
