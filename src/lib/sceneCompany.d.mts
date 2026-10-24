export declare const SCENE_COMPANY_HORIZON_MS: number;
export declare function sceneCompanyWindow(event: { starts_at: string; ends_at?: string | null }, now?: Date, allowStarted?: boolean): { startsAt: string; endsAt: string } | null;
export declare function scenePlanCurrent(plan: { starts_at?: string | null; expires_at: string }, event: { status: string; starts_at: string; ends_at?: string | null } | null | undefined, now?: Date): boolean;
