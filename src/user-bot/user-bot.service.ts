import { BaseService } from "../service";
import { Api, TelegramClient } from "telegram";
import { IProxyService, ProxyService } from "../proxy";
import { IUserBotService, UserBot, UserData } from ".";
import { validateOrReject } from "class-validator";
import { plainToInstance } from "class-transformer";
import { StringSession } from 'telegram/sessions';
import { IRequesterService } from "../requester";

export class UserBotService extends BaseService implements IUserBotService {
    private readonly CONNECTION_RETRIES = 5;

    private readonly connectedUserBots: Map<string, TelegramClient> = new Map();

    private readonly proxyService: IProxyService;

    constructor(
        private readonly userBots: UserBot[],
        requesterService: IRequesterService
    ) {
        super(UserBotService.name);
        this.proxyService = new ProxyService(requesterService);
    }

    async init() {
        try {
            await this.proxyService.init();
            const validated = await this.validateUserBots(this.userBots);

            for (const userBot of validated) {
                await this.proxyService.testProxy(await this.proxyService.getSocksProxyAgent(userBot.proxy), userBot.proxy.ip);
                await this.connectClient(userBot);
            }

            this.logInfo(`Service is initialized`);
        } catch (err) {
            this.logAndThrowError(`Initialization | ${err}`);
        }
    }

    private async validateUserBots(userBots: UserBot[]) {
        try {
            for (const userBot of this.userBots) {
                const instance = plainToInstance(UserBot, userBot);
                await validateOrReject(instance);
            }

            return userBots;
        } catch (err) {
            this.logAndThrowError(`Validate user-bots | ${err}`);
        }
    }

    private async connectClient({ username, stringSession, apiId, apiHash, proxy }: UserBot) {
        try {
            const client = new TelegramClient(new StringSession(stringSession), apiId, apiHash, {
                connectionRetries: this.CONNECTION_RETRIES,
                proxy: this.proxyService.getUserBotProxy(proxy)
            });

            await client.connect();
            const isAuthorized = await client.checkAuthorization();
            if (!isAuthorized) throw new Error(`User-bot is not authorized`);

            this.connectedUserBots.set(username, client);

            this.logInfo(`Connect client | User-bot: ${username} | Success`);
        } catch (err) {
            this.logAndThrowError(`Connect client | User-bot: ${username} | ${err}`);
        }
    }

    getConnectedUserBots() {
        const usernames = [];
        for (const key of this.connectedUserBots.keys()) {
            usernames.push(key);
        }
        this.logVerbose(`Connected user-bots: ${usernames}`);
        return usernames;
    }

    async getMiniAppLaunchParams(userBotUsername: string, botUsername: string, miniAppBaseURL: string) {     //e.g. "username_bot" (without @)
        try {
            const client = this.connectedUserBots.get(userBotUsername);
            if (!client) throw new Error(`No connected user-bot with this username: ${userBotUsername}`);

            const botEntity = await client.getEntity(botUsername);

            const result = await client.invoke(
                new Api.messages.RequestWebView({
                    peer: botEntity,
                    bot: botEntity,
                    platform: 'web', // or 'web', 'ios'
                    fromBotMenu: true,
                    url: miniAppBaseURL
                })
            );

            const launchParams = new URL(result.url).hash.split('#tgWebAppData=')[1];
            const searchParams = new URLSearchParams(launchParams);

            let initData: string | null = null;
            for (const key of searchParams.keys()) {
                if (key.startsWith('query_id')) {
                    initData = key;
                    break;
                }
            }

            if (!initData) throw new Error(`No initData`);

            const userDataStr = new URLSearchParams(initData).get('user');
            if (!userDataStr) throw new Error(`No userData`);

            const userData: UserData = JSON.parse(userDataStr);

            this.logDebug(`Get Mini App launch params | User-bot: ${userData.username} | Success`);

            return { initData, userData };
        } catch (err) {
            this.logAndThrowError(`Get Mini App launch params | User-bot: ${userBotUsername} | ${err}`);
        }
    }

    async getSocksProxyAgentByUsername(username: string) {
        try {
            const userBot = this.userBots.find(userBot => userBot.username === username);
            if (!userBot) throw new Error(`No user-bot found by username: ${username}`);

            return await this.proxyService.getSocksProxyAgent(userBot.proxy);
        } catch (err) {
            this.logAndThrowError(`Get SOCKS proxy agent: ${err}`);
        }
    }
}