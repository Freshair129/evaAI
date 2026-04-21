export interface RateLimitConfig {
  windowMs: number
  maxPerWindow: number
}

export class SlidingWindowLimiter {
  private hits = new Map<string, number[]>()
  constructor(private cfg: RateLimitConfig) {}

  /** Returns true if the request is allowed; false if over limit. */
  allow(key: string, now = Date.now()): boolean {
    const windowStart = now - this.cfg.windowMs
    const arr = this.hits.get(key) ?? []
    const recent = arr.filter((t) => t > windowStart)
    if (recent.length >= this.cfg.maxPerWindow) {
      this.hits.set(key, recent)
      return false
    }
    recent.push(now)
    this.hits.set(key, recent)
    return true
  }

  retryAfterMs(key: string, now = Date.now()): number {
    const arr = this.hits.get(key) ?? []
    if (arr.length < this.cfg.maxPerWindow) return 0
    const oldest = arr[0] ?? now
    return Math.max(0, oldest + this.cfg.windowMs - now)
  }

  reset(key?: string): void {
    if (key === undefined) this.hits.clear()
    else this.hits.delete(key)
  }

  sizeFor(key: string, now = Date.now()): number {
    const windowStart = now - this.cfg.windowMs
    const arr = this.hits.get(key) ?? []
    return arr.filter((t) => t > windowStart).length
  }
}
