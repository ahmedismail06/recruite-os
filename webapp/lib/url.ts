// Display helper: "https://boards.greenhouse.io/foo/jobs/123" → "boards.greenhouse.io"
export function postingDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
