-- ROLLBACK (only if no issued codes or redeemed memberships depend on this migration):
-- DROP FUNCTION IF EXISTS public.redeem_member_invite(text,text,uuid);
-- DROP FUNCTION IF EXISTS public.is_member_invite_valid(text,text);
-- DROP TABLE IF EXISTS public.invitation_code_redemptions;
-- DROP TABLE IF EXISTS public.invitation_codes;
-- Restore the two original RPC definitions from 20261108190000_invitation_only_membership.sql.
-- Do not run rollback with live redemptions.
CREATE TABLE IF NOT EXISTS public.invitation_codes (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 code_sha256 text NOT NULL UNIQUE CHECK (code_sha256 ~ '^[a-f0-9]{64}$'),
 source_label text NOT NULL CHECK (length(trim(source_label)) BETWEEN 1 AND 120),
 owner_name text NOT NULL CHECK (length(trim(owner_name)) BETWEEN 1 AND 120),
 owner_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
 max_uses integer NOT NULL CHECK (max_uses BETWEEN 1 AND 1000),
 uses integer NOT NULL DEFAULT 0 CHECK (uses >= 0 AND uses <= max_uses),
 expires_at timestamptz NOT NULL,
 revoked_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS public.invitation_code_redemptions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 code_id uuid NOT NULL REFERENCES public.invitation_codes(id) ON DELETE RESTRICT,
 auth_id uuid NOT NULL UNIQUE,
 redeemed_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(code_id,auth_id)
);
CREATE INDEX IF NOT EXISTS invitation_codes_owner_idx ON public.invitation_codes(owner_profile_id);
CREATE INDEX IF NOT EXISTS invitation_codes_source_idx ON public.invitation_codes(source_label);
CREATE INDEX IF NOT EXISTS invitation_code_redemptions_code_idx ON public.invitation_code_redemptions(code_id);
ALTER TABLE public.invitation_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitation_code_redemptions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.invitation_codes, public.invitation_code_redemptions FROM anon, authenticated;
-- Keep existing email-bound invitations unchanged. Code validation accepts any email.
CREATE OR REPLACE FUNCTION public.is_member_invite_valid(p_token_hash text,p_email_hash text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT (p_token_hash ~ '^[a-f0-9]{64}$') AND (
 EXISTS (SELECT 1 FROM public.member_email_invites
   WHERE token_sha256=p_token_hash AND recipient_sha256=p_email_hash
     AND status='SENT' AND expires_at>now())
 OR EXISTS (SELECT 1 FROM public.invitation_codes
   WHERE code_sha256=p_token_hash AND revoked_at IS NULL
     AND expires_at>now() AND uses<max_uses));
$$;
-- Serialized, one-use-per-account redemption. A full code never over-redeems.
CREATE OR REPLACE FUNCTION public.redeem_member_invite(p_token_hash text,p_email_hash text,p_auth_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_id uuid; v_code uuid;
BEGIN
 IF p_token_hash !~ '^[a-f0-9]{64}$' OR p_email_hash !~ '^[a-f0-9]{64}$' OR p_auth_id IS NULL THEN RETURN false; END IF;
 UPDATE public.member_email_invites
   SET status='REDEEMED',redeemed_at=now(),redeemed_auth_id=p_auth_id
 WHERE token_sha256=p_token_hash AND recipient_sha256=p_email_hash
   AND status='SENT' AND expires_at>now()
 RETURNING id INTO v_id;
 IF v_id IS NOT NULL THEN RETURN true; END IF;
 -- Block duplicates for an auth account before incrementing a code.
 IF EXISTS(SELECT 1 FROM public.invitation_code_redemptions WHERE auth_id=p_auth_id) THEN RETURN false; END IF;
 UPDATE public.invitation_codes SET uses=uses+1
 WHERE code_sha256=p_token_hash AND revoked_at IS NULL
   AND expires_at>now() AND uses<max_uses
 RETURNING id INTO v_code;
 IF v_code IS NULL THEN RETURN false; END IF;
 INSERT INTO public.invitation_code_redemptions(code_id,auth_id) VALUES(v_code,p_auth_id);
 RETURN true;
 EXCEPTION WHEN unique_violation THEN RETURN false;
END $$;
REVOKE ALL ON FUNCTION public.is_member_invite_valid(text,text) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.redeem_member_invite(text,text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.is_member_invite_valid(text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.redeem_member_invite(text,text,uuid) TO service_role;
