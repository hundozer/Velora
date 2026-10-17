export interface PeopleFilters { who: string[]; minAge: number; maxAge: number; withinKm: number | null; desires: string[]; hasPhoto: boolean; verified: boolean; active: "ONLINE" | "DAY" | "WEEK" | null; newWithinDays: number | null; limit: number; cursor: { createdAt: string; id: string } | null }
export declare const PEOPLE_PAGE_SIZE: number;
export declare const WHO_OPTIONS: { value: string; label: string }[];
export declare const DISTANCE_OPTIONS: { km: number; label: string }[];
export declare const ACTIVE_WINDOWS: Record<"ONLINE" | "DAY" | "WEEK", number>;
export declare function parsePeopleFilters(params: URLSearchParams): PeopleFilters;
export declare function areaIdsWithin(viewerAreaId: unknown, km: number): string[] | null;
export declare function whoFilterExpression(who: string[]): string | null;
export declare function encodeCursor(row: { created_at: string; id: string }): string;
