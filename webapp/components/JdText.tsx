const URL_RE = /https?:\/\/[^\s<>"')\]]+/g;

// Renders raw JD text with URLs turned into real links (postings pasted into
// jd_text were previously dead text). Trailing sentence punctuation is kept
// out of the href.
export default function JdText({ text }: { text: string }) {
  const nodes: React.ReactNode[] = [];
  let cursor = 0;
  for (const match of text.matchAll(URL_RE)) {
    const raw = match[0];
    const trimmed = raw.replace(/[.,;:!?]+$/, "");
    const start = match.index;
    if (start > cursor) nodes.push(text.slice(cursor, start));
    nodes.push(
      <a
        key={start}
        href={trimmed}
        target="_blank"
        rel="noopener noreferrer"
        className="break-all text-accent underline decoration-accent/40 underline-offset-2 transition-colors hover:decoration-accent"
      >
        {trimmed}
      </a>
    );
    cursor = start + trimmed.length;
  }
  if (cursor < text.length) nodes.push(text.slice(cursor));

  return (
    <pre className="max-h-96 overflow-y-auto rounded-[7px] border border-border p-4 font-sans text-xs leading-relaxed whitespace-pre-wrap text-text-mid">
      {nodes}
    </pre>
  );
}
