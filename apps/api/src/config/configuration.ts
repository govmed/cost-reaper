export interface AppConfig {
  nodeEnv: string;
  port: number;
  corsOrigin: string;
  logLevel: string;
  jwt: {
    secret: string;
    refreshSecret: string;
    accessTtlMin: number;
    refreshTtlDays: number;
  };
  cloudHoursPerMonth: number;
}

/** All configuration comes from env vars (NFR-10) — no hardcoded URLs/secrets. */
export default (): AppConfig => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number.parseInt(process.env.API_PORT ?? '8000', 10),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  logLevel: process.env.LOG_LEVEL ?? 'info',
  jwt: {
    secret: process.env.JWT_SECRET ?? '',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? '',
    accessTtlMin: Number.parseInt(process.env.ACCESS_TOKEN_TTL_MIN ?? '15', 10),
    refreshTtlDays: Number.parseInt(process.env.REFRESH_TOKEN_TTL_DAYS ?? '7', 10),
  },
  cloudHoursPerMonth: Number.parseInt(process.env.CLOUD_HOURS_PER_MONTH ?? '730', 10),
});
