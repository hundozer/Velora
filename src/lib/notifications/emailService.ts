import { ResendClient } from "./resendClient";
import { IntimoEmailTemplates } from "./emailTemplates";

export interface SentEmailLog {
  id: string;
  to: string;
  from: string;
  subject: string;
  confirmationLink?: string;
  bodyHtml: string;
  sentAt: string;
  provider: string;
}

const OUTBOX: SentEmailLog[] = [];

export class EmailNotificationService {
  public static readonly DEFAULT_SENDER = ResendClient.DEFAULT_SENDER;
  public static readonly SUPPORT_CONTACT = ResendClient.DEFAULT_REPLY_TO;

  /**
   * 1. Send Welcome Email
   */
  public static async sendWelcomeEmail(email: string, onboardingUrl: string = "https://intimo.live/onboarding"): Promise<SentEmailLog> {
    const subject = "Welcome to Intimo • Complete Your Profile";
    const bodyHtml = IntimoEmailTemplates.renderWelcome(email, onboardingUrl);

    const resendRes = await ResendClient.sendEmail({
      to: email,
      subject,
      html: bodyHtml,
    });

    const logEntry: SentEmailLog = {
      id: resendRes.id,
      to: email,
      from: this.DEFAULT_SENDER,
      subject,
      confirmationLink: onboardingUrl,
      bodyHtml,
      sentAt: resendRes.timestamp,
      provider: resendRes.provider,
    };

    OUTBOX.unshift(logEntry);
    return logEntry;
  }

  /**
   * 2. Send Email Verification Email
   */
  public static sendVerificationEmail(email: string, token: string, baseUrl: string = "https://intimo.live"): SentEmailLog {
    const confirmationLink = `${baseUrl}/verify-email?token=${encodeURIComponent(token)}`;
    const subject = "Action Required: Confirm Your Intimo Account Email";
    const bodyHtml = IntimoEmailTemplates.renderEmailVerification(confirmationLink);

    // Fire async Resend dispatch without blocking synchronous caller if used synchronously
    ResendClient.sendEmail({
      to: email,
      subject,
      html: bodyHtml,
    }).catch(err => console.error("[RESEND DISPATCH ERROR]", err));

    const logEntry: SentEmailLog = {
      id: `mail-${Date.now()}`,
      to: email,
      from: this.DEFAULT_SENDER,
      subject,
      confirmationLink,
      bodyHtml,
      sentAt: new Date().toISOString(),
      provider: process.env.RESEND_API_KEY ? "RESEND_API" : "SIMULATED_OUTBOX",
    };

    OUTBOX.unshift(logEntry);
    console.log(`[TRANSACTIONAL EMAIL DISPATCHED] To: ${email} | Link: ${confirmationLink}`);
    return logEntry;
  }

  /**
   * 3. Send Password Reset Email
   */
  public static async sendPasswordResetEmail(email: string, resetLink: string): Promise<SentEmailLog> {
    const subject = "Action Required: Reset Your Intimo Password";
    const bodyHtml = IntimoEmailTemplates.renderPasswordReset(resetLink);

    const resendRes = await ResendClient.sendEmail({
      to: email,
      subject,
      html: bodyHtml,
    });

    const logEntry: SentEmailLog = {
      id: resendRes.id,
      to: email,
      from: this.DEFAULT_SENDER,
      subject,
      confirmationLink: resetLink,
      bodyHtml,
      sentAt: resendRes.timestamp,
      provider: resendRes.provider,
    };

    OUTBOX.unshift(logEntry);
    return logEntry;
  }

  /**
   * 4. Send Security Notification Email
   */
  public static async sendSecurityNotificationEmail(email: string, actionTitle: string, details: string): Promise<SentEmailLog> {
    const subject = `Security Alert: ${actionTitle}`;
    const bodyHtml = IntimoEmailTemplates.renderSecurityNotification(actionTitle, details);

    const resendRes = await ResendClient.sendEmail({
      to: email,
      subject,
      html: bodyHtml,
    });

    const logEntry: SentEmailLog = {
      id: resendRes.id,
      to: email,
      from: this.DEFAULT_SENDER,
      subject,
      bodyHtml,
      sentAt: resendRes.timestamp,
      provider: resendRes.provider,
    };

    OUTBOX.unshift(logEntry);
    return logEntry;
  }

  public static async sendPrivacyDeletionComplete(email: string): Promise<SentEmailLog> {
    const subject = "Your Intimo account deletion is complete";
    const bodyHtml = `<p>Your Intimo account deletion and anonymization workflow is complete.</p><p>If you did not request this action, contact <a href="mailto:contact@intimo.live">contact@intimo.live</a>.</p>`;
    const resendRes = await ResendClient.sendEmail({ to: email, subject, html: bodyHtml });
    const logEntry: SentEmailLog = { id: resendRes.id, to: email, from: this.DEFAULT_SENDER, subject, bodyHtml, sentAt: resendRes.timestamp, provider: resendRes.provider };
    OUTBOX.unshift(logEntry);
    return logEntry;
  }

  public static getLatestEmailFor(email: string): SentEmailLog | undefined {
    const clean = email.toLowerCase();
    return OUTBOX.find((m) => m.to.toLowerCase() === clean);
  }

  public static getOutbox(): SentEmailLog[] {
    return [...OUTBOX];
  }
}
