import { Proxy } from "../proxy";

export class UserBot {
    readonly stringSession: string;

    readonly apiId: number;

    readonly apiHash: string;

    readonly username: string;

    readonly proxy: Proxy;
}