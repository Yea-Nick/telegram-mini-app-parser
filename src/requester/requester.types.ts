import { Agent } from "http";
import { RequestInit } from 'node-fetch';

export interface IpifyResponse {
    ip: string;
}

export enum RequestMethod {
    Get = 'GET',
    Post = 'POST'
}

export type ApiRequestOptions = { agent: Agent; } & Omit<RequestInit, 'agent'>;
