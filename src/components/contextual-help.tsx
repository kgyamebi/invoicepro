"use client";

import { useId, useState } from "react";

export function ContextualHelp({ title, children }: { title: string; children: React.ReactNode }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex align-middle">
      <button
        type="button"
        className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-line text-[11px] font-semibold text-muted hover:border-accent hover:text-accent"
        aria-expanded={open}
        aria-controls={id}
        title={title}
        onClick={() => setOpen((value) => !value)}
      >
        ?
      </button>
      {open ? (
        <span
          id={id}
          role="note"
          className="absolute left-0 top-7 z-20 w-64 rounded-[10px] border border-line bg-white p-3 text-xs leading-5 text-ink shadow-[var(--shadow-sm)]"
        >
          <p className="font-medium">{title}</p>
          <div className="mt-1 text-muted">{children}</div>
          <button type="button" className="mt-2 text-accent" onClick={() => setOpen(false)}>
            Close
          </button>
        </span>
      ) : null}
    </span>
  );
}
