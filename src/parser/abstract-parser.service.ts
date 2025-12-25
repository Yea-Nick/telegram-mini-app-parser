import { HeadersInit } from "node-fetch";
import { SocksProxyAgent } from "socks-proxy-agent";
import { BaseService } from "../service";
import { IUserBotService, UserBot, UserBotService, UserData } from "../user-bot";
import { ITelegramMiniAppParser, TelegramMiniAppParserOptions, UserBotData } from ".";
import { IRequesterService, RequestMethod, ApiRequestOptions, RequesterService } from "../requester";

export abstract class TelegramMiniAppParser<AuthTokenPayload, AuthTokenResponse, WorkerResponse> extends BaseService implements ITelegramMiniAppParser<WorkerResponse> {
    private readonly DEFAULT_USER_BOT_DATA_EXPIRATION_TIME = 55 * 60 * 1000;

    private userBotsData: UserBotData[];

    private launchParserTimeout: NodeJS.Timeout;

    private readonly BOT_USERNAME: string;
    private readonly AUTH_ENDPOINT: string;
    private readonly WORKER_TIMEOUT: false | number | (() => number);
    private readonly USER_BOT_DATA_EXPIRATION_TIME: number;

    protected readonly AUTH_REFERER_HEADER: string;
    protected readonly APP_BASE_URL: string;

    protected readonly requesterService: IRequesterService;

    private readonly userBotService: IUserBotService;

    constructor(userBots: UserBot[], parserName: string, options: TelegramMiniAppParserOptions) {
        super(parserName);
        const { botUsername, appBaseUrl, authEndpoint, authRefererHeader, workerTimeout, userBotDataExpirationTime } = options;
        this.BOT_USERNAME = botUsername;
        this.APP_BASE_URL = appBaseUrl;
        this.AUTH_ENDPOINT = authEndpoint;
        this.AUTH_REFERER_HEADER = authRefererHeader;
        this.WORKER_TIMEOUT = workerTimeout;
        this.USER_BOT_DATA_EXPIRATION_TIME = userBotDataExpirationTime ? userBotDataExpirationTime : this.DEFAULT_USER_BOT_DATA_EXPIRATION_TIME;
        this.requesterService = new RequesterService();
        this.userBotService = new UserBotService(userBots, this.requesterService);
    }

    async init() {
        try {
            await this.requesterService.init();
            await this.userBotService.init();

            this.userBotsData = this.userBotService.getConnectedUserBots().map(username => ({ username, authToken: '', initData: '' }));

            const res = await this.initParser();

            this.logInfo(`Service is initialized`);
            return res;
        } catch (err) {
            this.logAndThrowError(`Initialization | ${err}`);
        }
    }

    private async initParser() {
        if (this.WORKER_TIMEOUT === false) {
            this.logInfo(`Service is initialized`);
            return this.parse.bind(this);
        };

        if (typeof this.WORKER_TIMEOUT === 'number' || typeof this.WORKER_TIMEOUT === 'function') {
            this.launchParser();
            return;
        }

        throw new Error(`Incorrect worker timeout type: ${typeof this.WORKER_TIMEOUT}`);
    }

    private async launchParser() {
        try {
            await this.parse();

            if (typeof this.WORKER_TIMEOUT === 'number') {
                this.launchParserTimeout = setTimeout(this.launchParser.bind(this), this.WORKER_TIMEOUT);
                return;
            }

            if (typeof this.WORKER_TIMEOUT === 'function') {
                this.launchParserTimeout = setTimeout(this.launchParser.bind(this), this.WORKER_TIMEOUT());
                return;
            }
        } catch (err) {
            this.logError(`Launch parser | ${err}`);
        }
    }

