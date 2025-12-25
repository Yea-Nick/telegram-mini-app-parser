import { IBaseService } from "../service";
import { MiniAppLaunchParams } from ".";
import { SocksProxyAgent } from "socks-proxy-agent";

export interface IUserBotService extends IBaseService {
    getMiniAppLaunchParams(userBotUsername: string, botUsername: string, miniAppBaseURL: string): Promise<MiniAppLaunchParams>;
    getConnectedUserBots(): string[];
    getSocksProxyAgentByUsername(username: string): Promise<SocksProxyAgent>;
}