import type { AdminPermission } from '@/lib/auth/adminAuthorization';
export type WorkspaceActor = { role: string; email: string; profileId: string; mfaAuthenticated: boolean; permissions: AdminPermission[] };
export type ReviewPhoto = { id: string; title?: string | null; moderation_status: string; upload_status: string; processing_status: string };
export type WorkItem = { key: string; kind: string; id: string; title: string; ownerId?: string; createdAt: string; urgent: boolean; priority: string; assignedTo?: string | null; row: Record<string, any> };
export const buttonClass = 'min-h-11 rounded-lg border border-velora-control bg-velora-surface px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-velora-accent disabled:cursor-not-allowed disabled:opacity-40';
