export type WebHookOptions = {
  token: string;
  baseUrl: string;
};

export const createDiscordWebHookClient = (webHookOptions: WebHookOptions) => {
  const { token, baseUrl } = webHookOptions;

  const send = async (body: { content?: string; username?: string; avatar_url?: string }) => {
    const response = await fetch(`${baseUrl}/${token}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(`Failed to send message: ${response.status} ${response.statusText}`);
    }
  };

  return { send };
};
