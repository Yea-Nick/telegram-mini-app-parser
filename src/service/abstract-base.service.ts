import { LogHandler } from "../log-handler";

export abstract class BaseService extends LogHandler {
    constructor(serviceName: string) {
        super(serviceName.split('Service')[0] + ' Service');
    }

    async init(): Promise<any> {
        this.logInfo(`Service is initialized`);
    }
}
