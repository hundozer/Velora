export type BoundaryPreference = "COMFORTABLE" | "ASK_FIRST" | "NOT_INTERESTED";
export interface BoundaryKind { id: string; group: string; label: string; enforce: "FIRST_MESSAGE" | "ESTABLISHED" | "DISPLAY"; default: BoundaryPreference }
export declare const BOUNDARY_PREFERENCES: { value: BoundaryPreference; label: string }[];
export declare const BOUNDARY_GROUPS: { id: string; label: string; hint?: string }[];
export declare const BOUNDARY_KINDS: BoundaryKind[];
export declare function boundaryKind(id: unknown): BoundaryKind | null;
export declare function cleanBoundaries(input: unknown): { kind: string; preference: BoundaryPreference }[];
export declare function resolveBoundaries(rows: { kind: string; preference: string }[] | null | undefined): Record<string, BoundaryPreference>;
export declare function senderCategory(gender: unknown, isCoupleProfile: unknown): string;
export declare function firstMessageDecision(boundaries: Record<string, BoundaryPreference>, sender: { gender: unknown; isCoupleProfile: unknown; verified: boolean }): { allowed: true } | { allowed: false; reason: string };
export declare function establishedDecision(preference: BoundaryPreference, established: boolean): boolean;
