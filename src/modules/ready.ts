import { ListenExpressModule, DiscordClientReadyModule } from "src/types/modules";

export const lineReady: ListenExpressModule = {
  name: "lineReady",
  listener: async (client, port) => {
    client.logger.info(`listen ${port}`);
  },
};

export const discordReady: DiscordClientReadyModule = {
  name: "discordReady",
  listener: async (client) => {
    client.logger.info("discord ready");
  },
};
