"use client";

import React from "react";

/**
 * A bottom sheet on phones, a centred panel on desktop. Escape and the backdrop close it;
 * focus moves into the sheet on open and returns to the opener on close.
 */
export function Sheet({ open, onClose, label, children, footer }: { open: boolean; onClose: () => void; label: string; children: React.ReactNode; footer?: React.ReactNode }) {
  const panel = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => panel.current?.focus());
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = overflow; opener?.focus?.(); };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center md:items-center" role="presentation">
      <button type="button" aria-label="Close" tabIndex={-1} onClick={onClose} className="absolute inset-0 h-full w-full cursor-default bg-velora-night/55" />
      <div ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-label={label} className="relative flex max-h-[88svh] w-full max-w-lg flex-col rounded-t-[28px] bg-velora-surface outline-none md:rounded-[28px]">
        <div aria-hidden className="mx-auto mt-3 h-1 w-10 rounded-full bg-velora-line md:hidden" />
        <div className="overflow-y-auto px-6 pb-4 pt-6 sm:px-8">{children}</div>
        {footer && <div className="border-t border-velora-line px-6 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:px-8">{footer}</div>}
      </div>
    </div>
  );
}
