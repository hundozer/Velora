export type ChemistryFeedKind = "PROFILE" | "DATING_AD" | "POST" | "ALBUM" | "IMAGE" | "VIDEO" | "EVENT" | "ROOM";
export interface ChemistryItem {
  id: string;
  type: ChemistryFeedKind;
  actor: { id: string; displayName: string; avatarUrl?: string; verified: boolean };
  title: string;
  body?: string;
  category?: string;
  mediaUrl?: string;
  href: string;
  occurredAt: string;
  reactionSummary?: { count: number; liked: boolean };
  why?: string;
}
export declare const EXPLANATIONS: Readonly<Record<string, string>>;
export declare function explainItem(
  item: ChemistryItem,
  context?: { following?: ReadonlySet<string>; friends?: ReadonlySet<string> }
): string;
export declare function rankChemistryFeed<T extends ChemistryItem>(
  items: T[],
  context?: { following?: ReadonlySet<string>; friends?: ReadonlySet<string> },
  now?: number,
  limit?: number
): Array<T & { why: string }>;
