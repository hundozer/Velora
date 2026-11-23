-- Explicit, revocable collaborator access, independent from admin membership.
CREATE TABLE IF NOT EXISTS public.collaborator_workspaces (
 profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 workspace text NOT NULL CHECK (workspace IN ('BETA_COMMUNITY')),
 granted_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (profile_id, workspace)
);
ALTER TABLE public.collaborator_workspaces ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.collaborator_workspaces FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, DELETE ON public.collaborator_workspaces TO service_role;
-- Assignment is intentionally performed separately from this generic migration,
-- after verifying the existing real account in production.
