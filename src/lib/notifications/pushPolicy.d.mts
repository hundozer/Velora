export type PushCategory = "MESSAGE" | "INTEREST" | "PRIVATE_ACCESS" | "PLAN_REPLY";
export declare const PUSH_CATEGORIES: PushCategory[];
export declare const PUSH_COPY: Record<PushCategory, { body: string; path: string }>;
export declare function isAllowedPushEndpoint(endpoint: unknown): boolean;
export declare function parsePushSubscription(value: unknown): { endpoint: string; p256dh: string; auth: string } | null;
export declare function pushAllowed(optOut: string[] | null | undefined, category: string): boolean;
export declare function pushPayload(category: string, translate?: (text: string) => string): { title: string; body: string; url: string; tag: string } | null;
