"use client";

import React from "react";
import Link from "next/link";
import { Bookmark, Heart, Image as ImageIcon, Megaphone, Trash2, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { BehindTheDoorLanding } from "@/components/landing/BehindTheDoorLanding";

type SavedItem = { id: string; target_type: "PROFILE" | "MEDIA" | "POST" | "DATING_AD"; target_id: string; created_at: string; target: { type: string; id: string; title: string; subtitle?: string; description?: string; imageUrl?: string; age?: number; verified?: boolean; href: string } };

export default function FavoritesPage() {
  const { user } = useAuth();
  const [items, setItems] = React.useState<SavedItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const load = React.useCallback(() => { setLoading(true); fetch("/api/saved-items", { credentials: "same-origin", cache: "no-store" }).then(async (response) => { const payload = await response.json().catch(() => ({})); if (!response.ok) throw new Error(payload.error || "Saved items unavailable"); setItems(payload.items || []); }).catch((cause) => setError(cause.message || "Saved items unavailable")).finally(() => setLoading(false)); }, []);
  React.useEffect(load, [load]);
  async function remove(item: SavedItem) { setError(""); const params = new URLSearchParams({ targetType: item.target_type, targetId: item.target_id }); const response = await fetch(`/api/saved-items?${params}`, { method: "DELETE", credentials: "same-origin" }); if (response.ok) setItems((current) => current.filter((entry) => entry.id !== item.id)); else setError("That saved item could not be removed."); }
  if (!user) return <BehindTheDoorLanding />;
  return <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"><div className="flex items-center gap-3"><Heart className="h-7 w-7 fill-rose-400/20 text-rose-400" /><div><h1 className="font-serif text-3xl font-bold text-white">Saved items</h1><p className="mt-1 text-sm text-slate-400">Profiles, approved media, dating ads, and community posts you bookmarked.</p></div></div>
    {error && <p role="alert" className="mt-5 rounded-lg border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-100">{error}</p>}
    {loading ? <p className="mt-8 text-sm text-slate-400">Loading saved items…</p> : items.length ? <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map((item) => <article key={item.id} className="rounded-xl border border-white/10 bg-[#11151e] p-5"><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-2 text-amber-300">{icon(item.target_type)}<span className="text-xs font-semibold uppercase tracking-wider">{label(item.target_type)}</span></div><button onClick={() => remove(item)} className="rounded-lg p-2 text-slate-500 hover:bg-red-400/10 hover:text-red-300" aria-label={`Remove ${item.target.title} from saved items`}><Trash2 className="h-4 w-4" /></button></div><Link href={item.target.href} className="mt-4 block"><h2 className="font-semibold text-white">{item.target.title}{item.target.age ? `, ${item.target.age}` : ""}</h2>{item.target.subtitle && <p className="mt-1 text-xs text-amber-200">{item.target.subtitle}</p>}<p className="mt-3 line-clamp-3 text-sm leading-5 text-slate-400">{item.target.description || "Saved community item"}</p><span className="mt-4 inline-block text-xs font-semibold text-amber-300">Open item →</span></Link></article>)}</div> : <div className="mt-7 rounded-xl border border-dashed border-white/15 p-10 text-center"><Bookmark className="mx-auto h-7 w-7 text-slate-500" /><h2 className="mt-3 font-semibold text-white">Nothing saved yet</h2><p className="mt-1 text-sm text-slate-400">Use save controls on visible profiles, media, posts, or dating ads.</p></div>}
  </main>;
}

function icon(type: SavedItem["target_type"]) { if (type === "PROFILE") return <User className="h-4 w-4" />; if (type === "MEDIA") return <ImageIcon className="h-4 w-4" />; if (type === "DATING_AD") return <Megaphone className="h-4 w-4" />; return <Bookmark className="h-4 w-4" />; }
function label(type: SavedItem["target_type"]) { return type === "DATING_AD" ? "Dating ad" : type.toLowerCase(); }
