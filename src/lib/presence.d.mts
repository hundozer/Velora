export type PresenceBucket = "ONLINE" | "TODAY" | "WEEK";
export declare const ACTIVITY_TOUCH_INTERVAL_MS: number;
export declare const PRESENCE_LABELS: Record<PresenceBucket, string>;
export declare function presenceBucket(lastActiveAt: string | null | undefined, showOnlineStatus: boolean, now?: Date): PresenceBucket | null;
export declare function shouldTouchActivity(lastActiveAt: string | null | undefined, now?: Date): boolean;
