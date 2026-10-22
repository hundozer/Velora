/** Provider acceptance is not proof of delivery to an inbox. */
export class EmailDeliveryError extends Error {
  constructor(code) { super(code); this.name = 'EmailDeliveryError'; }
}

export async function sendQueuedEmail(payload, jobId, { apiKey, fetchImpl = fetch }) {
  if (!apiKey) throw new EmailDeliveryError('provider_not_configured');
  let response;
  try {
    response = await fetchImpl('https://api.resend.com/emails', {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(10000),
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': `intimo-unread/${jobId}` },
      body: JSON.stringify(payload),
    });
  } catch { throw new EmailDeliveryError('provider_transport'); }
  if (!response.ok) throw new EmailDeliveryError(`provider_http_${response.status}`);
  const data = await response.json().catch(() => null);
  if (!data?.id || typeof data.id !== 'string') throw new EmailDeliveryError('provider_invalid_receipt');
  return { id: data.id, accepted: true };
}
