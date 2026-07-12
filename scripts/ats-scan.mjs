#!/usr/bin/env node
/**
 * ats-scan — fetch open postings from Greenhouse/Lever/Ashby public job-board
 * APIs for a list of companies. Read-only outbound HTTP GETs; never touches
 * any database or file. Called by the ats-scan skill, not run on a schedule.
 *
 * Input (stdin): JSON array, e.g.
 *   [{"company":"Acme","platform":"greenhouse","slug":"acme"}]
 * Output (stdout): JSON array of normalized postings. Per-company fetch
 * failures (bad slug, API error) go to stderr and are skipped, not fatal.
 */

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

function stripHtml(html) {
  if (!html) return "";
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<\/(p|div|li|br|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;|&rsquo;/g, "'")
    .replace(/&quot;|&ldquo;|&rdquo;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function fetchGreenhouse(company, slug) {
  const res = await fetch(
    `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs?content=true`
  );
  if (!res.ok) throw new Error(`greenhouse ${slug}: HTTP ${res.status}`);
  const data = await res.json();
  return (data.jobs || []).map((job) => ({
    company,
    platform: "greenhouse",
    external_id: String(job.id),
    title: job.title,
    location: job.location?.name || null,
    url: job.absolute_url,
    posted_at: job.updated_at || null,
    jd_text: stripHtml(job.content),
  }));
}

async function fetchLever(company, slug) {
  const res = await fetch(`https://api.lever.co/v0/postings/${slug}?mode=json`);
  if (!res.ok) throw new Error(`lever ${slug}: HTTP ${res.status}`);
  const data = await res.json();
  return (Array.isArray(data) ? data : []).map((job) => ({
    company,
    platform: "lever",
    external_id: job.id,
    title: job.text,
    location: job.categories?.location || null,
    url: job.hostedUrl,
    posted_at: job.createdAt ? new Date(job.createdAt).toISOString() : null,
    jd_text: stripHtml(job.descriptionPlain || job.description),
  }));
}

async function fetchAshby(company, slug) {
  const res = await fetch(`https://api.ashbyhq.com/posting-api/job-board/${slug}`);
  if (!res.ok) throw new Error(`ashby ${slug}: HTTP ${res.status}`);
  const data = await res.json();
  return (data.jobs || []).map((job) => ({
    company,
    platform: "ashby",
    external_id: job.id,
    title: job.title,
    location: job.location || null,
    url: job.jobUrl || job.applyUrl,
    posted_at: job.publishedAt || null,
    jd_text: stripHtml(job.descriptionPlain || job.descriptionHtml),
  }));
}

const FETCHERS = {
  greenhouse: fetchGreenhouse,
  lever: fetchLever,
  ashby: fetchAshby,
};

async function main() {
  const raw = await readStdin();
  let companies;
  try {
    companies = JSON.parse(raw);
  } catch (err) {
    console.error(`invalid JSON on stdin: ${err.message}`);
    process.exit(1);
  }
  if (!Array.isArray(companies)) {
    console.error("expected a JSON array of {company, platform, slug}");
    process.exit(1);
  }

  const results = await Promise.allSettled(
    companies.map(({ company, platform, slug }) => {
      const fetcher = FETCHERS[platform];
      if (!fetcher) {
        return Promise.reject(
          new Error(`${company}: unknown platform "${platform}"`)
        );
      }
      return fetcher(company, slug);
    })
  );

  const postings = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      postings.push(...result.value);
    } else {
      console.error(result.reason?.message || String(result.reason));
    }
  }

  process.stdout.write(JSON.stringify(postings, null, 2));
}

main();
