import { Client, type ClientOptions, Events } from "discord.js";

export const createDiscordClient = async (options: ClientOptions, token: string) => {
  const client = new Client(options);
  await client.login(token);
  await new Promise<void>((resolve) => {
    client.once(Events.ClientReady, () => {
      resolve();
    });
  });

  return { client };
};

export const getUrl = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch sticker");
  }

  return response.arrayBuffer();
};
