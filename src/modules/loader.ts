import { serPresence } from "src/modules/discordSetPresence";
import { lineReady, discordReady } from "src/modules/ready";
import { discordVoicePush } from "src/modules/discordVoicePush";
import { HookType } from "src/types/modules";
import {
  lineSynchronizeText,
  lineSynchronizeFile,
  discordSynchronize,
} from "src/modules/synchronizeChat";
import { twitterViewer } from "src/modules/twitter";
import { discordMusic, discordMusicList, discordMusicSkip } from "src/modules/discordMusic";

const hooks: HookType = {
  lineReadyModule: [lineReady],
  lineTextMessageEventModule: [twitterViewer, lineSynchronizeText],
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
  discordMessageCreateModule: [
    discordSynchronize,
    discordMusic,
    discordMusicList,
    discordMusicSkip,
  ],
  discordVoiceStateUpdate: [discordVoicePush],
};

export default hooks;
