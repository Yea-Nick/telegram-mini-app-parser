import { SocksProxyAgent } from "socks-proxy-agent";
import { IBaseService } from "../service";
import { ProxyInterface } from "telegram/network/connection/TCPMTProxy";
import { Proxy } from "./proxy.model";

export interface IProxyService extends IBaseService {
    testProxy(agent: SocksProxyAgent, ip: string): Promise<void>;
    getSocksProxyAgent(proxy: Proxy): Promise<SocksProxyAgent>;
    getUserBotProxy(proxy: Proxy): ProxyInterface;
}