"use client";

import React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MOCK_PROFILES } from "@/lib/mockData";
import { Heart, MapPin, MessageSquare } from "lucide-react";

export default function FavoritesPage() {
  const favorites = MOCK_PROFILES.slice(0, 2);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">
      <div className="flex items-center gap-3">
        <Heart className="w-7 h-7 text-rose-400 fill-rose-400/20" />
        <div>
          <h1 className="text-3xl font-serif font-bold text-velora-textPrimary">
            Saved Favorites
          </h1>
          <p className="text-xs text-velora-textSecondary mt-1">
            Your saved private profiles and creator bookmarks.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {favorites.map((p) => (
          <Card key={p.id} variant="glass" className="overflow-hidden space-y-4 p-5">
            <div className="relative h-48 rounded-2xl overflow-hidden bg-velora-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.avatarUrl} alt={p.displayName} className="w-full h-full object-cover" />
              <div className="absolute top-3 left-3">
                {p.verified && <Badge type="verified" />}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-serif font-bold text-velora-textPrimary">{p.displayName}, {p.age}</h3>
              <p className="text-xs text-velora-gold flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" /> {p.location}</p>
            </div>

            <div className="flex gap-2 pt-2">
              <Link href={`/profile/${p.id}`} className="flex-1">
                <Button variant="gold" size="sm" className="w-full text-xs font-bold">
                  View Profile
                </Button>
              </Link>
              <Link href="/messages">
                <button className="p-2.5 rounded-full glass-panel text-velora-textSecondary hover:text-velora-gold">
                  <MessageSquare className="w-4 h-4" />
                </button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
