const env = {
  DATABASE_URL: process.env.DATABASE_URL ?? "",
  NODE_ENV: (process.env.NODE_ENV ?? "development") as
    | "development"
    | "production"
    | "test",
} as const;

function validateEnv(): void {
  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required but not set.");
  }
}

validateEnv();

export { env };
