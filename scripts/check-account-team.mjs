import assert from "node:assert/strict";
import { randomBytes, scryptSync } from "node:crypto";
import { access, unlink } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import nextEnv from "@next/env";
import { PrismaClient } from "@prisma/client";

nextEnv.loadEnvConfig(process.cwd());
const db = new PrismaClient();
const base = process.env.CHECK_URL || "http://localhost:3001";
const tag = "account-team-check-" + Date.now();
const email = tag + "@example.test";
const originalPassword = randomBytes(20).toString("hex");
const newPassword = randomBytes(20).toString("hex");
const salt = randomBytes(16).toString("hex");
const hash = salt + ":" + scryptSync(originalPassword, salt, 64).toString("hex");
const storageRoot = path.resolve(process.env.TEAM_STORAGE_DIR || "storage/team");
let cookie = "";
let memberId;

const decode = (text) =>
  text.replaceAll("&quot;", '"').replaceAll("&amp;", "&").replaceAll("&#x27;", "'");
async function submit(route, values, marker, authentication = cookie) {
  const html = await (
    await fetch(base + route, {
      headers: authentication ? { Cookie: authentication } : {},
    })
  ).text();
  const form = [...html.matchAll(/<form\b[^>]*>[\s\S]*?<\/form>/g)]
    .map((m) => m[0])
    .find((f) => f.includes(marker));
  assert.ok(form, "Expected form on " + route);
  const data = new FormData();
  for (const input of form.matchAll(/<input\b[^>]*>/g)) {
    if (!input[0].includes('type="hidden"')) continue;
    const name = input[0].match(/name="([^"]*)"/)?.[1];
    if (name)
      data.append(decode(name), decode(input[0].match(/value="([^"]*)"/)?.[1] || ""));
  }
  for (const [key, value] of Object.entries(values))
    data.set(key, value instanceof File ? value : String(value));
  return fetch(base + route, {
    method: "POST",
    body: data,
    redirect: "manual",
    headers: { Origin: base, ...(authentication ? { Cookie: authentication } : {}) },
  });
}

async function login(password) {
  return submit("/admin/login", { email, password }, 'name="email"', "");
}

