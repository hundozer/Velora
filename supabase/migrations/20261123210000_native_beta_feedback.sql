-- Native anonymous beta survey. No profile IDs, auth IDs, emails, IPs or user agents.
-- Service role only; admin reads require application-side MFA and permission.
-- Contact opt-ins are stored separately without a response ID.
CREATE TABLE IF NOT EXISTS public.beta_feedback_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submitted_on date NOT NULL DEFAULT current_date,
  language text NOT NULL CHECK (language IN ('en','cs')),
  answers jsonb NOT NULL CHECK (jsonb_typeof(answers)='object' AND pg_column_size(answers)<16000)
);
CREATE TABLE IF NOT EXISTS public.beta_feedback_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submitted_on date NOT NULL DEFAULT current_date,
  contact text NOT NULL CHECK (length(trim(contact)) BETWEEN 3 AND 200),
  consented boolean NOT NULL DEFAULT true CHECK (consented)
);
ALTER TABLE public.beta_feedback_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beta_feedback_contacts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.beta_feedback_responses,public.beta_feedback_contacts FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT ON public.beta_feedback_responses,public.beta_feedback_contacts TO service_role;
CREATE INDEX IF NOT EXISTS beta_feedback_responses_submitted_idx ON public.beta_feedback_responses(submitted_on DESC);
CREATE INDEX IF NOT EXISTS beta_feedback_contacts_submitted_idx ON public.beta_feedback_contacts(submitted_on DESC);
