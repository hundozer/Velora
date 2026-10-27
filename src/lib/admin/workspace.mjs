export const sources = [
  { kind: 'report', label: 'Reports', path: '/api/admin/moderation?queue=1', field: 'cases', permission: 'moderation:view', limit: 500 },
  { kind: 'album', label: 'Albums', path: '/api/admin/albums?queue=1', field: 'albums', permission: 'content:view', limit: 200 },
  { kind: 'photo', label: 'Photos', path: '/api/admin/media?queue=1', field: 'media', permission: 'content:view', limit: 200 },
  { kind: 'verification', label: 'Verification', path: '/api/admin/verification?queue=1', field: 'reviews', permission: 'verification:view', limit: 250 },
];
export const readable = value => String(value || '').toLowerCase().replaceAll('_', ' ').replace(/^./, c => c.toUpperCase());
const urgentReasons = new Set(['SUSPECTED_MINOR', 'NON_CONSENSUAL_INTIMATE_CONTENT', 'EXPLOITATION_TRAFFICKING']);
export function normalizeWork(kind, rows) {
  return rows.filter(row => kind === 'report' ? ['OPEN', 'UNDER_REVIEW', 'ACTION_REQUIRED', 'ESCALATED', 'APPEALED'].includes(row.status)
    : kind === 'verification' ? ['PENDING', 'REVIEW_REQUIRED'].includes(row.status)
    : ['PENDING_REVIEW', 'UNDER_REVIEW'].includes(row.moderation_status) && (kind !== 'photo' || (row.category !== 'MESSAGE' && row.upload_status === 'AVAILABLE')))
    .map(row => ({ key: `${kind}:${row.id}`, kind, id: row.id, row,
      title: row.title || (kind === 'report' ? `${readable(row.content_type || 'Member')} report` : kind === 'verification' ? `${readable(row.verification_type)} verification` : row.media_type === 'VIDEO' ? 'Untitled video' : 'Untitled photo'),
      ownerId: row.owner_id || row.reported_user_id || row.profile_id,
      createdAt: row.submitted_at || row.created_at,
      urgent: kind === 'report' && (row.priority === 'CRITICAL' || urgentReasons.has(row.reason)),
      priority: row.priority || 'NORMAL', assignedTo: row.assigned_moderator || row.reviewed_by || null,
    }));
}
export function sortWork(items) {
  const rank = item => item.urgent ? 0 : item.priority === 'HIGH' ? 1 : 2;
  return [...items].sort((a, b) => rank(a) - rank(b) || (Date.parse(a.createdAt) || 0) - (Date.parse(b.createdAt) || 0) || a.key.localeCompare(b.key));
}
export function waiting(value, now = Date.now()) {
  const minutes = Math.max(0, Math.floor((now - Date.parse(value)) / 60000));
  return !Number.isFinite(minutes) ? 'Unknown age' : minutes < 60 ? `${minutes} min` : minutes < 1440 ? `${Math.floor(minutes / 60)} h` : `${Math.floor(minutes / 1440)} d`;
}
export function photoReady(photo) { return Boolean(photo && photo.upload_status === 'AVAILABLE' && photo.processing_status === 'READY' && photo.moderation_status !== 'REMOVED'); }
export function albumReady(photos) { return photos.length > 0 && photos.every(photo => photoReady(photo) && photo.moderation_status === 'APPROVED'); }
