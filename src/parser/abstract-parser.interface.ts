import { IBaseService } from "../service";

export interface IParserService<WorkerResponse> extends IBaseService {
    init(): Promise<(<WorkerParams extends any[]>(...workerParams: WorkerParams) => Promise<WorkerResponse | undefined>) | undefined>;
}