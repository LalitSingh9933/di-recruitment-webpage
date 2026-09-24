import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";

export async function consumeRateLimit(scope: string, identity: string, limit: number) {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const window = Math.floor(now / windowMs);
  const key = createHash("sha256").update(`${scope}:${identity}:${window}`).digest("hex");
  // Atomic upsert/increment prevents concurrent requests bypassing the limit.
  const counter = await prisma.rateLimit
    .upsert({
      where: { key },
      create: { key, count: 1, expiresAt: new Date((window + 1) * windowMs) },
      update: { count: { increment: 1 } },
    })
    .catch(async (error) => {
      // Some connectors emulate upsert: concurrent first inserts can race on the PK.
      if (error && typeof error === "object" && "code" in error && error.code === "P2002")
        return prisma.rateLimit.update({
          where: { key },
          data: { count: { increment: 1 } },
        });
      throw error;
    });
  return counter.count <= limit;
}
