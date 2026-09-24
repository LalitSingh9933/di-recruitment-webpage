import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());
import { prisma } from "../lib/prisma";
import { consumeRateLimit } from "../lib/rate-limit";
import { validateSocialUrl } from "../lib/social-links";

async function main() {
  const tag = "production-check-" + randomUUID();
  const email = tag + "@example.test";
  const base = process.env.CHECK_URL || "http://localhost:3001";
  const startWindow = Math.floor(Date.now() / 900000);
  let jobId: number | undefined;
  try {
    assert.equal(validateSocialUrl("javascript:alert(1)", "linkedin.com"), null);
    assert.equal(
      validateSocialUrl("https://linkedin.com.attacker.test/test", "linkedin.com"),
      null,
    );
    assert.equal(
      validateSocialUrl("https://www.linkedin.com/company/example", "linkedin.com"),
      "https://www.linkedin.com/company/example",
    );
    const attempts = await Promise.all(
      Array.from({ length: 12 }, () => consumeRateLimit("test", tag, 3)),
    );
    assert.equal(attempts.filter(Boolean).length, 3);
    const page = await fetch(base);
    assert.equal(page.status, 200);
    assert.equal(page.headers.get("x-frame-options"), "DENY");
    const html = await page.text();
    for (const name of ["Facebook", "LinkedIn", "YouTube", "TikTok"])
      assert.ok(html.includes(name));
    assert.ok(html.includes("tw:flex"));
    assert.equal((await fetch(base + "/api/health")).status, 200);
    assert.equal(
      (await fetch(base + "/admin/contacts", { redirect: "manual" })).status,
      307,
    );
    const job = await prisma.job.create({
      data: {
        title: tag,
        slug: tag,
        company: "Test",
        country: "Nepal",
        category: "Test",
        description: "Temporary test only",
        requirements: "Temporary test only",
        active: false,
      },
    });
    jobId = job.id;
    const payload = {
      jobId,
      fullName: "Test Candidate",
      email,
      phone: "9800000000",
      nationality: "Nepalese",
      experience: "",
    };
    const post = (body: string, origin = base) =>
      fetch(base + "/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: origin },
        body,
      });
    assert.equal(
      (await post(JSON.stringify(payload), "https://untrusted.example")).status,
      403,
    );
    assert.equal((await post("{")).status, 400);
    assert.equal((await post("x".repeat(17000))).status, 413);
    assert.equal((await post(JSON.stringify(payload))).status, 400);
    await prisma.job.update({ where: { id: jobId }, data: { active: true } });
    assert.equal((await post(JSON.stringify(payload))).status, 201);
    assert.equal(
      (await prisma.application.findFirstOrThrow({ where: { jobId } })).experience,
      null,
    );
    for (let i = 0; i < 3; i++)
      assert.equal((await post(JSON.stringify(payload))).status, 201);
    assert.equal((await post(JSON.stringify(payload))).status, 429);
    console.log(
      "PASS: shared concurrent throttling, headers, footer, health, admin protection, application validation and limits.",
    );
  } finally {
    if (jobId) await prisma.job.delete({ where: { id: jobId } });
    const keys: string[] = [];
    for (let window = startWindow; window <= Math.floor(Date.now() / 900000); window++) {
      for (const [scope, identity] of [
        ["test", tag],
        ["application", email],
      ])
        keys.push(
          createHash("sha256").update(`${scope}:${identity}:${window}`).digest("hex"),
        );
    }
    await prisma.rateLimit.deleteMany({ where: { key: { in: keys } } });
    await prisma.$disconnect();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
