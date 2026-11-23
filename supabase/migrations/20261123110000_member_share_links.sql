-- Member share links: one use, 30 days, combined quota with email invitations.
-- Rollback: DROP FUNCTION public.claim_member_share_invite(uuid,text);
-- Restore claim_member_email_invite from 20261108200000_founder_unlimited_invitations.sql.
-- Existing issued codes and redemptions must remain intact on rollback.
CREATE OR REPLACE FUNCTION public.claim_member_share_invite(p_inviter uuid, p_token_hash text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_id uuid; v_membership text; v_issued bigint;
BEGIN
  IF p_inviter IS NULL OR p_token_hash !~ '^[a-f0-9]{64}$'
    THEN RAISE EXCEPTION 'Invalid invitation input' USING errcode='22023'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_inviter::text,173));
  SELECT membership_level INTO v_membership FROM public.profiles
   WHERE id=p_inviter AND account_status='ACTIVE'
     AND coalesce(account_lifecycle_status,'ACTIVE')='ACTIVE';
  IF NOT FOUND THEN RAISE EXCEPTION 'Active membership required' USING errcode='42501'; END IF;
  IF v_membership IS DISTINCT FROM 'FOUNDING_MEMBER' THEN
    SELECT
      (SELECT count(*) FROM public.member_email_invites
        WHERE inviter_profile_id=p_inviter AND status IN ('PENDING','SENT','REDEEMED')
          AND created_at>now()-interval '3 months')
      +
      (SELECT count(*) FROM public.invitation_codes
        WHERE owner_profile_id=p_inviter AND source_label='MEMBER_SHARE_LINK'
          AND created_at>now()-interval '3 months')
    INTO v_issued;
    IF v_issued>=3 THEN RAISE EXCEPTION 'Invitation allowance exhausted' USING errcode='P0001'; END IF;
  END IF;
  INSERT INTO public.invitation_codes
    (code_sha256,source_label,owner_name,owner_profile_id,max_uses,expires_at,created_by)
  VALUES (p_token_hash,'MEMBER_SHARE_LINK','Member invitation',p_inviter,1,now()+interval '30 days',p_inviter)
  RETURNING id INTO v_id;
  RETURN v_id;
END $$;
REVOKE ALL ON FUNCTION public.claim_member_share_invite(uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_member_share_invite(uuid,text) TO service_role;

-- Apply the exact same combined quota to old email invitations. The advisory lock
-- is shared between both claim functions to prevent concurrent limit bypass.
CREATE OR REPLACE FUNCTION public.claim_member_email_invite(p_inviter uuid, p_email_hash text, p_token_hash text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_id uuid; v_membership text; v_issued bigint;
BEGIN
 IF p_inviter IS NULL OR p_email_hash !~ '^[a-f0-9]{64}$' OR p_token_hash !~ '^[a-f0-9]{64}$'
 THEN RAISE EXCEPTION 'Invalid invitation input' USING errcode='22023'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_inviter::text,173));
 SELECT membership_level INTO v_membership FROM public.profiles
 WHERE id=p_inviter AND account_status='ACTIVE'
   AND coalesce(account_lifecycle_status,'ACTIVE')='ACTIVE';
 IF NOT FOUND THEN RAISE EXCEPTION 'Active membership required' USING errcode='42501'; END IF;
 IF v_membership IS DISTINCT FROM 'FOUNDING_MEMBER' THEN
   SELECT
     (SELECT count(*) FROM public.member_email_invites WHERE inviter_profile_id=p_inviter
       AND status IN ('PENDING','SENT','REDEEMED') AND created_at>now()-interval '3 months')
     +
     (SELECT count(*) FROM public.invitation_codes WHERE owner_profile_id=p_inviter
       AND source_label='MEMBER_SHARE_LINK' AND created_at>now()-interval '3 months')
   INTO v_issued;
   IF v_issued>=3 THEN RAISE EXCEPTION 'Invitation allowance exhausted' USING errcode='P0001'; END IF;
 END IF;
 IF EXISTS(SELECT 1 FROM public.member_email_invites WHERE recipient_sha256=p_email_hash
   AND status IN ('PENDING','SENT','REDEEMED') AND created_at>now()-interval '30 days')
 THEN RAISE EXCEPTION 'This address has received a recent invitation' USING errcode='23505'; END IF;
 INSERT INTO public.member_email_invites(inviter_profile_id,recipient_sha256,token_sha256,expires_at)
 VALUES(p_inviter,p_email_hash,p_token_hash,now()+interval '30 days') RETURNING id INTO v_id;
 RETURN v_id;
END $$;
REVOKE ALL ON FUNCTION public.claim_member_email_invite(uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_member_email_invite(uuid,text,text) TO service_role;
