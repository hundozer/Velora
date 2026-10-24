import { NextRequest, NextResponse } from 'next/server';
import { requireAdminPermission } from '@/lib/auth/adminApi';
import { getServerSupabase } from '@/lib/supabase/server';
export const dynamic = 'force-dynamic';
export async function GET(req: NextRequest) {
  const auth = await requireAdminPermission(req, 'settings:view'); if ('response' in auth) return auth.response;
  const db = getServerSupabase(); if (!db) return NextResponse.json({ error: 'Operational checks unavailable' }, { status: 503 });
  const [email, media] = await Promise.all([
    db.from('unread_email_outbox').select('id', { count: 'exact', head: true }).eq('status', 'FAILED'),
    db.from('media_objects').select('id', { count: 'exact', head: true }).eq('processing_status', 'FAILED').neq('upload_status', 'REMOVED'),
  ]);
  return NextResponse.json({ checkedAt: new Date().toISOString(), checks: [
    { label: 'Unread-message emails needing intervention', count: email.error ? null : email.count, detail: 'Jobs that exhausted automatic retries. Inspect before retrying to avoid duplicate mail.' },
    { label: 'Failed photo processing', count: media.error ? null : media.count, detail: 'Uploads that could not be processed. These cannot be approved.' },
  ] }, { headers: { 'Cache-Control': 'private, no-store' } });
}
