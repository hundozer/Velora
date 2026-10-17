export type DesireState = "LOVE" | "INTO" | "CURIOUS" | "NOT_FOR_ME" | "HARD_LIMIT";
export type DesireVisibility = "MEMBERS" | "PRIVATE";
export interface Desire { id: string; category: string; label: string }
export interface DesireRow { desire_id: string; state: DesireState; visibility: DesireVisibility }
export declare const DESIRE_STATES: { value: DesireState; label: string }[];
export declare const POSITIVE_STATES: DesireState[];
export declare const DESIRE_CATEGORIES: { id: string; label: string }[];
export declare const DESIRES: Desire[];
export declare const MAX_DESIRE_FILTERS: number;
export declare function desireById(id: unknown): Desire | null;
export declare function defaultVisibility(state: DesireState): DesireVisibility;
export declare function cleanDesireSelections(input: unknown): DesireRow[];
export declare function parseDesireFilter(value: unknown): string[];
export declare function sharedDesireIds(mine: { desire_id: string; state: string }[], theirs: { desire_id: string; state: string }[]): string[];
