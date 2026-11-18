/**
 * FM-01 consent registry: one place for every consent Intimo asks for.
 *
 * Each consent is separate (GDPR Art. 9(2)(a) explicit consent for special-category data),
 * recorded as an append-only row in public.user_consents with its version and timestamp.
 * The version names the exact wording shown below. Changing a wording means a new version;
 * members who agreed to an older one are asked again (`needsRenewal`).
 * docs/CONSENT.md mirrors this file for the privacy policy.
 */
export const CONSENTS = {
  SPECIAL_CATEGORY_PROFILE: {
    version: "sensitive-profile-v2",
    // Older versions recorded before FM-01 still count as a valid grant of the same scope.
    acceptedVersions: ["sensitive-profile-v1", "sensitive-profile-v1-draft", "sensitive-profile-v2"],
    title: "Orientation and identity details",
    wording: "I explicitly consent to Intimo storing my sexual orientation and the identity details I choose to add, and showing them only to the audience I pick. I can withdraw this at any time in Settings, which deletes them.",
    // Profile columns erased on withdrawal. The two notes arrive with the FM-09 migration;
    // routes fall back to sexual_orientation alone while it is not yet applied.
    erasesProfileColumns: ["sexual_orientation", "orientation_note", "gender_note"],
  },
  SPECIAL_CATEGORY_DESIRES: {
    version: "desires-v1",
    acceptedVersions: ["desires-v1"],
    title: "Desires",
    wording: "I explicitly consent to Intimo storing my desires and showing the visible ones to signed-in members. I can withdraw this in Privacy settings, which erases them.",
    erasesProfileColumns: [],
    erasesTables: ["member_desires"],
  },
};

/** Consents a member can grant or withdraw through POST /api/privacy/consents. */
export const MEMBER_CONSENT_TYPES = Object.keys(CONSENTS);

/** Latest row for a consent type, or null. Rows may arrive in any order. */
export function latestConsent(rows, type) {
  let latest = null;
  for (const row of rows || []) {
    if (row?.consent_type !== type) continue;
    if (!latest || new Date(row.consent_timestamp).getTime() > new Date(latest.consent_timestamp).getTime()) latest = row;
  }
  return latest;
}

/**
 * Current state per consent type. `granted` is true only for a GRANTED row of an accepted
 * version; `needsRenewal` flags a grant of a version that is no longer accepted.
 */
export function consentStates(rows) {
  return Object.fromEntries(Object.entries(CONSENTS).map(([type, spec]) => {
    const latest = latestConsent(rows, type);
    const grantedRow = latest?.consent_status === "GRANTED";
    const accepted = grantedRow && spec.acceptedVersions.includes(latest.consent_version);
    return [type, {
      granted: accepted,
      needsRenewal: grantedRow && !accepted,
      version: latest?.consent_version ?? null,
      since: latest?.consent_timestamp ?? null,
      currentVersion: spec.version,
    }];
  }));
}

/** The row to append for a member's choice. */
export function consentRow({ profileId, type, granted, source, now = new Date().toISOString() }) {
  const spec = CONSENTS[type];
  if (!spec) throw new Error(`Unknown consent type: ${type}`);
  return {
    profile_id: profileId,
    consent_type: type,
    consent_version: spec.version,
    consent_timestamp: now,
    consent_status: granted ? "GRANTED" : "WITHDRAWN",
    withdrawn_at: granted ? null : now,
    source,
  };
}
