import assert from "node:assert/strict";
import { randomBytes, scryptSync } from "node:crypto";
import { unlink } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import nextEnv from "@next/env";
import { PrismaClient } from "@prisma/client";

nextEnv.loadEnvConfig(process.cwd());
const db = new PrismaClient();
const base = process.env.CHECK_URL || "http://localhost:3001";
const tag = "image-check-" + Date.now();
const email = tag + "@example.test";
const password = randomBytes(20).toString("hex");
const salt = randomBytes(16).toString("hex");
let cookie = "";
const files = new Set();
const originalPages = new Map();
const decode = (s) =>
  s.replaceAll("&quot;", '"').replaceAll("&amp;", "&").replaceAll("&#x27;", "'");
async function submit(route, values, marker = 'name="title"') {
  const html = await (await fetch(base + route, { headers: { Cookie: cookie } })).text();
  const form = [...html.matchAll(/<form\b[^>]*>[\s\S]*?<\/form>/g)]
    .map((m) => m[0])
    .find((f) => f.includes(marker));
  assert.ok(form, "Form on " + route);
  const data = new FormData();
  for (const input of form.matchAll(/<input\b[^>]*>/g)) {
    if (!input[0].includes('type="hidden"')) continue;
    const name = input[0].match(/name="([^"]*)"/)?.[1];
    if (name)
      data.set(decode(name), decode(input[0].match(/value="([^"]*)"/)?.[1] || ""));
  }
  for (const [key, value] of Object.entries(values))
    data.set(key, value instanceof File ? value : String(value));
  return fetch(base + route, {
    method: "POST",
    body: data,
    redirect: "manual",
    headers: { Cookie: cookie, Origin: base },
  });
}
const pixels = await sharp({
  create: { width: 100, height: 140, channels: 3, background: "#265980" },
})
  .png()
  .toBuffer();
const image = () => new File([pixels], "photo.png", { type: "image/png" });
async function checkImage(url, published) {
  assert.ok(url?.startsWith("/api/content/images/"));
  files.add(url);
  assert.equal((await fetch(base + url)).status, published ? 200 : 404);
  const response = await fetch(base + url, { headers: { Cookie: cookie } });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "image/webp");
}
try {
  await db.admin.create({
    data: {
      email,
      name: "Temporary image test",
      passwordHash: salt + ":" + scryptSync(password, salt, 64).toString("hex"),
    },
  });
  const login = await submit("/admin/login", { email, password }, 'name="email"');
  assert.equal(login.status, 303);
  cookie = login.headers.get("set-cookie").split(";")[0];
  const cases = [
    {
      model: db.blogPost,
      route: "/admin/blog",
      fields: {
        title: tag,
        slug: tag,
        excerpt: "An integration test excerpt.",
        content: "An integration test article with enough content.",
      },
      visible: "published",
      publicRoute: "/blog/" + tag,
    },
    {
      model: db.job,
      route: "/admin/jobs",
      fields: {
        title: tag,
        slug: tag,
        company: "Test company",
        country: "Nepal",
        city: "Kathmandu",
        category: "Testing",
        type: "Full-time",
        salary: "Negotiable",
        vacancies: 1,
        description: "Integration test description.",
        requirements: "Integration test requirements.",
      },
      visible: "active",
      publicRoute: "/",
    },
    {
      model: db.legalDocument,
      route: "/admin/documents",
      fields: { title: tag, displayOrder: 0 },
      visible: "published",
      publicRoute: "/about/legal-documents",
      document: true,
    },
  ];
  for (const test of cases) {
    const createRoute = test.document ? test.route : test.route + "/new";
    const oversized = await submit(createRoute, {
      ...test.fields,
      image: new File([new Uint8Array(1024 * 1024)], "large.png", { type: "image/png" }),
    });
    assert.ok((await oversized.text()).includes("Photos must be under 1 MB."));
    const invalid = await submit(createRoute, {
      ...test.fields,
      image: new File(["invalid"], "fake.png", { type: "image/png" }),
    });
    assert.ok((await invalid.text()).includes("Choose a JPG, PNG, or WebP image."));
    await submit(createRoute, { ...test.fields, image: image() });
    let row = await test.model.findFirstOrThrow({ where: { title: tag } });
    const url = () => (test.document ? row.url : row.imageUrl);
    await checkImage(url(), false);
    const editRoute = test.document ? test.route : test.route + "/" + row.id;
    const marker = test.document ? `value="${row.id}"` : 'name="title"';
    const fields = { ...test.fields, id: row.id, [test.visible]: "on" };
    const old = url();
    await submit(editRoute, fields, marker);
    row = await test.model.findUniqueOrThrow({ where: { id: row.id } });
    assert.equal(url(), old);
    await checkImage(url(), true);
    assert.ok((await (await fetch(base + test.publicRoute)).text()).includes(url()));
    await submit(editRoute, { ...fields, image: image() }, marker);
    row = await test.model.findUniqueOrThrow({ where: { id: row.id } });
    assert.notEqual(url(), old);
    await checkImage(url(), true);
    assert.equal((await fetch(base + old)).status, 404);
    if (!test.document) {
      const replaced = url();
      await submit(editRoute, { ...fields, removeImage: "on" }, marker);
      row = await test.model.findUniqueOrThrow({ where: { id: row.id } });
      assert.equal(url(), null);
      assert.equal((await fetch(base + replaced)).status, 404);
    }
    console.log(
      "PASS upload, validation, privacy, publish, preserve, replace:",
      test.route,
    );
  }
  // Verify leadership pages without deleting or replacing the owner's existing portrait.
  for (const slug of ["chairman-message", "managing-director-message"]) {
    const original = await db.contentPage.findUnique({ where: { slug } });
    originalPages.set(slug, original);
    if (original?.imageUrl) {
      console.log("Existing leadership portrait preserved; skipping mutation:", slug);
      continue;
    }
    const fields = {
      slug,
      title: original?.title || "Leadership message",
      content:
        original?.content || "A temporary leadership message used for verification.",
    };
    const route = "/admin/pages/" + slug;
    await submit(route, { ...fields, image: image() });
    const row = await db.contentPage.findUniqueOrThrow({ where: { slug } });
    await checkImage(row.imageUrl, true);
    assert.ok(
      (await (await fetch(base + "/about/" + slug)).text()).includes(row.imageUrl),
    );
    await submit(route, { ...fields, removeImage: "on" });
    assert.equal(
      (await db.contentPage.findUniqueOrThrow({ where: { slug } })).imageUrl,
      null,
    );
    console.log("PASS leadership image upload, public display and removal:", slug);
  }
} finally {
  await db.blogPost.deleteMany({ where: { title: tag } });
  await db.job.deleteMany({ where: { title: tag } });
  await db.legalDocument.deleteMany({ where: { title: tag } });
  for (const [slug, original] of originalPages) {
    if (original) await db.contentPage.update({ where: { slug }, data: original });
    else await db.contentPage.deleteMany({ where: { slug } });
  }
  for (const url of files)
    await unlink(
      path.join(
        process.env.CONTENT_IMAGE_STORAGE_DIR || "storage/content",
        url.split("/").pop(),
      ),
    ).catch(() => {});
  await db.admin.deleteMany({ where: { email } });
  await db.$disconnect();
}
