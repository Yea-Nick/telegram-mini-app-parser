export interface UserBotData {
    username: string;
    authToken: string;
    initData: string;
}

export interface ParserServiceOptions {
    botUsername: string;
    appBaseUrl: string;
    authEndpoint: string;
    authRefererHeader: string;
    workerTimeout: false | number | (() => number);
    userBotDataExpirationTime?: number;
}