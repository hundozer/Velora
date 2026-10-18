export type TrustSignal = "PHOTO_VERIFIED" | "ESTABLISHED";
export declare const ESTABLISHED_MIN_DAYS: number;
export declare const TRUST_SIGNALS: Record<TrustSignal, { label: string; description: string }>;
export declare function trustSignals(input: { verificationStatus?: string | null; createdAt?: string | null; hasAvatar?: boolean; accountStatus?: string | null }, now?: Date): TrustSignal[];
