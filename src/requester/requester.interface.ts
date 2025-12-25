import { IBaseService } from "../service";
import { ApiRequestOptions } from ".";

export interface IRequesterService extends IBaseService {
    sendApiRequest<T>(url: string, options: ApiRequestOptions): Promise<T>;
}