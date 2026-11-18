export type ConsentType = "SPECIAL_CATEGORY_PROFILE" | "SPECIAL_CATEGORY_DESIRES";
export type ConsentSpec = { version: string; acceptedVersions: string[]; title: string; wording: string; erasesProfileColumns: string[]; erasesTables?: string[] };
export type ConsentRecord = { consent_type: string; consent_version: string; consent_timestamp: string; consent_status: "GRANTED" | "WITHDRAWN"; withdrawn_at?: string | null; source?: string };
export type ConsentState = { granted: boolean; needsRenewal: boolean; version: string | null; since: string | null; currentVersion: string };
export declare const CONSENTS: Record<ConsentType, ConsentSpec>;
export declare const MEMBER_CONSENT_TYPES: ConsentType[];
export declare function latestConsent(rows: ConsentRecord[] | null | undefined, type: string): ConsentRecord | null;
export declare function consentStates(rows: ConsentRecord[] | null | undefined): Record<ConsentType, ConsentState>;
export declare function consentRow(input: { profileId: string; type: ConsentType; granted: boolean; source: string; now?: string }): Record<string, unknown>;
