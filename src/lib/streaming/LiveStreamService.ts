import { LiveStream, StreamAccessType, StreamStatus, LiveChatMessage, LiveTip } from "@/types";

export class LiveStreamService {
  /**
   * Validates whether a user has permission to enter a live room.
   */
  static validateViewerAccess(
    stream: LiveStream,
    isSubscriber: boolean = false,
    hasTicket: boolean = false
  ): { allowed: boolean; reason?: string } {
    if (stream.status === "ENDED" || stream.status === "CANCELLED") {
      return { allowed: false, reason: "Stream has ended or was cancelled." };
    }

    if (stream.status === "SUSPENDED") {
      return { allowed: false, reason: "Stream was suspended for compliance review." };
    }

    if (stream.accessType === "FREE") {
      return { allowed: true };
    }

    if (stream.accessType === "SUBSCRIBER_ONLY") {
      if (isSubscriber) return { allowed: true };
      return { allowed: false, reason: "Subscriber-only stream. Active subscription required." };
    }

    if (stream.accessType === "TICKETED_PPV") {
      if (hasTicket || isSubscriber) return { allowed: true };
      return { allowed: false, reason: `Ticket purchase required ($${stream.ticketPrice}).` };
    }

    return { allowed: true };
  }

  /**
   * Simulates broadcasting start via WebRTC / RTMP ingestion.
   */
  static startBroadcast(streamId: string): Partial<LiveStream> {
    return {
      status: "LIVE",
      streamUrl: `wss://stream.velora.club/live/${streamId}.m3u8`,
    };
  }

  /**
   * Generates a live tip chat event payload.
   */
  static createTipPayload(senderName: string, amount: number, message?: string): LiveChatMessage {
    return {
      id: "chat-tip-" + Date.now(),
      streamId: "ls-1",
      senderName,
      senderAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
      content: message ? `Tipped $${amount.toFixed(2)}: "${message}"` : `Tipped $${amount.toFixed(2)}!`,
      isTipMessage: true,
      tipAmount: amount,
      createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
  }
}
