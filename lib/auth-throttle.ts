// This single-server limiter survives development hot reloads.
// Multi-instance deployments should use a shared rate-limit store such as Redis.
const globalAuth = globalThis as unknown as {
  authAttempts?: Map<string, { count: number; expires: number }>;
};
const attempts =
  globalAuth.authAttempts ?? new Map<string, { count: number; expires: number }>();
globalAuth.authAttempts = attempts;

export function allowAuthAttempt(key: string, limit = 5) {
  const now = Date.now();
  for (const [entry, value] of attempts) {
    if (value.expires <= now) attempts.delete(entry);
  }
  const attempt = attempts.get(key);
  if (attempt && attempt.count >= limit) return false;
  attempts.set(key, {
    count: (attempt?.count || 0) + 1,
    expires: attempt?.expires ?? now + 15 * 60 * 1000,
  });
  return true;
}

export function clearAuthAttempts(key: string) {
  attempts.delete(key);
}