try {
  // Use a temporary account; never change the real administrator's credentials.
  const admin = await db.admin.create({
    data: { email, name: "Temporary verification account", passwordHash: hash },
  });
  const initial = await login(originalPassword);
  assert.equal(initial.status, 303);
  cookie = initial.headers.get("set-cookie")?.split(";")[0];
  assert.ok(cookie);
  const oldCookie = cookie;
  const wrong = await submit(
    "/admin/settings",
    { currentPassword: "incorrect", newPassword, confirmPassword: newPassword },
    'name="currentPassword"',
  );
  assert.ok((await wrong.text()).includes("Your current password is incorrect."));
  const mismatch = await submit(
    "/admin/settings",
    {
      currentPassword: originalPassword,
      newPassword,
      confirmPassword: newPassword + "x",
    },
    'name="currentPassword"',
  );
  assert.ok((await mismatch.text()).includes("The new passwords do not match."));
  assert.equal(
    (await db.admin.findUniqueOrThrow({ where: { id: admin.id } })).passwordHash,
    hash,
  );

  const changed = await submit(
    "/admin/settings",
    { currentPassword: originalPassword, newPassword, confirmPassword: newPassword },
    'name="currentPassword"',
  );
  assert.ok((await changed.text()).includes("Password changed."));
  cookie = changed.headers.get("set-cookie")?.split(";")[0];
  assert.ok(cookie);
  assert.equal(
    (
      await fetch(base + "/admin/settings", {
        redirect: "manual",
        headers: { Cookie: oldCookie },
      })
    ).status,
    307,
  );
  const oldLogin = await login(originalPassword);
  assert.equal(oldLogin.status, 200);
  assert.ok((await oldLogin.text()).includes("Invalid email or password."));
  assert.equal((await login(newPassword)).status, 303);
  assert.equal(
    (await fetch(base + "/admin/settings", { headers: { Cookie: cookie } })).status,
    200,
  );
  console.log(
    "PASS: current-password verification, confirmation, password change, and old-session revocation.",
  );

  const photoBytes = await sharp({
    create: { width: 100, height: 120, channels: 3, background: "#2375aa" },
  })
    .png()
    .toBuffer();
  const profile = {
    name: tag,
    position: "Verification Officer",
    bio: "Temporary photo upload test.",
    displayOrder: 1,
  };
  const oversized = Buffer.alloc(1024 * 1024);
  photoBytes.copy(oversized);
  const tooLarge = await submit(
    "/admin/team/new",
    { ...profile, photo: new File([oversized], "large.png", { type: "image/png" }) },
    'name="name"',
  );
  assert.ok((await tooLarge.text()).includes("Photos must be under 1 MB."));
  assert.equal(await db.teamMember.count({ where: { name: tag } }), 0);
  const fake = await submit(
    "/admin/team/new",
    { ...profile, photo: new File(["not an image"], "fake.png", { type: "image/png" }) },
    'name="name"',
  );
  assert.ok((await fake.text()).includes("Choose a JPG, PNG, or WebP photo."));

  const saved = await submit(
    "/admin/team/new",
    { ...profile, photo: new File([photoBytes], "portrait.png", { type: "image/png" }) },
    'name="name"',
  );
  assert.equal(saved.status, 303);
  const member = await db.teamMember.findFirstOrThrow({ where: { name: tag } });
  memberId = member.id;
  const firstUrl = member.photoUrl;
  assert.ok(firstUrl.startsWith("/api/team/photos/"));
  assert.equal((await fetch(base + firstUrl)).status, 404);
  const preview = await fetch(base + firstUrl, { headers: { Cookie: cookie } });
  assert.equal(preview.status, 200);
  assert.equal(
    (await sharp(Buffer.from(await preview.arrayBuffer())).metadata()).format,
    "webp",
  );

  await submit(
    "/admin/team/" + member.id,
    { ...profile, published: "on" },
    'name="name"',
  );
  assert.equal((await fetch(base + firstUrl)).status, 200);
  // Updating text without selecting a file must retain the existing photo.
  assert.equal(
    (await db.teamMember.findUniqueOrThrow({ where: { id: member.id } })).photoUrl,
    firstUrl,
  );
  await submit(
    "/admin/team/" + member.id,
    {
      ...profile,
      published: "on",
      photo: new File([photoBytes], "replacement.png", { type: "image/png" }),
    },
    'name="name"',
  );
  const replacement = await db.teamMember.findUniqueOrThrow({ where: { id: member.id } });
  assert.notEqual(replacement.photoUrl, firstUrl);
  await assert.rejects(access(path.join(storageRoot, firstUrl.split("/").pop())));
  assert.equal((await fetch(base + firstUrl)).status, 404);
  assert.equal((await fetch(base + replacement.photoUrl)).status, 200);
  await submit(
    "/admin/team/" + member.id,
    { ...profile, published: "on", removePhoto: "on" },
    'name="name"',
  );
  assert.equal(
    (await db.teamMember.findUniqueOrThrow({ where: { id: member.id } })).photoUrl,
    null,
  );
  await assert.rejects(
    access(path.join(storageRoot, replacement.photoUrl.split("/").pop())),
  );
  console.log(
    "PASS: image validation, 1 MB boundary, photo preview, publication, replacement, and removal.",
  );

  await db.admin.update({ where: { id: admin.id }, data: { active: false } });
  assert.equal(
    (
      await fetch(base + "/admin/settings", {
        redirect: "manual",
        headers: { Cookie: cookie },
      })
    ).status,
    307,
  );
  console.log("PASS: disabled accounts cannot reuse a signed-in session.");
} finally {
  if (memberId) {
    const member = await db.teamMember.findFirst({ where: { id: memberId, name: tag } });
    if (member?.photoUrl?.startsWith("/api/team/photos/")) {
      const key = member.photoUrl.split("/").pop();
      if (/^[0-9a-f-]{36}\.webp$/.test(key))
        await unlink(path.join(storageRoot, key)).catch(() => {});
    }
    await db.teamMember.deleteMany({ where: { id: memberId, name: tag } });
  }
  await db.admin.deleteMany({ where: { email } });
  await db.$disconnect();
}
