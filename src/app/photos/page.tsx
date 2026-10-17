import { PublicMediaGallery } from "@/components/community/PublicMediaGallery";
import Link from "next/link";

export default function PhotosPage() {
  return <><div className="mx-auto flex max-w-7xl gap-2 px-4 pt-6 sm:px-6 lg:px-8"><Link href="/photos" className="rounded-lg bg-amber-300 px-4 py-2 text-sm font-bold text-slate-950">Individual photos</Link><Link href="/albums" className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-white">Photo albums</Link></div><PublicMediaGallery type="IMAGE" /></>;
}
