"use client";

import React from "react";
import { Check as CheckIcon, Search } from "lucide-react";
import { Sheet } from "@/components/editorial/Sheet";
import { DESIRES, DESIRE_CATEGORIES, MAX_DESIRE_FILTERS, desireById } from "@/lib/desires.mjs";
import { DISTANCE_OPTIONS, WHO_OPTIONS } from "@/lib/people.mjs";

export type Filters = { who: string[]; minAge: number; maxAge: number; withinKm: number | null; desires: string[]; hasPhoto: boolean; verified: boolean; q: string };
export const DEFAULT_FILTERS: Filters = { who: [], minAge: 18, maxAge: 99, withinKm: null, desires: [], hasPhoto: false, verified: false, q: "" };

const WHO_WORDS: Record<string, string> = { WOMEN: "women", MEN: "men", COUPLES: "couples", OTHER: "non-binary & trans people" };
const DESIRE_GROUPS = DESIRE_CATEGORIES.map((category) => ({ ...category, desires: DESIRES.filter((desire) => desire.category === category.id) }));
const listWords = (words: string[]) => words.length <= 1 ? words.join("") : `${words.slice(0, -1).join(", ")} and ${words[words.length - 1]}`;

/** A word in the filter sentence: looks like text, opens the sheet at its section. */
function Word({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="inline text-velora-copperInk underline decoration-velora-copper decoration-dotted decoration-2 underline-offset-[5px] hover:decoration-solid">
      {children}
    </button>
  );
}

/**
 * Filters read as a sentence (approved v33): "Showing everyone within 5 km, here now first."
 * Tapping a word opens a typographic sheet. Search sits underneath as a quiet underline.
 */
export function FilterSentence({ filters, onOpen, onSearch }: { filters: Filters; onOpen: (section: string) => void; onSearch: (q: string) => void }) {
  const [q, setQ] = React.useState(filters.q);
  React.useEffect(() => setQ(filters.q), [filters.q]);
  React.useEffect(() => {
    if (q === filters.q) return;
    const timer = window.setTimeout(() => onSearch(q), 350);
    return () => window.clearTimeout(timer);
  }, [q, filters.q, onSearch]);

  const who = filters.who.length === 0 || filters.who.length === WHO_OPTIONS.length ? "everyone" : listWords(filters.who.map((value) => WHO_WORDS[value] || value));
  const extras: { key: string; text: string }[] = [];
  if (filters.minAge !== 18 || filters.maxAge !== 99) extras.push({ key: "age", text: `aged ${filters.minAge} to ${filters.maxAge}` });
  if (filters.verified) extras.push({ key: "only", text: "with a verified photo" });
  if (filters.hasPhoto) extras.push({ key: "only", text: "with a photograph" });
  if (filters.desires.length) extras.push({ key: "into", text: `into ${listWords(filters.desires.map((id) => desireById(id)?.label?.toLowerCase() || id))}` });

  return (
    <div>
      <p className="text-[19px] leading-[1.75] text-velora-ink sm:text-[20px]">
        Showing <Word onClick={() => onOpen("who")}>{who}</Word>{" "}
        {filters.withinKm ? <>within <Word onClick={() => onOpen("within")}>{filters.withinKm} km</Word></> : <>across <Word onClick={() => onOpen("within")}>all Prague</Word></>}
        {extras.map((extra) => <React.Fragment key={extra.text}>, <Word onClick={() => onOpen(extra.key)}>{extra.text}</Word></React.Fragment>)}
        , here now first.{" "}
        {extras.length === 0 && <button type="button" onClick={() => onOpen("only")} className="text-[15px] text-velora-muted underline underline-offset-4 hover:text-velora-ink">More</button>}
      </p>
      <label className="mt-4 flex items-center gap-3 border-b border-velora-ink/70 pb-2 focus-within:border-velora-copperInk">
        <Search className="h-4 w-4 shrink-0 text-velora-ink" aria-hidden />
        <span className="sr-only">Search by name or neighbourhood</span>
        <input type="search" value={q} onChange={(event) => setQ(event.target.value)} maxLength={40} placeholder="Name or neighbourhood" className="w-full bg-transparent text-[17px] text-velora-ink placeholder:text-velora-muted focus:outline-none" />
      </label>
    </div>
  );
}

