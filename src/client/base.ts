import { AxiosResponse } from "axios";
import { Result, Success, Failure } from "src/utils/result";

abstract class PushClient {
  sendList(
    message: any,
    user?: string,
    user_image?: string
  ): Promise<Result<AxiosResponse, Error>> {
    return this.send(message.filter((e: any) => e).join("\n"), user, user_image);
  }

  abstract send(
    message?: string,
    user?: string,
    user_image?: string
  ): Promise<Result<AxiosResponse, Error>>;
}

export default PushClient;
