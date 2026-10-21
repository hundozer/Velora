"use client";

import React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ShieldCheck, Lock, ArrowRight } from "lucide-react";
import { EditorialPhoto } from "@/components/editorial/EditorialPhoto";

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12 text-left">
      <div className="text-center space-y-4">
        <Badge type="verified" label="Kink. Consent. Prague." />
        <h1 className="font-display font-bold text-velora-textPrimary text-5xl leading-[1.02] sm:text-6xl">
          Desire belongs <br />
          <span className="gold-gradient-text">in the conversation.</span>
        </h1>
        <p className="text-sm text-velora-textSecondary max-w-2xl mx-auto leading-relaxed">
          Intimo is for adults in Prague looking for sex partners, dates and people who share their kinks. Singles, couples, queer, experienced or just curious. You can know exactly what you want, or still be finding the words.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <EditorialPhoto photo="club-chemistry" caption="You know when there is chemistry." sizes="(min-width: 768px) 480px, 100vw" />
        <EditorialPhoto photo="satin-and-lace" caption="A shared curiosity is a good place to start." sizes="(min-width: 768px) 480px, 100vw" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card variant="goldBorder" className="p-8 space-y-4">
          <ShieldCheck className="w-8 h-8 text-velora-gold" />
          <h2 className="text-4xl font-display font-bold text-velora-textPrimary">
            Desire does not mean entitlement.
          </h2>
          <p className="text-xs text-velora-textSecondary leading-relaxed">
            A profile is not consent. Neither is a photo, a match in tastes or a yes from last night. Ask. Listen. Take a no without arguing. If someone crosses a line, you can block and report them.
          </p>
        </Card>

        <Card variant="glass" className="p-8 space-y-4">
          <Lock className="w-8 h-8 text-velora-success" />
          <h2 className="text-4xl font-display font-bold text-velora-textPrimary">
            Keep some things yours.
          </h2>
          <p className="text-xs text-velora-textSecondary leading-relaxed">
            Use a nickname. Choose what to share and who can approach you. Private photos open for people you approve. Meeting someone does not mean you owe them your address, your album or an explanation for leaving.
          </p>
        </Card>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <EditorialPhoto photo="leather-detail" caption="Your style. Your pace." sizes="(min-width: 768px) 480px, 100vw" />
        <EditorialPhoto photo="rope-and-cuff" caption="Talk about the limits as well as the possibilities." sizes="(min-width: 768px) 480px, 100vw" />
      </div>

      <div className="text-center pt-8">
        <Link href="/register">
          <Button variant="gold" size="lg" className="font-bold uppercase tracking-wider gap-2">
            Join Intimo
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
