export interface SentEmailLog {
  id: string;
  to: string;
  subject: string;
  bodyHtml: string;
  sentAt: string;
}

const OUTBOX: SentEmailLog[] = [];

export class EmailNotificationService {
  /**
   * Generates and dispatches a transactional email confirmation message
   */
  public static sendVerificationEmail(email: string, token: string, baseUrl: string = "http://localhost:3000"): SentEmailLog {
    const confirmationLink = `${baseUrl}/verify-email?token=${encodeURIComponent(token)}`;

    const bodyHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #0b0c10; color: #e5e5e7; margin: 0; padding: 40px 20px; }
          .container { max-width: 560px; margin: 0 auto; background: #13151b; border: 1px solid rgba(212, 175, 55, 0.3); border-radius: 24px; padding: 40px; }
          .logo { text-align: center; margin-bottom: 24px; }
          .title { font-family: Georgia, serif; font-size: 26px; font-weight: bold; color: #f3e5ab; text-align: center; margin-bottom: 12px; }
          .subtitle { font-size: 13px; color: #a1a1aa; text-align: center; margin-bottom: 32px; line-height: 1.6; }
          .button-container { text-align: center; margin: 36px 0; }
          .btn { display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #f3e5ab 100%); color: #0b0c10; font-weight: bold; font-size: 13px; text-transform: uppercase; tracking-spacing: 0.1em; padding: 16px 36px; border-radius: 9999px; text-decoration: none; box-shadow: 0 4px 20px rgba(212, 175, 55, 0.4); }
          .link-box { background: rgba(255, 255, 255, 0.05); padding: 12px; border-radius: 12px; font-size: 11px; word-break: break-all; color: #d4af37; text-align: center; margin-top: 24px; }
          .footer { margin-top: 36px; font-size: 11px; color: #71717a; text-align: center; border-t: 1px solid rgba(255, 255, 255, 0.1); padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">
            <span style="font-size: 28px; font-weight: bold; color: #d4af37; font-family: Georgia, serif;">VELORA</span>
            <div style="font-size: 10px; letter-spacing: 3px; color: #a1a1aa; text-transform: uppercase;">Private Members Club After Dark</div>
          </div>

          <div class="title">Confirm Your Email Address</div>
          <div class="subtitle">
            Welcome to Velora. To activate your account and access private discovery, please verify your email address.
          </div>

          <div class="button-container">
            <a href="${confirmationLink}" class="btn" target="_blank">Confirm Email Address & Activate Account</a>
          </div>

          <div class="link-box">
            ${confirmationLink}
          </div>

          <div class="footer">
            If you did not create a Velora account, you can safely ignore this email.<br>
            © 2026 Velora Private Members Club. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `;

    const logEntry: SentEmailLog = {
      id: `mail-${Date.now()}`,
      to: email,
      subject: "Action Required: Confirm Your Velora Account Email",
      bodyHtml,
      sentAt: new Date().toISOString(),
    };

    OUTBOX.unshift(logEntry);
    console.log(`[TRANSACTIONAL EMAIL SENT] To: ${email} | Confirmation Link: ${confirmationLink}`);

    return logEntry;
  }

  public static getOutbox(): SentEmailLog[] {
    return [...OUTBOX];
  }
}
