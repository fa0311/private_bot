import { Klass, LineMessageEventModule } from '@/types/modules';
import Archivebox from '@/utils/archivebox';
import * as line from '@line/bot-sdk';
import 'dayjs/locale/ja';

export const webArchive: Klass<Archivebox, LineMessageEventModule<line.TextEventMessage>> = (archivebox) => ({
  name: 'WebArchive',
  listener: async (client, event, message) => {
    const command = message.text.split(' ');
    if (command[0] != 'archive') return;
    await archivebox.getToken();
    (await archivebox.addUrl(command.slice(1), ['bot'])).get();
  },
});

export const allWebArchive: Klass<Archivebox, LineMessageEventModule<line.TextEventMessage>> = (archivebox) => ({
  name: 'AllWebArchive',
  listener: async (client, event, message) => {
    const command = message.text.split(/[\s\n]+/);
    const url = command.filter((e) => e.match(/^https?:\/\//));
    if (url.length == 0) return;
    await archivebox.getToken();
    (await archivebox.addUrl(url, ['bot'])).get();
    return {
      type: 'text',
      text: 'アーカイブしました',
    };
  },
});
