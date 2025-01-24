import { Failure, type Result, Success } from '@/utils/result';
import type * as line from '@line/bot-sdk';

export const getLineProfile = async (
  client: line.Client,
  source: line.EventSource,
): Promise<Result<line.Profile, Error>> => {
  if (!source.userId) return new Failure(new Error('userId not found'));

  return (() => {
    switch (source.type) {
      case 'user':
        return client.getProfile(source.userId);
      case 'group':
        return client.getGroupMemberProfile(source.groupId, source.userId);
      case 'room':
        return client.getRoomMemberProfile(source.roomId, source.userId);
    }
  })()
    .then((e) => new Success(e))
    .catch((e) => new Failure(new Error(e)));
};
