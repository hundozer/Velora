export type AreaKind = "PRAGUE_DISTRICT" | "NEAR_PRAGUE" | "CZECHIA" | "ABROAD";
export interface Area { id: string; name: string; label: string; kind: AreaKind; lat: number | null; lng: number | null }
export type DistanceBucket = "SAME_AREA" | "UNDER_2" | "UNDER_5" | "UNDER_10" | "UNDER_25" | "OVER_25";
export declare const AREA_KINDS: AreaKind[];
export declare const AREAS: Area[];
export declare function areaById(id: unknown): Area | null;
export declare function isPragueArea(id: unknown): boolean;
export declare function locationFieldsForArea(id: unknown): { city: string; country: string; location: string } | null;
export declare function areaDistanceKm(fromId: unknown, toId: unknown): number | null;
export declare function distanceBucket(fromId: unknown, toId: unknown): DistanceBucket | null;
export declare const DISTANCE_BUCKET_LABELS: Record<DistanceBucket, string>;
