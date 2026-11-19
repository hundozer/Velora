-- ROLLBACK (requires no cases using new reason or policy ground):
-- ALTER TABLE public.moderation_cases DROP CONSTRAINT IF EXISTS moderation_cases_reason_check;
-- ALTER TABLE public.moderation_cases ADD CONSTRAINT moderation_cases_reason_check CHECK (reason IN
-- ('SUSPECTED_MINOR','NON_CONSENSUAL_INTIMATE_CONTENT','HARASSMENT','THREATS','IMPERSONATION',
-- 'SCAM_FRAUD','ILLEGAL_CONTENT','EXPLOITATION_TRAFFICKING','COPYRIGHT_INFRINGEMENT',
-- 'PRIVACY_VIOLATION','PROHIBITED_COMMERCIAL_SEXUAL_SERVICES','SPAM','OTHER'));
-- ALTER TABLE public.moderation_cases DROP CONSTRAINT IF EXISTS moderation_cases_policy_ground_check;
-- ALTER TABLE public.moderation_cases ADD CONSTRAINT moderation_cases_policy_ground_check CHECK
-- (policy_ground IS NULL OR policy_ground IN ('MINORS','CONSENT','HARASSMENT','IMPERSONATION','SCAM','PRIVACY','ILLEGAL','COPYRIGHT','SPAM','OTHER'));
-- No existing cases are rewritten.
ALTER TABLE public.moderation_cases DROP CONSTRAINT IF EXISTS moderation_cases_reason_check;
ALTER TABLE public.moderation_cases ADD CONSTRAINT moderation_cases_reason_check CHECK (reason IN
 ('SUSPECTED_MINOR','NON_CONSENSUAL_INTIMATE_CONTENT','NON_CONSENSUAL_SCREENSHOT','HARASSMENT',
  'THREATS','IMPERSONATION','SCAM_FRAUD','ILLEGAL_CONTENT','EXPLOITATION_TRAFFICKING',
  'COPYRIGHT_INFRINGEMENT','PRIVACY_VIOLATION','PROHIBITED_COMMERCIAL_SEXUAL_SERVICES','SPAM','OTHER'));
ALTER TABLE public.moderation_cases DROP CONSTRAINT IF EXISTS moderation_cases_policy_ground_check;
ALTER TABLE public.moderation_cases ADD CONSTRAINT moderation_cases_policy_ground_check CHECK
 (policy_ground IS NULL OR policy_ground IN
 ('MINORS','CONSENT','HARASSMENT','IMPERSONATION','SCAM','PRIVACY','SCREENSHOT_CONSENT','ILLEGAL','COPYRIGHT','SPAM','OTHER'));
