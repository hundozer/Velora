import { ContentVisibility } from "@/types/auth";
import { UserAccountModel } from "@/lib/auth/userModel";
import { AuthorizationService, MediaResource, EntitlementRecord } from "@/lib/auth/AuthorizationService";
import { generateSignedMediaUrl, verifySignedMediaUrl } from "@/lib/security/signedUrls";

export interface ProtectedMediaResponse {
  allowed: boolean;
  visibility: ContentVisibility;
  signedUrl?: string;
  watermarkText?: string;
  reason?: string;
}

export class MediaSecurityEngine {
  /**
   * Authorizes media access and generates short-lived HMAC Signed URLs with watermarking metadata
   */
  public static authorizeAndSignMediaAccess(
    currentUser: UserAccountModel | null,
    media: MediaResource,
    rawStoragePath: string,
    entitlements: EntitlementRecord[] = []
  ): ProtectedMediaResponse {
    const isAllowed = AuthorizationService.canViewMedia(currentUser, media, entitlements);

    if (!isAllowed) {
      return {
        allowed: false,
        visibility: media.visibility,
        reason: "Access Denied. Paid subscription or purchase entitlement required.",
      };
    }

    // Generate HMAC signed URL with 300-second expiration
    const signedResult = generateSignedMediaUrl(rawStoragePath, {
      mediaId: media.id,
      userId: currentUser?.id || "guest",
      expiresInSeconds: 300,
    });

    // Dynamic watermark payload for anti-piracy protection
    const watermarkText = currentUser
      ? `Velora Private • Viewer ${currentUser.id} • ${new Date().toISOString().substring(0, 10)}`
      : "Velora Private Members Club";

    return {
      allowed: true,
      visibility: media.visibility,
      signedUrl: signedResult.signedUrl,
      watermarkText,
    };
  }

  /**
   * Validates incoming media CDN fetch requests
   */
  public static validateCdnFetchRequest(
    mediaId: string,
    userId: string,
    token: string,
    expiresAt: number
  ): boolean {
    return verifySignedMediaUrl(mediaId, userId, token, expiresAt);
  }
}
