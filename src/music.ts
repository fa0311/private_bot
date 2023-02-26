import * as voice from '@discordjs/voice';
import { Logger } from 'log4js';
import ytdl from 'ytdl-core';

class MusicQueue {
  connection: voice.VoiceConnection;
  state: voice.AudioResource[] = [];
  info: ytdl.videoInfo[] = [];
  guildId: string;
  logger: Logger;
  player = voice.createAudioPlayer({
    behaviors: {
      noSubscriber: voice.NoSubscriberBehavior.Pause,
    },
  });

  constructor(guildId: string, connection: voice.VoiceConnection, logger: Logger) {
    this.connection = connection;
    this.connection.subscribe(this.player);
    this.guildId = guildId;
    this.logger = logger;
  }

  start(resource: voice.AudioResource) {
    this.player.on(voice.AudioPlayerStatus.Idle, () => {
      const next = this.pop();
      if (!next) return this.destroy();
      this.player.play(next);
    });

    resource.playStream.on('error', (error) => {
      this.logger.warn(error.stack);
    });

    this.player.play(resource);
  }

  push(resorce: voice.AudioResource) {
    this.state.push(resorce);
  }
  pop() {
    this.info.pop();
    return this.state.pop();
  }

  remove(key: number) {
    this.info.splice(key + 1, 1);
    this.state.splice(key, 1);
  }

  destroy() {
    this.info = [];
    this.state = [];
    this.connection.destroy();
  }
}
export default MusicQueue;
