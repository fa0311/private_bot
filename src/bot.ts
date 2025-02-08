import type { BotClient, BotConfig } from '@/types/bot';
import type { HookFn } from '@/types/modules';
import * as line from '@line/bot-sdk';
import * as discord from 'discord.js';
import express from 'express';
import log4js from 'log4js';

class Bot {
  config: BotConfig;
  client: BotClient;
  hook: HookFn;

  constructor(config: BotConfig, hook: HookFn) {
    this.config = config;
    this.client = {
      line: new line.Client(this.config.line.args),
      discord: new discord.Client(this.config.discord.args),
      logger: log4js.configure(this.config.logger.args).getLogger(this.config.logger.name),
    };
    this.hook = hook;
  }

  start() {
    const app: express.Express = express();
    this.client.discord.login(this.config.discord.token);
    const errorHook = this.failureDump();

    app.post(this.config.line.route, line.middleware(this.config.line.args), (req) => {
      req.body.events.map((event: line.WebhookEvent) => this.lineEvent(event));
    });

    app.listen(this.config.line.port, () => {
      this.hook().lineReadyModule.map((e) =>
        e.listener(this.client, this.config.line.port).catch((error) => errorHook(e.name, error)),
      );
    });

    this.client.discord.once(discord.Events.ClientReady, async () => {
      this.hook().discordReadyModule.map((e) => e.listener(this.client).catch((error) => errorHook(e.name, error)));
    });

    this.client.discord.on(discord.Events.MessageCreate, (message) => {
      const event = message.channel.id;
      this.hook(event).discordMessageCreateModule.map((e) =>
        e.listener(this.client, message).catch((error) => errorHook(e.name, error)),
      );
    });

    this.client.discord.on(discord.Events.VoiceStateUpdate, (before, after) => {
      const event = before.guild.id;
      this.hook(event).discordVoiceStateUpdate.map((e) =>
        e.listener(this.client, before, after).catch((error) => errorHook(e.name, error)),
      );
    });
  }

  getSorceId(event: line.WebhookEvent): string {
    switch (event.source.type) {
      case 'user':
        return event.source.userId;
      case 'group':
        return event.source.groupId;
      case 'room':
        return event.source.roomId;
    }
  }

  async lineEvent(event: line.WebhookEvent) {
    const hooks = this.hook(this.getSorceId(event));
    const errorHook = this.failureDump(hooks.errorHook);
    const modules = (() => {
      switch (event.type) {
        case 'message':
          return (() => {
            const message = event.message;
            switch (message.type) {
              case 'text':
                return hooks.lineTextMessageEventModule.map((e) => {
                  return e.listener(this.client, event, message).catch((error) => errorHook(e.name, error));
                });
              case 'image':
                return hooks.lineImageMessageEventModule.map((e) => {
                  return e.listener(this.client, event, message).catch((error) => errorHook(e.name, error));
                });
              case 'video':
                return hooks.lineVideoMessageEventModule.map((e) => {
                  return e.listener(this.client, event, message).catch((error) => errorHook(e.name, error));
                });
              case 'audio':
                return hooks.lineAudioMessageEventModule.map((e) => {
                  return e.listener(this.client, event, message).catch((error) => errorHook(e.name, error));
                });
              case 'location':
                return hooks.lineLocationMessageEventModule.map((e) => {
                  return e.listener(this.client, event, message).catch((error) => errorHook(e.name, error));
                });
              case 'file':
                return hooks.lineFileMessageEventModule.map((e) => {
                  return e.listener(this.client, event, message).catch((error) => errorHook(e.name, error));
                });
              case 'sticker':
                return hooks.lineStickerMessageEventModule.map((e) => {
                  return e.listener(this.client, event, message).catch((error) => errorHook(e.name, error));
                });
              default:
                return [errorHook('system', new Error(`Undefined message type: ${event}`))];
            }
          })();
        case 'unsend':
          return hooks.lineUnsendMessageEventModule.map((e) => {
            return e.listener(this.client, event).catch((error) => errorHook(e.name, error));
          });
        case 'follow':
          return hooks.lineFollowMessageEventModule.map((e) => {
            return e.listener(this.client, event).catch((error) => errorHook(e.name, error));
          });
        case 'unfollow':
          return hooks.lineUnfollowMessageEventModule.map((e) => {
            return e.listener(this.client, event).catch((error) => errorHook(e.name, error));
          });
        case 'join':
          return hooks.lineJoinMessageEventModule.map((e) => {
            return e.listener(this.client, event).catch((error) => errorHook(e.name, error));
          });
        case 'leave':
          return hooks.lineLeaveMessageEventModule.map((e) => {
            return e.listener(this.client, event).catch((error) => errorHook(e.name, error));
          });
        case 'memberJoined':
          return hooks.lineMemberJoinMessageEventModule.map((e) => {
            return e.listener(this.client, event).catch((error) => errorHook(e.name, error));
          });
        case 'memberLeft':
          return hooks.lineMenberLeaveMessageEventModule.map((e) => {
            return e.listener(this.client, event).catch((error) => errorHook(e.name, error));
          });
        case 'postback':
          return hooks.linePostBackMessageEventModule.map((e) => {
            return e.listener(this.client, event).catch((error) => errorHook(e.name, error));
          });
        case 'videoPlayComplete':
          return hooks.lineVideoEventMessageEventModule.map((e) => {
            return e.listener(this.client, event).catch((error) => errorHook(e.name, error));
          });
        case 'beacon':
          return hooks.lineBeaconMessageEventModule.map((e) => {
            return e.listener(this.client, event).catch((error) => errorHook(e.name, error));
          });
        case 'accountLink':
          return hooks.lineAccountLinkMessageEventModule.map((e) => {
            return e.listener(this.client, event).catch((error) => errorHook(e.name, error));
          });
        case 'things':
          return hooks.lineThingsMessageEventModule.map((e) => {
            return e.listener(this.client, event).catch((error) => errorHook(e.name, error));
          });
        default:
          return [errorHook('system', new Error(`Undefined message type: ${event}`))];
      }
    })();

    const flatModules = modules.flatMap((e) => (e ? [e] : []));
    const reply = await Promise.all(flatModules).then((module) => module.flatMap((e) => (e ? [e] : [])));
    if (reply.length > 0) {
      const replyToken = (event as line.ReplyableEvent).replyToken;
      await this.client.line.replyMessage(replyToken, reply).catch((err) => {
        errorHook('system', err, reply);
      });
    }
  }

  failureDump = (handler?: (message: string) => void) => {
    return (name: string, error: Error, source?: any) => {
      const message = (() => {
        if (source === undefined) {
          return [`[${name}]`, error.stack].join('\n');
        }
        return [`[${name}]`, JSON.stringify(source), error.stack].join('\n');
      })();
      handler && handler(message);
      this.client.logger.error(message);
    };
  };
}
export default Bot;
