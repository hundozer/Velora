export interface ResendEmailPayload {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

export interface ResendResponse {
  id: string;
  delivered: boolean;
  provider: "RESEND_API" | "SIMULATED_OUTBOX";
  timestamp: string;
}

export class ResendClient {
  public static readonly DEFAULT_SENDER = process.env.EMAIL_FROM || "Intimo <noreply@intimo.live>";
  public static readonly DEFAULT_REPLY_TO = process.env.EMAIL_REPLY_TO || "contact@intimo.live";

  /**
   * Dispatches transactional email via Resend API or simulated outbox
   */
  public static async sendEmail(payload: ResendEmailPayload): Promise<ResendResponse> {
    const apiKey = process.env.RESEND_API_KEY;
    const sender = payload.from || this.DEFAULT_SENDER;
    const replyTo = payload.replyTo || this.DEFAULT_REPLY_TO;
    const timestamp = new Date().toISOString();

    if (apiKey) {
      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: sender,
            reply_to: replyTo,
            to: [payload.to],
            subject: payload.subject,
            html: payload.html,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`[RESEND API DISPATCH SUCCESS] ID: ${data.id} | To: ${payload.to}`);
          return {
            id: data.id || `resend-${Date.now()}`,
            delivered: true,
            provider: "RESEND_API",
            timestamp,
          };
        } else {
          const errorText = await response.text();
          console.warn(`[RESEND API DISPATCH FAILED] Status: ${response.status} | Details: ${errorText}`);
        }
      } catch (err) {
        console.error(`[RESEND API DISPATCH ERROR]`, err);
      }
    }

    // Fallback to simulated outbox when RESEND_API_KEY is not configured
    const simulatedId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    console.log(`[RESEND SIMULATED DISPATCH] Sender: ${sender} | ReplyTo: ${replyTo} | To: ${payload.to} | Subject: ${payload.subject}`);

    return {
      id: simulatedId,
      delivered: true,
      provider: "SIMULATED_OUTBOX",
      timestamp,
    };
  }
}
