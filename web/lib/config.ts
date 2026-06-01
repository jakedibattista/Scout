/** Centralized server-side constants (avoid magic numbers scattered across routes). */

/** Lifetime for read/write signed Storage URLs. */
export const SIGNED_URL_TTL_MS = 15 * 60 * 1000;

/** A video stuck in "running" longer than this is treated as a failed analysis. */
export const ANALYSIS_STALE_MS = 15 * 60 * 1000;
