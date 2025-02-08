import type PushClient from '@/client/base';
import type { DiscordClientReadyModule, Klass, ListenExpressModule } from '@/types/modules';

export const lineReady: ListenExpressModule = {
  name: 'lineReady',
  listener: async (client, port) => {
    client.logger.info(`listen ${port}`);
  },
};

export const discordReady: DiscordClientReadyModule = {
  name: 'discordReady',
  listener: async (client) => {
    client.logger.info('discord ready');
  },
};

export const lineReadyToLine: Klass<PushClient, ListenExpressModule> = (push) => ({
  name: 'lineReadyToLine',
  listener: async (client, port) => {
    push.send('ready');
  },
});
