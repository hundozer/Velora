import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/Card";

export default function AccountRestrictedPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-3xl items-center px-4 py-16">
      <Card className="w-full p-8 text-center sm:p-12">
        <AlertTriangle className="mx-auto mb-5 h-12 w-12 text-velora-accent" aria-hidden="true" />
        <h1 className="font-display font-semibold text-ink text-5xl leading-[1.02] sm:text-6xl">Account access is limited</h1>
        <p className="mx-auto mt-4 max-w-xl text-ink">
          This account cannot currently use member features. Contact Intimo support if you believe this is a mistake.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link className="rounded-full bg-gold-gradient px-5 py-2.5 text-sm font-medium text-velora-bg" href="mailto:contact@intimo.live">Contact support</Link>
          <Link className="rounded-full border border-ink/15 px-5 py-2.5 text-sm font-medium text-ink hover:bg-ink/10" href="/auth/logout?returnTo=%2F">Sign out</Link>
        </div>
      </Card>
    </main>
  );
}
