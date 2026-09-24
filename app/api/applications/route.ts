import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { consumeRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  jobId: z.coerce.number().int().positive(),
  fullName: z.string().min(2).max(100),
  email: z
    .string()
    .trim()
    .email()
    .max(254)
    .transform((value) => value.toLowerCase()),
  phone: z.string().min(7).max(30),
  nationality: z.string().min(2).max(60).default("Nepalese"),
  experience: z.union([z.literal(""), z.coerce.number().int().min(0).max(60)]).optional(),
  message: z.string().max(2000).optional(),
});

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const expectedOrigin = process.env.APP_URL || new URL(request.url).origin;
  if (origin && origin !== new URL(expectedOrigin).origin)
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  if (!request.headers.get("content-type")?.includes("application/json"))
    return NextResponse.json({ error: "Expected JSON." }, { status: 415 });
  try {
    // Enforce actual bytes, not just a client-supplied Content-Length.
    const reader = request.body?.getReader();
    if (!reader) return NextResponse.json({ error: "Missing body." }, { status: 400 });
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > 16384) {
        await reader.cancel();
        return NextResponse.json({ error: "Request too large." }, { status: 413 });
      }
      chunks.push(chunk.value);
    }
    const data = schema.parse(JSON.parse(Buffer.concat(chunks).toString("utf8")));
    if (!(await consumeRateLimit("application", data.email, 5)))
      return NextResponse.json(
        { error: "Too many applications. Try again in 15 minutes." },
        { status: 429 },
      );
    const job = await prisma.job.findFirst({
      where: {
        id: data.jobId,
        active: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      select: { id: true },
    });
    if (!job)
      return NextResponse.json(
        { error: "This job is no longer accepting applications." },
        { status: 400 },
      );
    const application = await prisma.application.create({
      data: {
        jobId: data.jobId,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        nationality: data.nationality,
        experience:
          data.experience === "" || data.experience === undefined
            ? null
            : data.experience,
        message: data.message || null,
      },
    });
    return NextResponse.json(
      { id: application.id, status: application.status },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof SyntaxError)
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    if (error instanceof z.ZodError)
      return NextResponse.json(
        { error: "Invalid application", issues: error.flatten() },
        { status: 400 },
      );
    console.error(error);
    return NextResponse.json({ error: "Unable to submit application" }, { status: 500 });
  }
}
