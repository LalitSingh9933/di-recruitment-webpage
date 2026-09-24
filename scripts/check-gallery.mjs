import assert from "node:assert/strict";
import { readFile, access, unlink } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import nextEnv from "@next/env";
import { PrismaClient } from "@prisma/client";

nextEnv.loadEnvConfig(process.cwd());
const db = new PrismaClient();
const base = process.env.CHECK_URL || "http://localhost:3001";
const slug = "gallery-check-" + Date.now();
let cookie = "";
let albumId;
const createdKeys = [];
const root = path.resolve(process.env.GALLERY_STORAGE_DIR || "storage/gallery");
const decode = (text) =>
  text.replaceAll("&quot;", '"').replaceAll("&amp;", "&").replaceAll("&#x27;", "'");

async function page(route, authenticated = true) {
  const response = await fetch(base + route, {
    headers: authenticated && cookie ? { Cookie: cookie } : {},
  });
  assert.equal(response.status, 200, route);
  return response.text();
}

// Submit the same native forms rendered by Next.js, including their action fields.
async function submit(route, values, marker) {
  const source = await page(route);
  const form = [...source.matchAll(/<form\b[^>]*>[\s\S]*?<\/form>/g)]
    .map((match) => match[0])
    .find((form) => form.includes(marker));
  assert.ok(form, "Form exists: " + marker);
  const data = new FormData();
  for (const input of form.matchAll(/<input\b[^>]*>/g)) {
    if (!input[0].includes('type="hidden"')) continue;
    const name = input[0].match(/name="([^"]*)"/)?.[1];
    if (name)
      data.append(decode(name), decode(input[0].match(/value="([^"]*)"/)?.[1] || ""));
  }
  for (const [key, value] of Object.entries(values)) data.set(key, String(value));
  return fetch(base + route, {
    method: "POST",
    body: data,
    redirect: "manual",
    headers: { Origin: base, ...(cookie ? { Cookie: cookie } : {}) },
  });
}

async function upload(bytes, name, type, origin = base, authenticated = true) {
  const form = new FormData();
  form.append("file", new File([bytes], name, { type }));
  return fetch(base + "/api/admin/gallery/" + albumId + "/media", {
    method: "POST",
    body: form,
    headers: { Origin: origin, ...(authenticated ? { Cookie: cookie } : {}) },
  });
}

