import { config } from 'dotenv';

const environment = process.env.NODE_ENV as 'development' | 'production' | 'test';

export const getEnv = () => {
  if (environment !== 'test') {
    config();
  }

  const text = (key: string, defaultValue?: string): string => {
    const value = process.env[key];
    if (!value) {
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      throw new Error(`Missing environment variable: ${key}`);
    }
    return value;
  };

  const textOr = (key: string): string | undefined => {
    const value = process.env[key];
    if (!value) {
      return undefined;
    }
    return value;
  };

  const number = (key: string, defaultValue?: number): number => {
    const value = process.env[key];
    if (!value) {
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      throw new Error(`Missing environment variable: ${key}`);
    }
    return Number(value);
  };

  const boolean = (key: string, defaultValue?: boolean): boolean => {
    const value = process.env[key];
    if (!value) {
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      throw new Error(`Missing environment variable: ${key}`);
    }
    return value.toLowerCase() === 'true' || value === '1';
  };

  return { text, textOr, number , boolean };
};