function Choice({ selected, onClick, children, type = "radio" }: { selected: boolean; onClick: () => void; children: React.ReactNode; type?: "radio" | "checkbox" }) {
  return (
    <button type="button" role={type} aria-checked={selected} onClick={onClick} className={`flex w-full items-baseline justify-between py-1.5 text-left font-display text-[28px] leading-tight transition-colors ${selected ? "text-velora-ink" : "text-velora-muted hover:text-velora-ink2"}`}>
      <span>{children}</span>
      {selected && <span className="font-sans text-[14px] text-velora-copperInk">Selected</span>}
    </button>
  );
}

function Check({ checked, onChange, children, disabled = false }: { checked: boolean; onChange: (value: boolean) => void; children: React.ReactNode; disabled?: boolean }) {
  return (
    <label className={`flex min-h-12 items-center justify-between gap-4 text-[16px] ${disabled ? "text-velora-muted" : "text-velora-ink"}`}>
      <span>{children}</span>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} className="h-6 w-6 shrink-0 rounded-none border-velora-ink/40 accent-velora-ink" />
    </label>
  );
}

const Label = ({ id, children }: { id: string; children: React.ReactNode }) => <h3 id={`filter-${id}`} className="mb-2 mt-8 scroll-mt-4 text-[13px] font-semibold uppercase tracking-[0.18em] text-velora-ink2">{children}</h3>;