try {
  const login = await submit(
    "/admin/login",
    { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD },
    'name="email"',
  );
  cookie = login.headers.get("set-cookie")?.split(";")[0];
  assert.ok(cookie);
  assert.equal(login.status, 303);
  const data = {
    title: "Gallery check event",
    slug,
    description: "Temporary integration test album.",
    eventDate: "2026-09-22",
    displayOrder: 0,
  };
  assert.equal((await submit("/admin/gallery/new", data, 'name="title"')).status, 303);
  const album = await db.galleryAlbum.findUniqueOrThrow({ where: { slug } });
  albumId = album.id;
  assert.equal((await fetch(base + "/gallery/" + slug)).status, 404);
  const image = await sharp(await readFile("public/images/recruitment-hero.png"))
    .resize(400)
    .png()
    .toBuffer();
  assert.equal((await upload(image, "photo.png", "image/png", base, false)).status, 401);
  assert.equal(
    (await upload(image, "photo.png", "image/png", "https://untrusted.example")).status,
    403,
  );
  assert.equal(
    (await upload(Buffer.from("<html>not a photo</html>"), "fake.jpg", "image/jpeg"))
      .status,
    400,
  );
  console.log(
    "PASS: authentication, origin checks, draft hiding, and invalid-file rejection.",
  );

  const photoResponse = await upload(image, "event-photo.png", "image/png");
  assert.equal(photoResponse.status, 201);
  const photoId = (await photoResponse.json()).id;
  // This fixture tests video storage and byte-range delivery, not codec playback.
  const video = Buffer.concat([
    Buffer.from([0, 0, 0, 24]),
    Buffer.from("ftypisom"),
    Buffer.alloc(40),
  ]);
  const videoResponse = await upload(video, "transport-fixture.mp4", "video/mp4");
  const largePhoto = Buffer.alloc(1024 * 1024);
  image.copy(largePhoto);
  const photoLimit = await upload(largePhoto, "large.png", "image/png");
  assert.equal(photoLimit.status, 400);
  assert.equal((await photoLimit.json()).error, "Photos must be under 1 MB.");
  const largeVideo = Buffer.alloc(15 * 1024 * 1024);
  video.copy(largeVideo);
  const videoLimit = await upload(largeVideo, "large.mp4", "video/mp4");
  assert.equal(videoLimit.status, 400);
  assert.equal((await videoLimit.json()).error, "Videos must be under 15 MB.");
  console.log("PASS: exact 1 MB photo and 15 MB video boundaries are rejected.");
  assert.equal(videoResponse.status, 201);
  const videoId = (await videoResponse.json()).id;
  const media = await db.galleryMedia.findMany({ where: { albumId } });
  assert.equal(media.length, 2);
  createdKeys.push(...media.map((item) => item.storageKey));
  assert.equal((await fetch(base + "/api/gallery/media/" + photoId)).status, 404);
  const privatePhoto = await fetch(base + "/api/gallery/media/" + photoId, {
    headers: { Cookie: cookie },
  });
  assert.equal(privatePhoto.status, 200);
  assert.deepEqual(Buffer.from(await privatePhoto.arrayBuffer()), image);
  console.log("PASS: photo/video upload, stored bytes, and private draft media.");

  assert.equal(
    (
      await submit(
        "/admin/gallery/" + albumId,
        { ...data, published: "on" },
        'name="title"',
      )
    ).status,
    303,
  );
  assert.ok((await page("/gallery", false)).includes(slug));
  assert.ok((await page("/gallery/" + slug, false)).includes("transport-fixture.mp4"));
  const range = await fetch(base + "/api/gallery/media/" + videoId, {
    headers: { Range: "bytes=4-11" },
  });
  assert.equal(range.status, 206);
  assert.equal(range.headers.get("content-range"), "bytes 4-11/" + video.length);
  assert.deepEqual(Buffer.from(await range.arrayBuffer()), video.subarray(4, 12));
  const invalidRange = await fetch(base + "/api/gallery/media/" + videoId, {
    headers: { Range: "bytes=9999-10000" },
  });
  assert.equal(invalidRange.status, 416);
  console.log("PASS: public album visibility and video byte-range delivery.");

  await submit(
    "/admin/gallery/" + albumId,
    { id: photoId, caption: "Verified event caption", displayOrder: 2 },
    'name="caption"',
  );
  assert.equal(
    (await db.galleryMedia.findUniqueOrThrow({ where: { id: photoId } })).caption,
    "Verified event caption",
  );
  assert.ok((await page("/gallery/" + slug, false)).includes("Verified event caption"));
  assert.equal(
    (await submit("/admin/gallery/" + albumId, data, 'name="title"')).status,
    303,
  );
  assert.equal((await fetch(base + "/api/gallery/media/" + photoId)).status, 404);
  console.log("PASS: caption updates, display order, and unpublishing.");

  await submit("/admin/gallery/" + albumId, {}, "Delete album");
  assert.equal(await db.galleryAlbum.findUnique({ where: { id: albumId } }), null);
  assert.equal(await db.galleryMedia.count({ where: { albumId } }), 0);
  for (const key of createdKeys) await assert.rejects(access(path.join(root, key)));
  console.log("PASS: album deletion removes database records and uploaded files.");
} finally {
  // Clean up only the uniquely named fixture created by this test.
  if (albumId) {
    const remaining = await db.galleryMedia.findMany({
      where: { albumId, album: { slug } },
    });
    await db.galleryAlbum.deleteMany({ where: { id: albumId, slug } });
    for (const item of remaining) {
      if (/^[0-9a-f-]{36}\.(png|mp4)$/.test(item.storageKey))
        await unlink(path.join(root, item.storageKey)).catch(() => {});
    }
  }
  await db.$disconnect();
}
