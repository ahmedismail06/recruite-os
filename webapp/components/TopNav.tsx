"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { addRole } from "@/app/actions";

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/roles", label: "Roles" },
  { href: "/contacts", label: "Contacts" },
  { href: "/profile", label: "Profile" },
];

export default function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const [addOpen, setAddOpen] = useState(false);

  const showFilter = pathname === "/" || pathname === "/roles";
  const urlQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(urlQuery);
  const [lastUrlQuery, setLastUrlQuery] = useState(urlQuery);
  if (lastUrlQuery !== urlQuery) {
    setLastUrlQuery(urlQuery);
    setQuery(urlQuery);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (document.activeElement?.tagName ?? "").toLowerCase();
      if (e.key === "/" && tag !== "input" && tag !== "textarea") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") setAddOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function onQueryChange(value: string) {
    setQuery(value);
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("q", value);
    else params.delete("q");
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }

  return (
    <header className="border-b border-border bg-surface">
      <div className="flex h-[60px] items-center justify-between px-7">
        <div className="flex items-center gap-[26px]">
          <span className="font-mono text-xs font-semibold tracking-[0.08em] text-text-primary">
            RECRUITING OS
          </span>
          <nav className="flex items-center gap-5">
            {NAV.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`pb-[19px] text-[13.5px] transition-colors ${
                    active
                      ? "border-b-2 border-accent font-semibold text-text-primary"
                      : "text-text-tertiary hover:text-text-primary"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {showFilter && (
            <div className="relative flex items-center">
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                placeholder="Filter company or title"
                className="h-[34px] w-60 rounded-[7px] border border-border-strong bg-card pr-8 pl-3 text-[13px] text-text-primary outline-none transition-colors focus:border-accent"
              />
              <span className="absolute right-[9px] rounded-[3px] border border-border bg-bg px-1 font-mono text-[10px] text-text-tertiary">
                /
              </span>
            </div>
          )}
          <button
            onClick={() => setAddOpen(true)}
            className="h-[34px] cursor-pointer rounded-[7px] bg-accent px-3.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
          >
            + Add role
          </button>
        </div>
      </div>
      {addOpen && <AddRoleModal onClose={() => setAddOpen(false)} />}
    </header>
  );
}

function AddRoleModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/20 pt-[15vh]"
      onClick={onClose}
    >
      <form
        action={addRole}
        onClick={(e) => e.stopPropagation()}
        className="w-[520px] rounded-lg border border-border bg-surface p-5 shadow-lg"
      >
        <div className="mb-4 text-sm font-semibold text-text-primary">
          Add role
        </div>
        <div className="flex flex-col gap-3">
          <input
            name="company"
            required
            autoFocus
            placeholder="Company"
            className="h-[34px] rounded-[7px] border border-border-strong px-3 text-[13px] outline-none transition-colors focus:border-accent"
          />
          <input
            name="title"
            required
            placeholder="Title"
            className="h-[34px] rounded-[7px] border border-border-strong px-3 text-[13px] outline-none transition-colors focus:border-accent"
          />
          <input
            name="posting_url"
            type="url"
            placeholder="Posting link (https://…)"
            className="h-[34px] rounded-[7px] border border-border-strong px-3 font-mono text-xs outline-none transition-colors focus:border-accent"
          />
          <textarea
            name="jd_text"
            placeholder="Paste job description…"
            rows={5}
            className="rounded-[7px] border border-border-strong p-3 text-[13px] outline-none transition-colors focus:border-accent"
          />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-[34px] cursor-pointer rounded-[7px] px-3 text-[13px] text-text-secondary"
          >
            Cancel
          </button>
          <button className="h-[34px] cursor-pointer rounded-[7px] bg-accent px-3.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90">
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
