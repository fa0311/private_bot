import * as env from "src/utils/env";
import { DiscordClientReadyModule } from "src/types/modules";
import { Failure } from "src/utils/result";

export const serPresence: DiscordClientReadyModule = {
  name: "discordSetPresence",
  listener: async (client) => {
    if (client.discord.user == null) throw Error(`client.user is null`);
    client.discord.user.setPresence({
      status: "online",
      activities: [
        {
          name: env.getString("DISCORD_SET_PRESENCE.ACTIVITIES_NAME"),
          url: env.getString("DISCORD_SET_PRESENCE.ACTIVITIES_URL"),
        },
      ],
    });
  },
};
