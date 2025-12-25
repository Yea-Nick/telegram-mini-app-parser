import { IsIP, IsPort, IsString } from "class-validator";

export class Proxy {
    @IsIP(4)
    readonly ip: string;

    @IsPort()
    readonly port: string;

    @IsString()
    readonly username: string;

    @IsString()
    readonly password: string;
}