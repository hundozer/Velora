"use client";

import React, { useState } from "react";
import { MOCK_EVENTS } from "@/lib/mockData";
import { VeloraEvent } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { CheckoutModal } from "@/components/payment/CheckoutModal";
import {
  Calendar,
  MapPin,
  Users,
  Ticket,
  Plus,
  Sparkles,
  Search,
  CheckCircle2,
  Clock,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { BehindTheDoorLanding } from "@/components/landing/BehindTheDoorLanding";

export default function EventsMarketplacePage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<VeloraEvent[]>(MOCK_EVENTS);
  const [filterType, setFilterType] = useState("ALL");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<VeloraEvent | null>(null);

  // Form State for Event Creation
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("Monaco / Port Hercules");
  const [venueName, setVenueName] = useState("Exclusive Private Villa");
  const [scheduledDate, setScheduledDate] = useState("Saturday, Aug 29 • 8:00 PM CET");
  const [price, setPrice] = useState("100");
  const [capacity, setCapacity] = useState("30");
  const [description, setDescription] = useState("");

  const handleBuyTicket = (event: VeloraEvent) => {
    setSelectedEvent(event);
    setTicketModalOpen(true);
  };

  const handleCreateEvent = () => {
    if (!title.trim()) return;

    const newEvt: VeloraEvent = {
      id: "evt-" + Date.now(),
      hostName: "You",
      hostAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=800&q=80",
      hostBadge: "Verified Member",
      title,
      description,
      eventType: "PRIVATE_COMMUNITY_GATHERING",
      location,
      venueName,
      scheduledDate,
      capacity: parseInt(capacity) || 30,
      attendeesCount: 1,
      ticketPrice: parseFloat(price) || 0,
      coverImageUrl: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
      rules: ["Level 3 Biometric Verification Required"],
      isAttending: true,
    };

    setEvents([newEvt, ...events]);
    setCreateModalOpen(false);
    setTitle("");
    setDescription("");
  };

  if (!user) {
    return <BehindTheDoorLanding />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 text-left">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10 pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> PRIVATE EXPERIENCES & GATHERINGS
            </span>
            <span className="text-xs text-velora-gold font-mono uppercase tracking-widest">• High-Discretion Events</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-velora-textPrimary flex items-center gap-3">
            <Ticket className="w-8 h-8 text-amber-400" />
            Intimo Event Marketplace & Private Salons
          </h1>
          <p className="text-xs text-velora-textSecondary max-w-2xl leading-relaxed">
            Discover curated VIP galas, private yacht soirées, creator appearances, and high-discretion community meetups across Europe.
          </p>
        </div>

        <Button
          variant="gold"
          className="text-xs font-bold uppercase tracking-wider gap-2 shadow-gold-glow shrink-0"
          onClick={() => setCreateModalOpen(true)}
        >
          <Plus className="w-4 h-4" /> Host Private Event
        </Button>
      </div>

      {/* Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: "ALL", label: "All Events" },
          { id: "NIGHTLIFE_VIP", label: "Nightlife & Yacht VIP" },
          { id: "SOCIAL_MEETUP", label: "Social Meetups & Salons" },
          { id: "CREATOR_APPEARANCE", label: "Creator Appearances" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 ${
              filterType === tab.id
                ? "bg-gold-gradient text-velora-bg shadow-gold-glow"
                : "glass-panel text-velora-textMuted hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {events.map((evt) => (
          <Card key={evt.id} variant="goldBorder" hoverEffect className="p-0 overflow-hidden text-left flex flex-col justify-between group">
            <div>
              <div className="h-56 w-full bg-velora-card relative overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={evt.coverImageUrl}
                  alt={evt.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-velora-bg via-velora-bg/40 to-transparent" />

                <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-black/80 text-amber-300 border border-amber-500/40 font-mono uppercase">
                    {evt.eventType.replace("_", " ")}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-velora-card/90 text-velora-gold border border-velora-gold/40 font-mono">
                    {evt.ticketPrice === 0 ? "Free Access" : `$${evt.ticketPrice.toFixed(2)}`}
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full border border-velora-gold/40 overflow-hidden bg-velora-card shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={evt.hostAvatar} alt={evt.hostName} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-velora-textPrimary">Host: {evt.hostName}</h4>
                      {evt.hostBadge && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {evt.hostBadge}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-velora-textMuted flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-velora-gold" /> {evt.location}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-serif font-bold text-velora-textPrimary group-hover:text-velora-gold transition-colors">
                    {evt.title}
                  </h3>
                  <p className="text-xs text-velora-textMuted line-clamp-2 mt-1 leading-relaxed">{evt.description}</p>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono text-velora-textSecondary pt-1">
                  <span className="flex items-center gap-1 text-amber-300">
                    <Clock className="w-3.5 h-3.5" /> {evt.scheduledDate}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-velora-gold" /> {evt.attendeesCount} / {evt.capacity} Capacity
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 pt-0 flex items-center justify-between border-t border-white/10 mt-2">
              <span className="text-xs text-velora-textMuted">{evt.venueName}</span>
              <Button
                variant={evt.isAttending ? "glass" : "gold"}
                size="sm"
                className={`text-xs font-bold uppercase tracking-wider ${
                  evt.isAttending ? "border-emerald-500/40 text-emerald-300" : "shadow-gold-glow"
                }`}
                onClick={() => handleBuyTicket(evt)}
              >
                {evt.isAttending ? "Reserved ✓" : "Reserve Ticket"}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Event Creation Modal */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Host a Private Intimo Event">
        <div className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-velora-textSecondary mb-1">
              Event Title
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Monaco Harbor Sunset Salon"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-velora-textSecondary mb-1">
                City / Location
              </label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-velora-textSecondary mb-1">
                Ticket Price ($)
              </label>
              <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-velora-textSecondary mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Private event details and dress code..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-3 text-xs text-velora-textPrimary focus:outline-none focus:border-velora-gold"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="w-1/3 text-xs" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="gold" className="w-2/3 text-xs font-bold uppercase tracking-wider shadow-gold-glow" onClick={handleCreateEvent}>
              Publish Event
            </Button>
          </div>
        </div>
      </Modal>

      {/* Ticket Checkout Modal */}
      {selectedEvent && (
        <CheckoutModal
          isOpen={ticketModalOpen}
          onClose={() => setTicketModalOpen(false)}
          productTitle={selectedEvent.title}
          creatorName={selectedEvent.hostName}
          grossAmount={selectedEvent.ticketPrice || 80}
          type="LIVE_EXPERIENCE_TICKET"
        />
      )}
    </div>
  );
}
