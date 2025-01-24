import * as dotenv from 'dotenv';

dotenv.config({
  path: process.env.DEVELP == 'true' ? '.develop.env' : undefined,
});

export const getString = (key: string, option?: string): string => process.env[key] ?? option ?? '';
export const getNumber = (key: string, option?: number): number => {
  return process.env[key] == undefined ? (option ?? 0) : Number(process.env[key]);
};
