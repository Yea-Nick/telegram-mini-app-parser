import { Proxy } from "../proxy";
import { IsNumber, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class UserBot {
    @IsString()
    readonly stringSession: string;

    @IsNumber()
    readonly apiId: number;

    @IsString()
    readonly apiHash: string;

    @IsString()
    readonly username: string;

    @ValidateNested()
    @Type(() => Proxy)
    readonly proxy: Proxy;
}