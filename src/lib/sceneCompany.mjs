/** Event-linked invitations use the organiser's published time, never a client date. */
export const SCENE_COMPANY_HORIZON_MS = 90 * 86400000;
export function sceneCompanyWindow(event, now = new Date(), allowStarted = false) {
  const start = Date.parse(event.starts_at);
  const end = Math.min(event.ends_at ? Date.parse(event.ends_at) : start + 3 * 3600000, start + 12 * 3600000);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end - start < 30 * 60000 || end <= now.getTime() || (!allowStarted && start <= now.getTime()) || start > now.getTime() + SCENE_COMPANY_HORIZON_MS) return null;
  return { startsAt: new Date(start).toISOString(), endsAt: new Date(end).toISOString() };
}
export function scenePlanCurrent(plan, event, now = new Date()) {
  if (!event || event.status !== 'PUBLISHED') return false;
  const window = sceneCompanyWindow(event, now, true);
  return !!window && Date.parse(plan.starts_at) === Date.parse(window.startsAt) && Date.parse(plan.expires_at) === Date.parse(window.endsAt);
}
