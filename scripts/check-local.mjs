import nextEnv from "@next/env";
nextEnv.loadEnvConfig(process.cwd());
const base = process.env.CHECK_URL || "http://localhost:3001";
const page = await (await fetch(`${base}/admin/login`)).text();
const data = new FormData();
for (const tag of page.matchAll(/<input[^>]*type="hidden"[^>]*>/g)) {
  const name = tag[0].match(/name="([^"]*)"/)?.[1];
  const value = (tag[0].match(/value="([^"]*)"/)?.[1] || "")
    .replaceAll("&quot;", '"')
    .replaceAll("&amp;", "&");
  if (name) data.append(name, value);
}
data.set("email", process.env.ADMIN_EMAIL);
data.set("password", process.env.ADMIN_PASSWORD);
const login = await fetch(`${base}/admin/login`, {
  method: "POST",
  body: data,
  redirect: "manual",
  headers: { Origin: base },
});
const cookie = login.headers.get("set-cookie")?.split(";")[0];
if (!cookie || login.status !== 303) throw new Error(`Login failed: ${login.status}`);
console.log("PASS: admin login creates a session and redirects.");
for (const route of ["/admin", "/admin/jobs", "/admin/applications", "/admin/jobs/new"]) {
  const response = await fetch(base + route, { headers: { Cookie: cookie } });
  const body = await response.text();
  if (!response.ok || body.includes("NEXT_HTTP_ERROR_FALLBACK;500"))
    throw new Error(`Failed ${route}`);
  console.log(`PASS: ${route}`);
}
const jobsResponse = await fetch(`${base}/api/jobs`);
const jobs = await jobsResponse.json();
if (!jobsResponse.ok || !Array.isArray(jobs) || !jobs.length)
  throw new Error("Jobs API failed");
console.log(`PASS: ${jobs.length} jobs loaded from MySQL.`);