/** Filter sheet with grouped interest chips and a persistent apply action. */
export function FilterSheet({ open, section, initial, sharedDesires, onClose, onApply }: {
  open: boolean; section: string; initial: Filters; sharedDesires: string[]; onClose: () => void; onApply: (filters: Filters) => void;
}) {
  const [draft, setDraft] = React.useState(initial);
  React.useEffect(() => { if (open) setDraft(initial); }, [open, initial]);
  React.useEffect(() => {
    if (!open || section === "who") return;
    requestAnimationFrame(() => document.getElementById(`filter-${section}`)?.scrollIntoView({ block: "start" }));
  }, [open, section]);
  const single = draft.who.length === 1 ? draft.who[0] : draft.who.length === 0 ? "" : null;
  const selectedInterestCount = draft.desires.length;
  const sharesMine = sharedDesires.length > 0 && sharedDesires.every((id) => draft.desires.includes(id)) && draft.desires.length === sharedDesires.length;
  const toggleDesire = (id: string) => setDraft((current) => ({ ...current, desires: current.desires.includes(id) ? current.desires.filter((value) => value !== id) : current.desires.length >= MAX_DESIRE_FILTERS ? current.desires : [...current.desires, id] }));

  return (
    <Sheet open={open} onClose={onClose} label="Who to show" footer={
      <div className="flex items-center gap-6">
        <button type="button" onClick={() => setDraft({ ...DEFAULT_FILTERS, q: draft.q })} className="min-h-11 text-[16px] text-velora-ink underline underline-offset-4">Reset</button>
        <button type="button" onClick={() => onApply({ ...draft, maxAge: Math.max(draft.minAge, draft.maxAge) })} className="min-h-14 flex-1 rounded-full bg-velora-accent text-[16px] font-semibold text-velora-paper hover:bg-velora-accentHover">Show people</button>
      </div>
    }>
      <h2 id="filter-who" className="font-display text-[40px] leading-none text-velora-ink">Show me</h2>
      <div role="radiogroup" aria-label="Show me" className="mt-4">
        <Choice selected={single === ""} onClick={() => setDraft({ ...draft, who: [] })}>Everyone</Choice>
        {WHO_OPTIONS.map((option) => <Choice key={option.value} selected={single === option.value} onClick={() => setDraft({ ...draft, who: [option.value] })}>{option.value === "OTHER" ? "Non-binary & trans people" : option.label}</Choice>)}
        {single === null && <p className="mt-1 text-[14px] text-velora-muted">Currently: {draft.who.map((value) => WHO_WORDS[value]).join(", ")}.</p>}
      </div>

      <Label id="within">Within</Label>
      <div role="radiogroup" aria-label="Within" className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
        {DISTANCE_OPTIONS.map((option) => (
          <button key={option.km} type="button" role="radio" aria-checked={draft.withinKm === option.km} onClick={() => setDraft({ ...draft, withinKm: option.km })} className={`min-h-11 border-b-2 font-display text-[30px] leading-tight ${draft.withinKm === option.km ? "border-velora-copper text-velora-ink" : "border-transparent text-velora-muted hover:text-velora-ink2"}`}>{option.km} km</button>
        ))}
        <button type="button" role="radio" aria-checked={draft.withinKm === null} onClick={() => setDraft({ ...draft, withinKm: null })} className={`min-h-11 border-b-2 font-display text-[30px] leading-tight ${draft.withinKm === null ? "border-velora-copper text-velora-ink" : "border-transparent text-velora-muted hover:text-velora-ink2"}`}>All Prague</button>
      </div>
      <p className="mt-2 text-[14px] text-velora-muted">Measured between Prague areas, never exact positions.</p>

      <Label id="age">Aged</Label>
      <div className="flex items-baseline gap-3 font-display text-[28px] text-velora-ink">
        <input type="number" inputMode="numeric" min={18} max={99} value={draft.minAge} aria-label="Youngest age" onChange={(event) => setDraft({ ...draft, minAge: Math.min(99, Math.max(18, Number(event.target.value) || 18)) })} className="w-16 border-b border-velora-ink/40 bg-transparent text-center focus:border-velora-copperInk focus:outline-none" />
        <span className="text-velora-muted">to</span>
        <input type="number" inputMode="numeric" min={18} max={99} value={draft.maxAge} aria-label="Oldest age" onChange={(event) => setDraft({ ...draft, maxAge: Math.min(99, Math.max(18, Number(event.target.value) || 99)) })} className="w-16 border-b border-velora-ink/40 bg-transparent text-center focus:border-velora-copperInk focus:outline-none" />
      </div>

      <Label id="only">Only</Label>
      <Check checked={draft.verified} onChange={(verified) => setDraft({ ...draft, verified })}>People with a verified photo</Check>
      <Check checked={draft.hasPhoto} onChange={(hasPhoto) => setDraft({ ...draft, hasPhoto })}>People with a photograph</Check>
      <Check checked={sharesMine} disabled={sharedDesires.length === 0} onChange={(on) => setDraft({ ...draft, desires: on ? sharedDesires : [] })}>
        People who share your interests{sharedDesires.length === 0 && <span className="block text-[14px] text-velora-muted">Add what you&apos;re into on your profile first.</span>}
      </Check>

      <section aria-labelledby="filter-into" className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 id="filter-into" className="scroll-mt-4 text-[13px] font-semibold uppercase tracking-[0.18em] text-velora-ink2">Into</h3>
          <p role="status" aria-live="polite" aria-atomic="true" className="text-sm font-semibold text-velora-accent">{selectedInterestCount} of {MAX_DESIRE_FILTERS} selected</p>
        </div>
        <p id="interest-filter-hint" className="mt-2 text-sm leading-relaxed text-velora-muted">
          {selectedInterestCount >= MAX_DESIRE_FILTERS ? "Remove a selection to choose another." : "Choose up to five interests. You can mix categories."}
        </p>
        {selectedInterestCount > 0 && <button type="button" onClick={() => setDraft((current) => ({ ...current, desires: [] }))} className="mt-1 min-h-11 text-sm font-semibold text-velora-accent underline underline-offset-4">Clear interests</button>}
        <div className="mt-5 space-y-6">
          {DESIRE_GROUPS.map((category) => (
            <fieldset key={category.id} className="min-w-0 border-t border-velora-line pt-4">
              <legend className="pr-3 text-sm font-semibold text-velora-ink">{category.label}</legend>
              <div className="flex flex-wrap gap-2">
                {category.desires.map((desire) => {
                  const selected = draft.desires.includes(desire.id);
                  return (
                    <button key={desire.id} type="button" aria-pressed={selected} aria-describedby="interest-filter-hint" disabled={!selected && selectedInterestCount >= MAX_DESIRE_FILTERS} onClick={() => toggleDesire(desire.id)} className={`inline-flex min-h-11 max-w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-[15px] leading-snug transition-colors disabled:cursor-not-allowed disabled:border-velora-line disabled:text-velora-muted ${selected ? "border-velora-accent bg-velora-accent font-semibold text-velora-paper" : "border-velora-control bg-velora-paper/40 text-velora-ink2 hover:border-velora-accent hover:bg-velora-blush hover:text-velora-ink"}`}>
                      {selected && <CheckIcon className="h-4 w-4 shrink-0" aria-hidden />}
                      <span>{desire.label}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>
      </section>
    </Sheet>
  );
}
