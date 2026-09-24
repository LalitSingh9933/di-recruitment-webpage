import assert from "node:assert/strict";
import nextEnv from "@next/env";
import { PrismaClient } from "@prisma/client";
import sharp from "sharp";
import { unlink } from "node:fs/promises";
import path from "node:path";
nextEnv.loadEnvConfig(process.cwd());
const db = new PrismaClient();
const base = process.env.CHECK_URL || "http://localhost:3001";
let cookie = "";
const tag = "check-" + Date.now();
const created = { posts: [], members: [], documents: [] };
function decode(text) {
  return text
    .replaceAll("&quot;", '"')
    .replaceAll("&amp;", "&")
    .replaceAll("&#x27;", "'");
}
async function html(path, auth = true) {
  const response = await fetch(base + path, {
    headers: auth && cookie ? { Cookie: cookie } : {},
  });
  assert.equal(response.status, 200, path);
  return response.text();
}
async function submit(path, fields, marker) {
  const page = await html(path);
  const forms = [...page.matchAll(/<form\b[^>]*>[\s\S]*?<\/form>/g)].map((m) => m[0]);
  const form = forms.find((f) => f.includes(marker));
  assert.ok(form, "Form found on " + path);
  const data = new FormData();
  for (const input of form.matchAll(/<input\b[^>]*>/g)) {
    if (!input[0].includes('type="hidden"')) continue;
    const name = input[0].match(/name="([^"]*)"/)?.[1];
    if (name)
      data.append(decode(name), decode(input[0].match(/value="([^"]*)"/)?.[1] || ""));
  }
  for (const [key, value] of Object.entries(fields))
    data.set(key, value instanceof File ? value : String(value));
  return fetch(base + path, {
    method: "POST",
    body: data,
    redirect: "manual",
    headers: { Origin: base, ...(cookie ? { Cookie: cookie } : {}) },
  });
}
try {
  const unauthorized = await fetch(base + "/admin/team", { redirect: "manual" });
  assert.equal(unauthorized.status, 307);
  const login = await submit(
    "/admin/login",
    { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD },
    'name="email"',
  );
  cookie = login.headers.get("set-cookie")?.split(";")[0];
  assert.ok(cookie);
  assert.equal(login.status, 303);
  for (const path of [
    "/",
    "/blog",
    "/team",
    "/admin/blog",
    "/admin/team",
    "/admin/documents",
    "/admin/pages",
    "/about/introduction",
    "/about/vision-mission-goals",
    "/about/chairman-message",
    "/about/legal-documents",
  ])
    await html(path);
  console.log("PASS: public pages, protected admin pages, and login.");
  const postData = {
    title: tag + " article",
    slug: tag,
    excerpt: "An integration check introduction.",
    content: "An integration check article with sufficient content.",
  };
  assert.equal((await submit("/admin/blog/new", postData, 'name="title"')).status, 303);
  const post = await db.blogPost.findUniqueOrThrow({ where: { slug: tag } });
  created.posts.push(post.id);
  assert.equal((await fetch(base + "/blog/" + tag)).status, 404);
  assert.equal(
    (
      await submit(
        "/admin/blog/" + post.id,
        { ...postData, published: "on" },
        'name="title"',
      )
    ).status,
    303,
  );
  assert.ok((await html("/blog/" + tag, false)).includes(postData.title));
  assert.ok((await html("/", false)).includes(postData.title));
  assert.equal(
    (
      await submit(
        "/admin/blog/" + post.id,
        { ...postData, title: tag + " edited" },
        'name="title"',
      )
    ).status,
    303,
  );
  assert.equal((await fetch(base + "/blog/" + tag)).status, 404);
  assert.equal(
    (await db.blogPost.findUniqueOrThrow({ where: { id: post.id } })).title,
    tag + " edited",
  );
  await submit("/admin/blog", {}, 'value="' + post.id + '"');
  assert.equal(await db.blogPost.findUnique({ where: { id: post.id } }), null);
  console.log(
    "PASS: blog create, publish, homepage display, edit, unpublish, and delete.",
  );
  const memberData = {
    name: tag + " director",
    position: "Managing Director",
    bio: "Integration check biography.",
    photoUrl: "",
    displayOrder: "1",
    published: "on",
  };
  assert.equal((await submit("/admin/team/new", memberData, 'name="name"')).status, 303);
  const member = await db.teamMember.findFirstOrThrow({
    where: { name: memberData.name },
  });
  created.members.push(member.id);
  assert.ok((await html("/team", false)).includes(memberData.name));
  const secondData = {
    ...memberData,
    name: tag + " officer",
    position: "Recruitment Officer",
    displayOrder: "2",
  };
  await submit("/admin/team/new", secondData, 'name="name"');
  const second = await db.teamMember.findFirstOrThrow({
    where: { name: secondData.name },
  });
  created.members.push(second.id);
  const teamPage = await html("/team", false);
  assert.ok(teamPage.indexOf(memberData.name) < teamPage.indexOf(secondData.name));
  const { published, ...hidden } = memberData;
  assert.equal(
    (
      await submit(
        "/admin/team/" + member.id,
        { ...hidden, position: "Chairman" },
        'name="name"',
      )
    ).status,
    303,
  );
  assert.ok(!(await html("/team", false)).includes(memberData.name));
  assert.equal(
    (await db.teamMember.findUniqueOrThrow({ where: { id: member.id } })).position,
    "Chairman",
  );
  await submit("/admin/team", {}, 'value="' + member.id + '"');
  assert.equal(await db.teamMember.findUnique({ where: { id: member.id } }), null);
  console.log("PASS: team create, position, ordering, edit, hide, and delete.");
  const docData = {
    title: tag + " document",
    image: new File(
      [
        await sharp({
          create: { width: 50, height: 70, channels: 3, background: "white" },
        })
          .png()
          .toBuffer(),
      ],
      "document.png",
      { type: "image/png" },
    ),
    displayOrder: 1,
    published: "on",
  };
  await submit("/admin/documents", docData, 'name="title"');
  const document = await db.legalDocument.findFirstOrThrow({
    where: { title: docData.title },
  });
  assert.ok((await html("/about/legal-documents", false)).includes(docData.title));
  const { published: docPublished, image: docImage, ...hiddenDocument } = docData;
  await submit(
    "/admin/documents",
    { ...hiddenDocument, id: document.id },
    'name="title"',
  );
  assert.ok(!(await html("/about/legal-documents", false)).includes(docData.title));
  console.log("PASS: legal document publishing and hiding.");
} finally {
  await db.blogPost.deleteMany({ where: { id: { in: created.posts }, slug: tag } });
  await db.teamMember.deleteMany({
    where: { id: { in: created.members }, name: { startsWith: tag } },
  });
  const documents = await db.legalDocument.findMany({
    where: { title: tag + " document" },
  });
  await db.legalDocument.deleteMany({ where: { title: tag + " document" } });
  for (const document of documents) {
    if (document.url.startsWith("/api/content/images/"))
      await unlink(
        path.join(
          process.env.CONTENT_IMAGE_STORAGE_DIR || "storage/content",
          document.url.split("/").pop(),
        ),
      ).catch(() => {});
  }
  await db.$disconnect();
}
