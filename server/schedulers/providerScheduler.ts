import { refreshAllProviders } from "../services/providerService";
import { logger } from "../utils/logger";

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

export function startProviderScheduler() {
  refreshAllProviders().catch(error => {
    logger.error("initial provider refresh failed", {
      error: error instanceof Error ? error.message : String(error)
    });
  });

  const timer = setInterval(() => {
    refreshAllProviders().catch(error => {
      logger.error("scheduled provider refresh failed", {
        error: error instanceof Error ? error.message : String(error)
      });
    });
  }, REFRESH_INTERVAL_MS);

  timer.unref?.();
  logger.info("provider scheduler started", { intervalMs: REFRESH_INTERVAL_MS });
}
