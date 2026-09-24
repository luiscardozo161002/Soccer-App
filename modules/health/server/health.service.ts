import { logger } from "@/lib/observability/logger";
import { healthRepository } from "./health.repository";

export interface HealthStatus {
  status: "ok" | "degraded";
  timestamp: string;
  uptimeSeconds: number;
  checks: { database: "up" | "down" };
}

export const healthService = {
  async check(): Promise<HealthStatus> {
    let database: HealthStatus["checks"]["database"] = "up";
    try {
      await healthRepository.pingDatabase();
    } catch (error) {
      database = "down";
      logger.error("health.database.failed", { error });
    }
    return {
      status: database === "up" ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      checks: { database },
    };
  },
};
