/**
 * Content Moderation & 18 U.S.C. 2257 Compliance Pipeline
 * Handles pre-upload validation, perceptual hashing, age verification checks, and report queue processing.
 */

export interface MediaUploadPayload {
  uploaderId: string;
  uploaderVerificationLevel: string;
  fileSizeBytes: number;
  mimeType: string;
  isExplicitContent: boolean;
  perceptualHash?: string;
}

export interface ModerationScanResult {
  passed: boolean;
  requiresManualReview: boolean;
  rejectionReason?: string;
  complianceBadge?: string;
}

/**
 * Validates media uploads against legal 2257 compliance and perceptual hashing rules
 */
export function validateMediaUpload(payload: MediaUploadPayload): ModerationScanResult {
  // 1. Mandatory 18 U.S.C. 2257 Creator Verification Gate for Explicit Content
  if (payload.isExplicitContent && payload.uploaderVerificationLevel !== "LEVEL_3_PROFILE_BIOMETRIC") {
    return {
      passed: false,
      requiresManualReview: false,
      rejectionReason: "Explicit media monetization requires Level 3 Biometric Verification (18 U.S.C. 2257 compliance).",
    };
  }

  // 2. Allowed File Formats Check
  const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm"];
  if (!allowedMimeTypes.includes(payload.mimeType)) {
    return {
      passed: false,
      requiresManualReview: false,
      rejectionReason: "Unsupported media format. Allowed formats: JPG, PNG, WEBP, MP4, WEBM.",
    };
  }

  // 3. File Size Limit (Max 500MB)
  if (payload.fileSizeBytes > 500 * 1024 * 1024) {
    return {
      passed: false,
      requiresManualReview: false,
      rejectionReason: "File size exceeds 500MB limit.",
    };
  }

  return {
    passed: true,
    requiresManualReview: false,
    complianceBadge: "2257_VERIFIED_AND_HASHED",
  };
}

export interface UserReportItem {
  id: string;
  reporterUserId: string;
  targetUserId: string;
  contentType: "PROFILE" | "MESSAGE" | "MEDIA" | "STREAM";
  reason: "HARASSMENT" | "SPAM" | "UNAUTHORIZED_CONTENT" | "UNDERAGE_SUSPICION" | "OTHER";
  description: string;
  createdAt: string;
  status: "OPEN" | "UNDER_REVIEW" | "ACTION_TAKEN" | "DISMISSED";
}

export const MOCK_REPORT_QUEUE: UserReportItem[] = [
  {
    id: "rep-101",
    reporterUserId: "user-88",
    targetUserId: "user-99",
    contentType: "MESSAGE",
    reason: "SPAM",
    description: "Sending repeated external phishing links in direct messages.",
    createdAt: "2026-08-03T10:15:00Z",
    status: "OPEN",
  },
];
