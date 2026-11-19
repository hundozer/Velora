type Share = { count: number; pct: number | null };
export type FounderMetrics = {
  generatedAt: string;
  invitationCodeSources: Array<{source:string;signups:number}>;
  members: { total: number; newLast7Days: number; activeLast7Days: number; verified: number; verifiedPct: number | null; foundingMembers: number };
  mix: { women: Share; men: Share; couples: Share; nonBinaryOrOther: Share; notStated: Share };
  invitationRequests: { pending: number; approved: number; rejected: number; total: number; mix: { women: number; men: number; couples: number; nonBinaryOrOther: number } };
  invitations: { sent: number; joined: number; waiting: number; expired: number; acceptancePct: number | null };
  reports: { last30Days: number; per100Members: number | null };
  weekly: Array<{ weekStart: string; newMembers: number; invitationRequests: number; invitationsSent: number; invitationsAccepted: number; reports: number }>;
};
export declare function weekStart(ms: number): number;
export declare function isCountedMember(profile: Record<string, unknown>): boolean;
export declare function mixOf(profile: Record<string, unknown>): string;
export declare function founderMetrics(rows: { profiles: any[]; requests: any[]; invites: any[]; reports: any[]; codes?: any[] }, now?: number, weeks?: number): FounderMetrics;
export declare function metricsSummary(metrics: FounderMetrics): string;
