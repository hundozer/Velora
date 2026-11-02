"use client";
import { useTranslation } from "@/context/LanguageContext";
import { PublicMediaGallery } from "@/components/community/PublicMediaGallery";
import Link from "next/link";

export default function PhotosPage() {
  const { t } = useTranslation();
  return <><div className="mx-auto flex max-w-7xl gap-2 px-4 pt-6 sm:px-6 lg:px-8"><Link href="/photos" className="rounded-lg bg-velora-accent px-4 py-2 text-sm font-bold text-velora-paper">{t("Individual photos")}</Link><Link href="/albums" className="rounded-lg border border-ink/15 px-4 py-2 text-sm font-semibold text-ink">{t("Photo albums")}</Link></div><PublicMediaGallery type="IMAGE" /></>;
}
