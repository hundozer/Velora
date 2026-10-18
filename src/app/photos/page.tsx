import { PublicMediaGallery } from "@/components/community/PublicMediaGallery";
import Link from "next/link";

export default function PhotosPage() {
  return <><div className="mx-auto flex max-w-7xl gap-2 px-4 pt-6 sm:px-6 lg:px-8"><Link href="/photos" className="rounded-lg bg-velora-accent px-4 py-2 text-sm font-bold text-velora-paper">Individual photos</Link><Link href="/albums" className="rounded-lg border border-ink/15 px-4 py-2 text-sm font-semibold text-ink">Photo albums</Link></div><PublicMediaGallery type="IMAGE" /></>;
}
