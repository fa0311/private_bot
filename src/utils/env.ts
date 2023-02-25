import * as dotenv from "dotenv";
dotenv.config();

export const getString = (key: string, option?: string): string => process.env[key] ?? option!;
export const getNumber = (key: string, option?: number): number => (process.env[key] == undefined ? option! : Number(process.env[key]));
