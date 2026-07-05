"use client";

import { useState } from "react";

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="cursor-pointer rounded-[6px] border border-border-strong px-2 py-1 text-[11px] font-semibold text-text-mid transition-colors hover:bg-surface-muted"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
