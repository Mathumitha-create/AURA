import type { Provider } from "../models/aggregation";
import { providers } from "../providers";
import { logger } from "../utils/logger";
import { withRetry } from "../utils/retry";

export async function refreshProvider<T>(provider: Provider<T>): Promise<T> {
  const raw = await withRetry(() => provider.fetchLatest(), {
    label: `${provider.name}:fetchLatest`
  });
  const normalized = provider.normalize(raw);
  provider.cache(normalized);
  logger.info("provider refreshed", { provider: provider.name });
  return normalized;
}

export async function refreshAllProviders() {
  const results = await Promise.allSettled(providers.map(provider => refreshProvider(provider as Provider<unknown>)));
  results.forEach((result, index) => {
    if (result.status === "rejected") {
      logger.error("provider refresh failed", {
        provider: providers[index].name,
        error: result.reason instanceof Error ? result.reason.message : String(result.reason)
      });
    }
  });
}
