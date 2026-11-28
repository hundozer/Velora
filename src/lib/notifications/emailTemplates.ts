export class IntimoEmailTemplates {
  private static readonly SUPPORT_EMAIL = "contact@intimo.live";

  private static wrapLayout(title: string, bodyContent: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #191C20; color: #F1E8DC; margin: 0; padding: 40px 20px; line-height: 1.5; }
          .container { max-width: 560px; margin: 0 auto; background: #252B31; border: 1px solid #46525E; border-radius: 0; padding: 40px;  }
          .logo { text-align: center; margin-bottom: 28px; }
          .logo-mark { font-size: 22px; font-weight: 600; color: #F1E8DC; }
          .logo-sub { font-size: 10px; letter-spacing: 3px; color: #A9A39E; text-transform: uppercase; margin-top: 4px; }
          .title { font-family: Georgia, serif; font-size: 28px; font-weight: 400; color: #F1E8DC; text-align: center; margin-bottom: 12px; }
          .subtitle { font-size: 13px; color: #A9A39E; text-align: center; margin-bottom: 32px; line-height: 1.6; }
          .content-box { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 0; padding: 24px; margin-bottom: 28px; font-size: 13px; color: #CFC7BC; }
          .button-container { text-align: center; margin: 32px 0; }
          .btn { display: inline-block; background: #E0704F; color: #191C20; font-weight: 600; font-size: 14px; padding: 16px 36px; border-radius: 9999px; text-decoration: none;  }
          .link-box { background: rgba(0, 0, 0, 0.4); border: 1px solid #46525E; padding: 12px; border-radius: 12px; font-size: 11px; word-break: break-all; color: #A8D5EF; text-align: center; margin-top: 20px; font-family: monospace; }
          .footer { margin-top: 36px; font-size: 11px; color: #A9A39E; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 24px; }
          .alert-badge { display: inline-block; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); color: #FFA79E; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; padding: 4px 12px; border-radius: 9999px; margin-bottom: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">
            <div class="logo-mark">Intimo</div>
            <div class="logo-sub">Private Members Club</div>
          </div>
          ${bodyContent}
          <div class="footer">
            Intimo International • High-Discretion Adult Marketplace<br>
            Support & Privacy Desk: <a href="mailto:${this.SUPPORT_EMAIL}" style="color: #A8D5EF; text-decoration: none;">${this.SUPPORT_EMAIL}</a><br>
            © 2026 Intimo. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * 1. Welcome Email Template
   */
  public static renderWelcome(email: string, onboardingUrl: string = "https://intimo.live/onboarding"): string {
    const body = `
      <div class="title">Welcome to Intimo</div>
      <div class="subtitle">
        Your private account identity has been established. Complete your persona profile to explore connections in your area.
      </div>
      <div class="content-box">
        <p style="margin-top: 0;"><strong>Hello,</strong></p>
        <p>Thank you for joining Intimo, the premier private adult social marketplace. We prioritize your discretion, identity security, and mutual consent above all else.</p>
        <p style="margin-bottom: 0;">To unlock discovery placement and start browsing verified profiles, please complete your onboarding steps.</p>
      </div>
      <div class="button-container">
        <a href="${onboardingUrl}" class="btn">Complete Your Intimo Profile</a>
      </div>
      <div class="link-box">${onboardingUrl}</div>
    `;
    return this.wrapLayout("Welcome to Intimo", body);
  }

  /**
   * 2. Email Verification Template
   */
  public static renderEmailVerification(verificationLink: string): string {
    const body = `
      <div class="title">Confirm Your Email Address</div>
      <div class="subtitle">
        Action required to verify email ownership and activate Level 2 Trust Level access.
      </div>
      <div class="content-box">
        <p style="margin-top: 0;"><strong>Verification Request</strong></p>
        <p>Please confirm your email address by clicking the button below. This time-limited verification token ensures your account remains secure and authorized.</p>
      </div>
      <div class="button-container">
        <a href="${verificationLink}" class="btn">Confirm Email Address & Activate Account</a>
      </div>
      <div class="link-box">${verificationLink}</div>
    `;
    return this.wrapLayout("Confirm Your Email • Intimo", body);
  }

  /**
   * 3. Password Reset Template
   */
  public static renderPasswordReset(resetLink: string): string {
    const body = `
      <div class="title">Password Reset Request</div>
      <div class="subtitle">
        Secure account recovery instructions for your Intimo identity.
      </div>
      <div class="content-box">
        <p style="margin-top: 0;"><strong>Account Recovery</strong></p>
        <p>We received a request to reset the password for your Intimo account. If you initiated this request, click below to set a new password.</p>
        <p style="margin-bottom: 0; color: #FFA79E;">If you did not request a password reset, please change your credentials immediately or contact support.</p>
      </div>
      <div class="button-container">
        <a href="${resetLink}" class="btn">Reset Password Now</a>
      </div>
      <div class="link-box">${resetLink}</div>
    `;
    return this.wrapLayout("Reset Your Password • Intimo", body);
  }

  /**
   * 4. Security Notification Template
   */
  public static renderSecurityNotification(actionTitle: string, details: string): string {
    const body = `
      <div style="text-align: center;"><span class="alert-badge">Security Alert</span></div>
      <div class="title">${actionTitle}</div>
      <div class="subtitle">
        An important security event was registered on your Intimo account.
      </div>
      <div class="content-box">
        <p style="margin-top: 0;"><strong>Activity Details:</strong></p>
        <p style="font-family: monospace; color: #A8D5EF;">${details}</p>
        <p style="margin-bottom: 0;">If this activity was authorized by you, no further action is required. If you suspect unauthorized access, lock your account immediately.</p>
      </div>
      <div class="button-container">
        <a href="https://intimo.live/settings" class="btn">Review Security Settings</a>
      </div>
    `;
    return this.wrapLayout(`Security Alert: ${actionTitle} • Intimo`, body);
  }
}
