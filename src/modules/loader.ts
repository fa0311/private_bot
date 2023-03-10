import { serPresence } from '@/modules/discordSetPresence';
import { lineReady, discordReady } from '@/modules/ready';
import { discordVoicePush } from '@/modules/discordVoicePush';
import { HookType } from '@/types/modules';
import { lineSynchronizeText, lineSynchronizeFile, discordSynchronize } from '@/modules/synchronizeChat';
import { twitterViewer } from '@/modules/twitter';
import { discordMusic, discordMusicList, discordMusicSkip } from '@/modules/discordMusic';
import { webArchive } from '@/modules/webArchive';

const hooks: HookType = {
  lineReadyModule: [lineReady],
  lineTextMessageEventModule: [twitterViewer, lineSynchronizeText, webArchive],
  lineImageMessageEventModule: [lineSynchronizeFile],
  lineVideoMessageEventModule: [lineSynchronizeFile],
  lineAudioMessageEventModule: [lineSynchronizeFile],
  lineLocationMessageEventModule: [],
  lineFileMessageEventModule: [lineSynchronizeFile],
  lineStickerMessageEventModule: [],
  lineUnsendMessageEventModule: [],
  lineFollowMessageEventModule: [],
  lineUnfollowMessageEventModule: [],
  lineJoinMessageEventModule: [],
  lineLeaveMessageEventModule: [],
  lineMemberJoinMessageEventModule: [],
  lineMenberLeaveMessageEventModule: [],
  linePostBackMessageEventModule: [],
  lineVideoEventMessageEventModule: [],
  lineBeaconMessageEventModule: [],
  lineAccountLinkMessageEventModule: [],
  lineThingsMessageEventModule: [],
  discordReadyModule: [discordReady, serPresence],
  discordMessageCreateModule: [discordSynchronize, discordMusic, discordMusicList, discordMusicSkip],
  discordVoiceStateUpdate: [discordVoicePush],
};

export default hooks;
