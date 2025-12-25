import fetch from "node-fetch";
import { BaseService } from "../service";
import { ApiRequestOptions, IRequesterService } from ".";

export class RequesterService extends BaseService implements IRequesterService {
    private readonly MAX_RETRIES = 3;
    private readonly REQUEST_TIMEOUT = 1500;

    constructor() { super(RequesterService.name); }

    async sendApiRequest<T>(url: string, options: ApiRequestOptions): Promise<T> {
        try {
            let res: T | null;
            let retry = 0;

            do {
                res = await this.makeRequest<T>(url, options).catch(_ => null);
                ++retry;
                !res && await new Promise(res => setTimeout(res, this.REQUEST_TIMEOUT));
            } while (!res && (retry < this.MAX_RETRIES));

            if (!res) throw new Error(`Could not succeed in making requests`);

            return res;
        } catch (err) {
            this.logAndThrowError(`Send API request | ${err}`);
        }
    }

    private async makeRequest<T>(url: string, options: ApiRequestOptions): Promise<T> {
        try {
            const res = await fetch(url, options).then(res => res.json());

            return res as T;
        } catch (err) {
            this.logAndThrowError(`Make request | ${err}`);
        }
    }
}

