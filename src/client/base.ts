import { AxiosResponse } from 'axios';
import { Result } from '@/utils/result';

abstract class PushClient {
  sendList(message: unknown[], user?: string, user_image?: string): Promise<Result<AxiosResponse, Error>> {
    return this.send(message.filter((e: unknown) => e).join('\n'), user, user_image);
  }

  abstract send(message?: string, user?: string, user_image?: string): Promise<Result<AxiosResponse, Error>>;
}

export default PushClient;
