import type { Request, Response, NextFunction } from "express";

interface Bucket {
  count: number;
  resetAt: number;
}

export function createRateLimiter(limit = 120, windowMs = 60_000) {
  const buckets = new Map<string, Bucket>();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();
    const current = buckets.get(key);

    if (!current || current.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    current.count += 1;
    if (current.count > limit) {
      res.status(429).json({
        error: "Rate limit exceeded",
        retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000)
      });
      return;
    }

    next();
  };
}
