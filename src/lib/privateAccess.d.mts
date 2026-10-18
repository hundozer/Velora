export type GrantRow = { status: string; grant_type?: string | null; expires_at?: string | null; decided_at?: string | null };
export declare const ONCE_GRANT_HOURS: number;
export declare const DENIED_COOLDOWN_DAYS: number;
export declare const DECISIONS: string[];
export declare function grantIsActive(row: GrantRow | null | undefined, now?: Date): boolean;
export declare function decisionUpdate(decision: unknown, now?: Date): { status: string; grant_type: string | null; expires_at: string | null; decided_at: string } | null;
export declare function canRequest(row: GrantRow | null | undefined, now?: Date): { ok: true } | { ok: false; reason: string };
