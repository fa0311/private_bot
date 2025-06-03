import type PushClient from '@/client/base';
import type { DiscordMessageModule, Klass, LineMessageEventModule } from '@/types/modules';
import download from '@/utils/download';
import { getLineProfile } from '@/utils/line';
import { streamToBuffer } from '@/utils/webdav';
import type * as line from '@line/bot-sdk';
import 'dayjs/locale/ja';
import * as discord from 'discord.js';

const lineMesageCache = new Map<string, string>();

export const lineSynchronizeText: Klass<PushClient, LineMessageEventModule<line.TextEventMessage>> = (push) => ({
  name: 'LineSynchronizeText',
  listener: async (client, event, message) => {
    const profile = (await getLineProfile(client.line, event.source)).get();
    const escape = (text: string) => text.split('\n').join('\n> ');
    lineMesageCache.set(message.id, `> ${profile.displayName}: ${escape(message.text)}`);
    if (message.quotedMessageId && lineMesageCache.has(message.quotedMessageId)) {
      const quotedText = lineMesageCache.get(message.quotedMessageId);
      (await push.send(`${quotedText}\n${message.text}`, profile.displayName, profile.pictureUrl)).get();
    } else if (message.quotedMessageId) {
      const text = `> 不明なメッセージ\n${message.text}`;
      (await push.send(text, profile.displayName, profile.pictureUrl)).get();
    } else {
      (await push.send(message.text, profile.displayName, profile.pictureUrl)).get();
    }
  },
});

type ContentType = line.ImageEventMessage | line.VideoEventMessage | line.AudioEventMessage | line.FileEventMessage;

export const lineSynchronizeFile: Klass<PushClient, LineMessageEventModule<ContentType>> = (push) => ({
  name: 'LineSynchronizeFile',
  listener: async (client, event, message) => {
    const extension = (() => {
      switch (message.type) {
        case 'image':
          return 'jpg';
        case 'audio':
          return 'mp3';
        case 'video':
          return 'mp4';
        case 'file':
          return message.fileName.split('.').slice(-1)[0];
      }
    })();

    const stream = await client.line.getMessageContent(message.id);
    const contents = await streamToBuffer(stream);
    const profile = (await getLineProfile(client.line, event.source)).get();
    await push.sendFile(`${message.id}.${extension}`, contents, '', profile.displayName, profile.pictureUrl);
  },
});

export const lineSynchronizeSticker: Klass<PushClient, LineMessageEventModule<line.StickerEventMessage>> = (push) => ({
  name: 'LineSynchronizeSticker',
  listener: async (client, event, message) => {
    const url = `https://stickershop.line-scdn.net/stickershop/v1/sticker/${message.stickerId}/android/sticker.png`;
    const results = await download(url);
    const buffer = results.get();
    const profile = (await getLineProfile(client.line, event.source)).get();
    await push.sendFile(
      `${message.stickerId}.png`,
      buffer,
      message.keywords?.join(','),
      profile.displayName,
      profile.pictureUrl,
    );
  },
});

export const discordSynchronize: Klass<PushClient, DiscordMessageModule<discord.Message>> = (push) => ({
  name: 'DiscordSynchronize',
  listener: async (client, message) => {
    if (message.author.bot) return;

    const getExtension = (e: string | null) => {
      if (!e) return '';
      if (e.split('.').length == 1) return '';
      return '.' + e.split('.').slice(-1)[0];
    };

    if (message.content != '') {
      const auther = message.author.username;
      if (message.reference && message.reference.messageId) {
        const ref = await message.channel.messages.fetch(message.reference.messageId);
        const escape = (text: string) => text.split('\n').join('\n> ');
        const text = `${escape(ref.author.username)}>>${escape(ref.content)}\n[返信]${message.author.username}>>${message.content}`;
        await push.send(text);
      } else {
        await push.send(message.content, auther);
      }
    }

    const res = message.attachments.map(async (e) => {
      const results = await download(e.proxyURL);
      const buffer = results.get();
      const name = e.id + getExtension(e.name);
      const auther = message.author.username;
      const promise = push.sendFile(name, buffer, message.content, auther);
      if ('send' in message.channel && typeof message.channel.send === 'function') {
        const button1 = new discord.ButtonBuilder()
          .setCustomId(`resend:${message.id}`)
          .setEmoji('🔁')
          .setLabel('再送信')
          .setStyle(discord.ButtonStyle.Primary);

        const button2 = new discord.ButtonBuilder()
          .setCustomId(`url:${message.id}`)
          .setEmoji('🔗')
          .setLabel('URLとして送信')
          .setStyle(discord.ButtonStyle.Secondary);

        const row = new discord.ActionRowBuilder().addComponents(button1, button2);

        const msg = await message.reply({
          components: [row.toJSON()],
        });
        const controller = msg.createMessageComponentCollector({
          componentType: discord.ComponentType.Button,
          time: 60 * 1000,
        });
        controller.on('collect', async (i) => {
          if (i.customId === `resend:${message.id}`) {
            await push.sendFile(name, buffer, message.content, auther);
            await i.reply({ content: '再送信しました。', ephemeral: true });
          } else if (i.customId === `url:${message.id}`) {
            const url = await push.putFile(name, buffer);
            await push.send(url, auther);
            await i.reply({ content: 'URLを送信しました。', ephemeral: true });
          }
        });
        controller.on('end', async () => {
          await msg.delete();
        });
      }
      await promise;
    });

    await Promise.all(res);
  },
});
