export declare const PERSONAL_CATEGORIES: { value: string; label: string }[];
export declare function categoryLabel(value: string): string;
export declare function validatePersonalAd(input: Record<string, unknown>): { error: string; ad?: never } | { error?: never; ad: { category: string; title: string; body: string; boundaries: string; min_age: number; max_age: number; require_verified: boolean; allowed_reply_genders: string[]; days: number } };
