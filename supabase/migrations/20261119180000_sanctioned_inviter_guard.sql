-- FM: do not let suspended, banned or deactivated members sponsor new registrations.
-- ROLLBACK: restore is_member_invite_valid and redeem_member_invite from
-- 20261119150000_attributed_invitation_codes.sql. No data is rewritten.
-- Admin-issued codes with owner_profile_id IS NULL remain usable.
CREATE OR REPLACE FUNCTION public.is_member_invite_valid(p_token_hash text,p_email_hash text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT (p_token_hash ~ '^[a-f0-9]{64}$') AND (p_email_hash ~ '^[a-f0-9]{64}$') AND (
 EXISTS (SELECT 1 FROM public.member_email_invites mi
   JOIN public.profiles inviter ON inviter.id=mi.inviter_profile_id
   WHERE mi.token_sha256=p_token_hash AND mi.recipient_sha256=p_email_hash
     AND mi.status='SENT' AND mi.expires_at>now()
     AND inviter.account_status='ACTIVE'
     AND coalesce(inviter.account_lifecycle_status,'ACTIVE')='ACTIVE')
 OR EXISTS (SELECT 1 FROM public.invitation_codes ic
   WHERE ic.code_sha256=p_token_hash AND ic.revoked_at IS NULL
     AND ic.expires_at>now() AND ic.uses<ic.max_uses
     AND (ic.owner_profile_id IS NULL OR EXISTS (
       SELECT 1 FROM public.profiles owner
       WHERE owner.id=ic.owner_profile_id
         AND owner.account_status='ACTIVE'
         AND coalesce(owner.account_lifecycle_status,'ACTIVE')='ACTIVE'
     ))));
$$;
CREATE OR REPLACE FUNCTION public.redeem_member_invite(p_token_hash text,p_email_hash text,p_auth_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_id uuid; v_code uuid;
BEGIN
 IF p_token_hash !~ '^[a-f0-9]{64}$' OR p_email_hash !~ '^[a-f0-9]{64}$' OR p_auth_id IS NULL
 THEN RETURN false; END IF;
 UPDATE public.member_email_invites mi
   SET status='REDEEMED',redeemed_at=now(),redeemed_auth_id=p_auth_id
   FROM public.profiles inviter
 WHERE mi.inviter_profile_id=inviter.id
   AND inviter.account_status='ACTIVE'
   AND coalesce(inviter.account_lifecycle_status,'ACTIVE')='ACTIVE'
   AND mi.token_sha256=p_token_hash AND mi.recipient_sha256=p_email_hash
   AND mi.status='SENT' AND mi.expires_at>now()
 RETURNING mi.id INTO v_id;
 IF v_id IS NOT NULL THEN RETURN true; END IF;
 IF EXISTS(SELECT 1 FROM public.invitation_code_redemptions WHERE auth_id=p_auth_id)
 THEN RETURN false; END IF;
 UPDATE public.invitation_codes ic SET uses=ic.uses+1
 WHERE ic.code_sha256=p_token_hash AND ic.revoked_at IS NULL
   AND ic.expires_at>now() AND ic.uses<ic.max_uses
   AND (ic.owner_profile_id IS NULL OR EXISTS (
     SELECT 1 FROM public.profiles owner WHERE owner.id=ic.owner_profile_id
       AND owner.account_status='ACTIVE'
       AND coalesce(owner.account_lifecycle_status,'ACTIVE')='ACTIVE'
   ))
 RETURNING ic.id INTO v_code;
 IF v_code IS NULL THEN RETURN false; END IF;
 INSERT INTO public.invitation_code_redemptions(code_id,auth_id) VALUES(v_code,p_auth_id);
 RETURN true;
 EXCEPTION WHEN unique_violation THEN RETURN false;
END $$;
REVOKE ALL ON FUNCTION public.is_member_invite_valid(text,text) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.redeem_member_invite(text,text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.is_member_invite_valid(text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.redeem_member_invite(text,text,uuid) TO service_role;
