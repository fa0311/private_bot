import type { LineMessageEventModule } from '@/types/modules';
import type * as line from '@line/bot-sdk';
import 'dayjs/locale/ja';

export const dumpEvent: LineMessageEventModule<line.TextEventMessage> = {
  name: 'dumpEvent',
  listener: async (client, event, message) => {
    const command = message.text.split(' ');
    if (command[0] != 'dump') return;
    return {
      type: 'text',
      text: JSON.stringify(event),
    };
  },
};
