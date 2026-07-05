import { postingDomain } from "@/lib/url";

// Small external-link icon button used on role rows/cards. Rendered as a
// sibling of a stretched navigation link (relative z-10), so it opens the
// posting without triggering row navigation.
export default function PostingLink({
  url,
  className = "",
}: {
  url: string;
  className?: string;
}) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title={`Open posting — ${postingDomain(url)}`}
      aria-label={`Open job posting on ${postingDomain(url)}`}
      className={`relative z-10 flex h-7 w-7 flex-none items-center justify-center rounded-[5px] border border-transparent text-text-tertiary transition-colors hover:border-border-strong hover:bg-surface-muted hover:text-accent focus-visible:outline-2 focus-visible:outline-accent ${className}`}
    >
      <ExternalIcon />
    </a>
  );
}

export function ExternalIcon({ size = 13 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 17 17 7" />
      <path d="M9 7h8v8" />
    </svg>
  );
}
