import { EventEmitter } from "node:events";
import {
  type EventMessage,
  type EventSource,
  type MessageEvent,
  messagingApi,
  middleware,
  type WebhookEvent,
  type WebhookRequestBody,
} from "@line/bot-sdk";
import express from "express";
import type TypedEmitter from "typed-emitter";
import type { SafeMerge } from "./utils";

const hasContentsType = ["image", "video", "audio", "file"] as const;

type WebhookEventCallbackType = {
  [M in WebhookEvent["type"]]: (body: { body: Extract<WebhookEvent, { type: M }> }) => void;
};

type EventMessageCallbackType = {
  [M in EventMessage["type"]]: (body: { body: MessageEvent; event: Extract<EventMessage, { type: M }> }) => void;
};

type DefinedCallbackType = {
  hasContents: (body: {
    body: MessageEvent;
    event: Extract<EventMessage, { type: (typeof hasContentsType)[number] }>;
  }) => void;
  all: (body: { body: WebhookEvent }) => void;
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

export const createLineClient = async (config: ConfigType, expressConfig: { port: number; route: string }) => {
  const app = express();
  const client = new EventEmitter({
    captureRejections: true,
  }) as EmitterTypes;
  const api = new messagingApi.MessagingApiClient(config);
  const blob = new messagingApi.MessagingApiBlobClient(config);

  app.post(expressConfig.route, middleware(config), (req) => {
    const body = req.body as WebhookRequestBody;

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

  const getProfile = async (source: EventSource) => {
    switch (source.type) {
      case "user":
        return api.getProfile(source.userId);
      case "group":
        if (source.userId == null) {
          throw new Error("No userId");
        } else {
          return api.getGroupMemberProfile(source.groupId, source.userId);
        }
      case "room":
        if (source.userId == null) {
          throw new Error("No userId");
        } else {
          return api.getRoomMemberProfile(source.roomId, source.userId);
        }
    }
  };

  return { client, api, blob, getProfile };
};

export const getSourceId = (event: WebhookEvent): string => {
  switch (event.source.type) {
    case "user":
      return event.source.userId;
    case "group":
      return event.source.groupId;
    case "room":
      return event.source.roomId;
  }
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
