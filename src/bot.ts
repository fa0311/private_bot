import express from 'express';
import * as discord from 'discord.js';
import * as line from '@line/bot-sdk';
import * as webdav from 'webdav';
import LinePushClient from '@/client/linePush';
import DiscordPushClient from '@/client/discordPush';
import { mainHooks, subHookList } from '@/modules/loader';
import { BotConfig, BotClient } from '@/types/bot';
import log4js from 'log4js';

class Bot {
  config: BotConfig;
  client: BotClient;

  constructor(config: BotConfig) {
    this.config = config;
    this.client = {
      line: new line.Client(this.config.line.args),
      linePush: new LinePushClient(this.config.linePush.token),
      discord: new discord.Client(this.config.discord.args),
      discordPush: new DiscordPushClient(this.config.discordPush.token),
      webdav: webdav.createClient(this.config.webdav.url, this.config.webdav.args),
      logger: log4js.configure(this.config.logger.args).getLogger(this.config.logger.name),
      music: [],
    };
  }

  start() {
    const app: express.Express = express();
    this.client.discord.login(this.config.discord.token);

    app.post(this.config.line.route, line.middleware(this.config.line.args), (req) => {
      req.body.events.map((event: line.WebhookEvent) => this.lineEvent(event));
    });

    app.listen(this.config.line.port, () => {
      mainHooks.lineReadyModule.map((e) =>
        e.listener(this.client, this.config.line.port).catch((error) => this.failureDump(e.name, error)),
      );
    });

    this.client.discord.once(discord.Events.ClientReady, async () => {
      mainHooks.discordReadyModule.map((e) =>
        e.listener(this.client).catch((error) => this.failureDump(e.name, error)),
      );
    });

    this.client.discord.on(discord.Events.MessageCreate, (message) => {
      mainHooks.discordMessageCreateModule.map((e) =>
        e.listener(this.client, message).catch((error) => this.failureDump(e.name, error)),
      );
    });

    this.client.discord.on(discord.Events.VoiceStateUpdate, (before, after) => {
      mainHooks.discordVoiceStateUpdate.map((e) =>
        e.listener(this.client, before, after).catch((error) => this.failureDump(e.name, error)),
      );
    });
  }

  async lineEvent(event: line.WebhookEvent) {
    const hooks = (() => {
      const find = subHookList.find((e) => e.lineCondition(event));
      if (find) return find;
      return mainHooks;
    })();
    const modules = (() => {
      switch (event.type) {
        case 'message':
          return (() => {
            const message = event.message;
            switch (message.type) {
              case 'text':
                return hooks.lineTextMessageEventModule.map((e) => {
                  return e.listener(this.client, event, message).catch((error) => this.failureDump(e.name, error));
                });
              case 'image':
                return hooks.lineImageMessageEventModule.map((e) => {
                  return e.listener(this.client, event, message).catch((error) => this.failureDump(e.name, error));
                });
              case 'video':
                return hooks.lineVideoMessageEventModule.map((e) => {
                  return e.listener(this.client, event, message).catch((error) => this.failureDump(e.name, error));
                });
              case 'audio':
                return hooks.lineAudioMessageEventModule.map((e) => {
                  return e.listener(this.client, event, message).catch((error) => this.failureDump(e.name, error));
                });
              case 'location':
                return hooks.lineLocationMessageEventModule.map((e) => {
                  return e.listener(this.client, event, message).catch((error) => this.failureDump(e.name, error));
                });
              case 'file':
                return hooks.lineFileMessageEventModule.map((e) => {
                  return e.listener(this.client, event, message).catch((error) => this.failureDump(e.name, error));
                });
              case 'sticker':
                return hooks.lineStickerMessageEventModule.map((e) => {
                  return e.listener(this.client, event, message).catch((error) => this.failureDump(e.name, error));
                });
              default:
                return [this.failureDump('system', new Error(`Undefined message type: ${event}`))];
            }
          })();
        case 'unsend':
          return hooks.lineUnsendMessageEventModule.map((e) => {
            return e.listener(this.client, event).catch((error) => this.failureDump(e.name, error));
          });
        case 'follow':
          return hooks.lineFollowMessageEventModule.map((e) => {
            return e.listener(this.client, event).catch((error) => this.failureDump(e.name, error));
          });
        case 'unfollow':
          return hooks.lineUnfollowMessageEventModule.map((e) => {
            return e.listener(this.client, event).catch((error) => this.failureDump(e.name, error));
          });
        case 'join':
          return hooks.lineJoinMessageEventModule.map((e) => {
            return e.listener(this.client, event).catch((error) => this.failureDump(e.name, error));
          });
        case 'leave':
          return hooks.lineLeaveMessageEventModule.map((e) => {
            return e.listener(this.client, event).catch((error) => this.failureDump(e.name, error));
          });
        case 'memberJoined':
          return hooks.lineMemberJoinMessageEventModule.map((e) => {
            return e.listener(this.client, event).catch((error) => this.failureDump(e.name, error));
          });
        case 'memberLeft':
          return hooks.lineMenberLeaveMessageEventModule.map((e) => {
            return e.listener(this.client, event).catch((error) => this.failureDump(e.name, error));
          });
        case 'postback':
          return hooks.linePostBackMessageEventModule.map((e) => {
            return e.listener(this.client, event).catch((error) => this.failureDump(e.name, error));
          });
        case 'videoPlayComplete':
          return hooks.lineVideoEventMessageEventModule.map((e) => {
            return e.listener(this.client, event).catch((error) => this.failureDump(e.name, error));
          });
        case 'beacon':
          return hooks.lineBeaconMessageEventModule.map((e) => {
            return e.listener(this.client, event).catch((error) => this.failureDump(e.name, error));
          });
        case 'accountLink':
          return hooks.lineAccountLinkMessageEventModule.map((e) => {
            return e.listener(this.client, event).catch((error) => this.failureDump(e.name, error));
          });
        case 'things':
          return hooks.lineThingsMessageEventModule.map((e) => {
            return e.listener(this.client, event).catch((error) => this.failureDump(e.name, error));
          });
        default:
          return [this.failureDump('system', new Error(`Undefined message type: ${event}`))];
      }
    })();

    const flatModules = modules.flatMap((e) => (e ? [e] : []));
    const reply = await Promise.all(flatModules).then((module) => module.flatMap((e) => (e ? [e] : [])));
    if (reply.length > 0) {
      const replyToken = (event as line.ReplyableEvent).replyToken;
      await this.client.line.replyMessage(replyToken, reply);
    }
  }

  failureDump = (name: string, error: Error) => {
    const message = [`[${name}]`, error.stack].join('\n');
    this.client.logger.error(message);
  };
}
export default Bot;
