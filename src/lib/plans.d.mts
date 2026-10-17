export interface PlanRowLike { status: string; moderation_status?: string | null; expires_at: string }
export declare const PLAN_CATEGORIES: { value: string; label: string }[];
export declare const PLAN_DURATIONS: { days: number; label: string }[];
export declare const PLAN_REPLY_TYPES: { value: string; label: string }[];
export declare const MAX_LIVE_PLANS: number;
export declare function planCategoryLabel(value: unknown): string;
export declare function validatePlanInput(input: Record<string, unknown>, now?: Date): { error: string; plan?: undefined } | { error?: undefined; plan: { category: string; title: string; text: string; validity_days: number; expires_at: string; allowed_reply_genders: string[]; min_age: number; max_age: number; require_verified: boolean; require_media: boolean } };
export declare function isPlanLive(row: PlanRowLike, now?: Date): boolean;
export declare function endsInLabel(expiresAt: string, now?: Date): string;
