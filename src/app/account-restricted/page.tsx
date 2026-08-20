import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/Card";

export default function AccountRestrictedPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-3xl items-center px-4 py-16">
      <Card className="w-full p-8 text-center sm:p-12">
        <AlertTriangle className="mx-auto mb-5 h-12 w-12 text-amber-400" aria-hidden="true" />
        <h1 className="font-serif text-3xl font-semibold text-white">Account access is limited</h1>
        <p className="mx-auto mt-4 max-w-xl text-slate-300">
          This account cannot currently use member features. Contact Intimo support if you believe this is a mistake.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link className="rounded-full bg-gold-gradient px-5 py-2.5 text-sm font-medium text-velora-bg" href="mailto:contact@intimo.live">Contact support</Link>
          <Link className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-medium text-white hover:bg-white/10" href="/auth/logout?returnTo=%2F">Sign out</Link>
        </div>
      </Card>
    </main>
  );
}
