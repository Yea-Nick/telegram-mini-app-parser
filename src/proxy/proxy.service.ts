import { BaseService } from "../service";
import { ProxyInterface } from "telegram/network/connection/TCPMTProxy";
import { SocksProxyAgent } from "socks-proxy-agent";
import { Proxy, IProxyService } from ".";
import { IpifyResponse, IRequesterService } from "../requester";

export class ProxyService extends BaseService implements IProxyService {
    private readonly TEST_URL = `https://api.ipify.org?format=json`;

    constructor(
        private readonly requesterService: IRequesterService
    ) {
        super(ProxyService.name);
    }

    async testProxy(agent: SocksProxyAgent, proxyIp: string) {
        try {
            const { ip } = await this.requesterService.sendApiRequest<IpifyResponse>(this.TEST_URL, { agent });

            if (ip !== proxyIp) throw new Error(`Invalid response IP: ${ip}`);

            this.logDebug(`Test proxy | Proxy IP: ${proxyIp} | Response IP: ${ip} | Success`);
        } catch (err) {
            this.logAndThrowError(`Test proxy | Proxy IP: ${proxyIp} | ${err}`);
        }
    }

    async getSocksProxyAgent(proxy: Proxy) {
        try {
            const { username, password, ip, port } = proxy;
            return new SocksProxyAgent(`socks://${username}:${password}@${ip}:${port}`);;
        } catch (err) {
            this.logAndThrowError(`Get SOCKS proxy agent: ${err}`);
        }
    }

    getUserBotProxy({ ip, port, username, password }: Proxy): ProxyInterface {
        return {
            ip,
            port: parseInt(port),
            timeout: 2, // Timeout (in seconds) for connection
            username,
            password,
            socksType: 5
        };
    }
}