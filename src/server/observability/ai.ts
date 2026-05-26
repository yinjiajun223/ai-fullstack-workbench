import type { ModelUsage } from "@/server/ai";
import { logger } from "./logger";

export type AiRequestLog = {
  requestId: string;
  route: string;
  model?: string;
  latencyMs: number;
  status: "success" | "error";
  errorCode?: string;
  usage?: ModelUsage;
};

export function logAiRequest(log: AiRequestLog): void {
  const payload = {
    requestId: log.requestId,
    route: log.route,
    model: log.model,
    latencyMs: log.latencyMs,
    status: log.status,
    errorCode: log.errorCode,
    usage: log.usage,
  };

  if (log.status === "error") {
    logger.error("ai_request", "AI request failed.", payload);
    return;
  }

  logger.info("ai_request", "AI request completed.", payload);
}
