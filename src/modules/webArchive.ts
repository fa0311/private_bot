import * as line from '@line/bot-sdk';
import { LineMessageEventModule } from '@/types/modules';
import 'dayjs/locale/ja';
import Archivebox from '@/utils/archivebox';

export const webArchive: LineMessageEventModule<line.TextEventMessage> = {
  name: 'WebArchive',
  listener: async (client, event, message) => {
    const command = message.text.split(' ');
    if (command[0] != 'archive') return;
    const archivebox = new Archivebox('https://xn--l8jeu7orz.xn--w8j2f.com/add/');
    await archivebox.getToken();
    (await archivebox.addUrl(command.slice(1), ['bot'])).get();
  },
};

export const allWebArchive: LineMessageEventModule<line.TextEventMessage> = {
  name: 'AllWebArchive',
  listener: async (client, event, message) => {
    const command = message.text.split(/[\s\n]+/);
    const url = command.filter((e) => e.match(/^https?:\/\//));
    if (url.length == 0) return;
    const archivebox = new Archivebox('https://xn--l8jeu7orz.xn--w8j2f.com/add/');
    await archivebox.getToken();
    (await archivebox.addUrl(url, ['bot'])).get();
    return {
      type: 'text',
      text: 'アーカイブしました',
    };
  },
};
