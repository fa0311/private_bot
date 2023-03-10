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
