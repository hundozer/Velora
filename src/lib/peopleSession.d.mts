export declare const PEOPLE_SNAPSHOT_PREFIX: string;
export declare const PEOPLE_SNAPSHOT_TTL_MS: number;
export type PeopleSnapshot<P = unknown, R = unknown> = { savedAt: number; people: P[]; cursor: string | null; rails: R | null; scrollY: number };
export declare function snapshotKey(query: string): string;
export declare function readSnapshot<P = unknown, R = unknown>(storage: Storage | null | undefined, query: string, now?: number): PeopleSnapshot<P, R> | null;
export declare function writeSnapshot(storage: Storage | null | undefined, query: string, data: { people: unknown[] | null; cursor: string | null; rails: unknown; scrollY: number }, now?: number): boolean;
export declare function clearPeopleSnapshots(storage: Storage | null | undefined): void;
export declare function takeSnapshot<P = unknown, R = unknown>(storage: Storage | null | undefined, query: string, now?: number): PeopleSnapshot<P, R> | null;
