import { EventEmitter } from "node:events";
import { messagingApi, middleware, type webhook } from "@line/bot-sdk";
import type core from "express";
import express from "express";
import type TypedEmitter from "typed-emitter";
import type { SafeMerge } from "./utils";

const hasContentsType = ["image", "video", "audio", "file"] as const;

type WebhookEventCallbackType = {
  [M in webhook.Event["type"]]: (body: { body: Extract<webhook.Event, { type: M }> }) => void;
};

type EventMessageCallbackType = {
  [M in webhook.MessageContent["type"]]: (body: {
    body: webhook.MessageEvent;
    event: Extract<webhook.MessageContent, { type: M }>;
  }) => void;
};

type DefinedCallbackType = {
  hasContents: (body: {
    body: webhook.MessageEvent;
    event: Extract<webhook.MessageContent, { type: (typeof hasContentsType)[number] }>;
  }) => void;
  all: (body: { body: webhook.Event }) => void;
  error: (error: Error) => void;
};

type EmitTypeError = "Duplicate keys found, try line/bot-sdk downgrade";

type Merge1 = SafeMerge<WebhookEventCallbackType, EventMessageCallbackType, EmitTypeError>;
type Merge2 = SafeMerge<Merge1, DefinedCallbackType, EmitTypeError>;
type EmitterTypes = TypedEmitter<Merge2>;

type ConfigType = {
  channelAccessToken: string;
  channelSecret: string;
};

export type LineClient = {
  client: EmitterTypes;
  app: core.Express;
  api: messagingApi.MessagingApiClient;
  blob: messagingApi.MessagingApiBlobClient;
  getProfile: (source?: webhook.Source) => Promise<messagingApi.GroupUserProfileResponse>;
};

export const createLineClient = async (
  config: ConfigType,
  expressConfig: { port: number; route: string },
): Promise<LineClient> => {
  const app = express();
  const client = new EventEmitter({
    captureRejections: true,
  }) as EmitterTypes;
  const api = new messagingApi.MessagingApiClient(config);
  const blob = new messagingApi.MessagingApiBlobClient(config);

  app.post(expressConfig.route, middleware(config), (req) => {
    const body = req.body as webhook.CallbackRequest;

    for (const event of body.events) {
      client.emit("all", { body: event });
      client.emit(event.type, { body: event as any });
      if (event.type === "message") {
        client.emit(event.message.type, { body: event as any, event: event.message as any });
        if (hasContentsType.includes(event.message.type as (typeof hasContentsType)[number])) {
          client.emit("hasContents", { body: event as any, event: event.message as any });
        }
      }
    }
  });

  await new Promise<void>((resolve) => {
    app.listen(expressConfig.port, () => resolve());
  });

  const getProfile = async (source?: webhook.Source) => {
    if (source?.userId == null) {
      throw new Error("No userId");
    }
    switch (source.type) {
      case "user":
        return api.getProfile(source.userId);
      case "group":
        return api.getGroupMemberProfile(source.groupId, source.userId);
      case "room":
        return api.getRoomMemberProfile(source.roomId, source.userId);
    }
  };

  return { client, app, api, blob, getProfile };
};

export const getSourceId = (event: webhook.Event): string => {
  const source = event.source;
  const id = source?.type === "group" ? source.groupId : source?.type === "room" ? source.roomId : source?.userId;
  if (id == null) {
    throw new Error("No source id");
  }
  return id;
};

type QuotedEventMessage = {
  id: string;
  quotedMessageId?: string;
};

export const lineQuotedMessageManager = <T>() => {
  const lineMesageCache = new Map<string, T>();

  const get = (event: QuotedEventMessage) => {
    if (event.quotedMessageId == null) {
      return undefined;
    }
    return {
      data: lineMesageCache.get(event.quotedMessageId),
    };
  };

  const set = (event: QuotedEventMessage, value: T) => {
    lineMesageCache.set(event.id, value);
  };

  return { get, set };
};
