import { config } from "dotenv";

import { z } from "zod";

export const getEnv = async <T extends z.ZodRawShape>(schema: z.ZodObject<T>) => {
  config();
  const parsed = await schema.safeParseAsync(process.env);
  if (parsed.success) {
    return parsed.data;
  } else {
    console.error(parsed.error.format((issue) => `Error at ${issue.path.join(".")} - ${issue.message}`));
    throw new Error("Invalid environment variables");
  }
};

export const zBoolean = () => {
  return z.union([z.boolean(), z.string(), z.number()]).transform((val) => {
    if (typeof val === "boolean") return val;
    if (typeof val === "number") return val !== 0;
    const normalized = String(val).trim().toLowerCase();
    if (["true", "1", "yes", "on"].includes(normalized)) return true;
    if (["false", "0", "no", "off"].includes(normalized)) return false;
    throw new Error(`Invalid boolean value: ${val}`);
  });
};
