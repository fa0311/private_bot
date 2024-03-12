import { DiscordClientReadyModule, Klass } from '@/types/modules';

export const serPresence: Klass<{ name: string; url: string }, DiscordClientReadyModule> = ({ name, url }) => ({
  name: 'discordSetPresence',
  listener: async (client) => {
    if (client.discord.user == null) throw Error(`client.user is null`);
    client.discord.user.setPresence({
      status: 'online',
      activities: [
        {
          name: name,
          url: url,
        },
      ],
    });
  },
});
