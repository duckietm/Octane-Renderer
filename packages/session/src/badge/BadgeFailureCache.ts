/** How long a badge image that failed to load is left alone before it is tried again. */
export const BADGE_RETRY_MS = 60_000;

/** How many failed badge urls are remembered; past that the oldest is forgotten. */
export const MAX_FAILED_BADGES = 500;

/** Whether a badge image may be downloaded now: never failed, or failed longer ago than the backoff. */
export const shouldRetryBadge = (failed: Map<string, number>, url: string, now: number): boolean =>
{
    const failedAt = failed.get(url);

    return (failedAt === undefined) || ((now - failedAt) >= BADGE_RETRY_MS);
};

/** Remembers a failed badge image, keeping the map bounded. */
export const rememberFailedBadge = (failed: Map<string, number>, url: string, now: number): void =>
{
    failed.delete(url);

    if(failed.size >= MAX_FAILED_BADGES)
    {
        const oldest = failed.keys().next().value;

        if(oldest !== undefined) failed.delete(oldest);
    }

    failed.set(url, now);
};
