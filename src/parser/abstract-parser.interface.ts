import { IBaseService } from "../service";

export interface ITelegramMiniAppParser<WorkerResponse> extends IBaseService {
    init(): Promise<(<WorkerParams extends any[]>(...workerParams: WorkerParams) => Promise<WorkerResponse | undefined>) | undefined>;
}