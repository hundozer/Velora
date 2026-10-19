type PersonLike = { isCoupleProfile?: boolean; gender?: string | null; presence?: "ONLINE" | "TODAY" | "WEEK" | null; areaName?: string | null; age?: number | null; headline?: string | null } | null | undefined;
export declare function possessive(person: PersonLike): "her" | "his" | "their";
export declare function subject(person: PersonLike): "she" | "he" | "they";
export declare const PRESENCE_WORDS: Record<"ONLINE" | "TODAY" | "WEEK", string>;
export declare function statusLine(person: PersonLike): string;
export declare function metaLine(person: PersonLike): string;
export declare function ownWords(person: PersonLike): string | null;
