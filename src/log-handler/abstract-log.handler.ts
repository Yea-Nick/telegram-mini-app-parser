import { LoggingLevels } from ".";
import { Console } from "winston/lib/winston/transports";
import { createLogger, format, Logger } from "winston";

export abstract class LogHandler {
    private logger: Logger;

    constructor(private readonly serviceName: string) {
        const { combine, timestamp, colorize, printf } = format;
        const NODE_ENV = process.env.NODE_ENV;
        if (!NODE_ENV) throw new Error(`Node environment is undefined`);

        this.logger = createLogger({
            defaultMeta: { service_name: serviceName, env: NODE_ENV },
            transports: [
                new Console({
                    level: 'silly',
                    format: combine(
                        timestamp(),
                        printf(({ level, message, service_name, env, timestamp }) => {
                            return `${env} | ${new Date(timestamp as string).toLocaleString()} [${level.toUpperCase()}] ${service_name} | ${message}`;
                        }),
                        colorize({ all: true })
                    )
                })
            ],
            exitOnError: false,
        });

        this.logger.on('error', (err) => this.logger.error({ message: err }));
    }

    protected logAndThrowError(message: string): never {
        this.logError(message,);
        throw new Error(`${this.serviceName} | ${message}`);
    }

    protected logError(message: string) {
        this.log(LoggingLevels.Error, message);
    }

    protected logWarn(message: string) {
        this.log(LoggingLevels.Warn, message);
    }

    protected logInfo(message: string) {
        this.log(LoggingLevels.Info, message);
    }

    protected logHttp(message: string) {
        this.log(LoggingLevels.Http, message);
    }

    protected logVerbose(message: string) {
        this.log(LoggingLevels.Verbose, message);
    }

    protected logDebug(message: string) {
        this.log(LoggingLevels.Debug, message);
    }

    protected logSilly(message: string) {
        this.log(LoggingLevels.Silly, message);
    }

    private log(level: LoggingLevels, message: string) {
        this.logger.log({ level, message });
    }
}