    private async parse<WorkerParams extends Array<any>>(...workerParams: WorkerParams) {
        const userBotData = this.getUserBotData();
        try {
            if (!userBotData) throw new Error(`No user-bot data`);
            const proxyAgent = await this.userBotService.getSocksProxyAgentByUsername(userBotData.username);

            if (!userBotData.authToken || !userBotData.initData) {
                const { initData, userData } = await this.userBotService.getMiniAppLaunchParams(userBotData.username, this.BOT_USERNAME, this.APP_BASE_URL);
                const authTokenResponse = await this.getAuthToken(initData, userData, proxyAgent);
                const authToken = await this.extractAuthToken(authTokenResponse);

                userBotData.authToken = authToken;
                userBotData.initData = initData;
                this.userBotDataExpirationTimer(userBotData);
            }

            //Copy user-bot data, otherwise authToken+initData may expire while creating and sending requests
            const reqAuthToken = userBotData.authToken;
            const reqInitData = userBotData.initData;

            const res = await this.worker<WorkerParams>(reqAuthToken, reqInitData, proxyAgent, ...workerParams);

            this.logInfo(`Parsing | Worker finished its job`);
            return res;
        } catch (err) {
            this.logError(`Parsing | User-bot: ${userBotData?.username} | ${err}`);
        }
    }

    abstract worker<WorkerParams extends Array<any>>(authToken: string, initData: string, proxyAgent: SocksProxyAgent, ...workerParams: WorkerParams): Promise<WorkerResponse>;

    private userBotDataExpirationTimer(userBotData: UserBotData) {
        setTimeout(() => {
            userBotData.authToken = '';
            userBotData.initData = '';
            this.logInfo(`User-bot data expired | User-bot: ${userBotData.username}`);
        }, this.USER_BOT_DATA_EXPIRATION_TIME);
    }

    //userBotData is mutable to simplify data expiration
    private getUserBotData() {
        try {
            const userBotData = this.userBotsData.shift();
            if (!userBotData) throw new Error(`No available user-bot data found`);
            this.userBotsData.push(userBotData);
            this.logDebug(`Get user-bot data | User-bot: ${userBotData.username}`);
            return userBotData;
        } catch (err) {
            this.logError(`Get user-bot data | ${err}`);
        }
    }

    abstract extractAuthToken(authTokenResponse: AuthTokenResponse): Promise<string>;

    abstract formAuthTokenPayload(initData: string, userData: UserData): Promise<AuthTokenPayload>;

    abstract getCustomHeaders(initData: string): Promise<HeadersInit>;

    private async getAuthToken(initData: string, userData: UserData, agent: SocksProxyAgent) {
        try {
            const url = `${this.APP_BASE_URL}${this.AUTH_ENDPOINT}`;
            const payload = await this.formAuthTokenPayload(initData, userData);
            const options = await this.getRequestOptions(RequestMethod.Post, initData, this.AUTH_REFERER_HEADER, '', agent, payload);

            const res = await this.requesterService.sendApiRequest<AuthTokenResponse>(url, options);

            return res;
        } catch (err) {
            this.logAndThrowError(`Get JWT token | ${err}`);
        }
    }

    protected async getRequestOptions(method: RequestMethod, initData: string, referer: string, authToken: string, agent: SocksProxyAgent, body?: any) {
        const options: ApiRequestOptions = { method, agent };
        const additionalHeaders = await this.getCustomHeaders(initData);

        const headers: HeadersInit = {
            "accept": "*/*",
            "accept-language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
            "priority": "u=1, i",
            "sec-ch-ua": "\"Not)A;Brand\";v=\"8\", \"Chromium\";v=\"138\", \"Google Chrome\";v=\"138\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "sec-fetch-storage-access": "active",
            "Referer": referer,
            ...additionalHeaders
        };

        if (authToken) {
            headers.authorization = authToken;
        }

        if (body) {
            if (typeof body === 'string') {
                headers['content-type'] = "text/plain";
                options.body = body;
            } else {
                headers['content-type'] = "application/json";
                options.body = JSON.stringify(body);
            }
        }

        options.headers = headers;
        return options;
    }

    async shutdown() {
        try {
            this.launchParserTimeout && clearTimeout(this.launchParserTimeout);

            this.logInfo(`Shutdown | Success`);
        } catch (err) {
            this.logAndThrowError(`Shutdown | ${err}`);
        }
    }
}