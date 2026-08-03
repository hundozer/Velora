export class PushNotificationService {
  /**
   * Simulates registering APNS / FCM push tokens.
   */
  static async registerPushToken(token: string): Promise<{ success: boolean }> {
    return { success: true };
  }

  /**
   * Simulates triggering push notification to user device.
   */
  static async sendPushNotification(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, string>
  ): Promise<boolean> {
    return true;
  }
}
