-- Beta thank-you: three ONE-TIME bonus invites on top of the regular rolling allowance.
-- Available from 2027-01-01 UTC, not immediately during December beta.
-- Rollback: restore both claim RPCs from 20261123110000_member_share_links.sql;
-- DROP TRIGGER beta_reward_on_code_redemption ON public.invitation_code_redemptions;
-- DROP FUNCTION public.award_beta_invite_on_redeem(); DROP TABLE public.beta_tester_invite_rewards;
-- DROP TABLE public.beta_eligible_invitation_codes. Do not erase issued invites.
-- DROP TRIGGER beta_refund_failed_invite ON public.member_email_invites;
-- DROP FUNCTION public.refund_failed_beta_email_invite();

ALTER TABLE public.member_email_invites ADD COLUMN IF NOT EXISTS is_beta_bonus boolean NOT NULL DEFAULT false;
ALTER TABLE public.invitation_codes ADD COLUMN IF NOT EXISTS is_beta_bonus boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.beta_eligible_invitation_codes (
  code_id uuid PRIMARY KEY REFERENCES public.invitation_codes(id) ON DELETE RESTRICT,
  added_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.beta_eligible_invitation_codes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.beta_eligible_invitation_codes FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON public.beta_eligible_invitation_codes TO service_role;

-- Only the ten current, non-revoked personal Carolinka invites are in the
-- first beta cohort. An admin may explicitly add other beta batches later.
INSERT INTO public.beta_eligible_invitation_codes (code_id)
SELECT id FROM public.invitation_codes
WHERE owner_name='Carolinka'
  AND source_label ~ '^Carolinka — Invite (0[1-9]|10)$'
  AND max_uses=1 AND revoked_at IS NULL
ON CONFLICT (code_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.beta_tester_invite_rewards (
  profile_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  source_code_id uuid NOT NULL REFERENCES public.beta_eligible_invitation_codes(code_id) ON DELETE RESTRICT,
  bonus_total smallint NOT NULL DEFAULT 3 CHECK (bonus_total=3),
  bonus_used smallint NOT NULL DEFAULT 0 CHECK (bonus_used BETWEEN 0 AND 3),
  available_at timestamptz NOT NULL DEFAULT '2027-01-01 00:00:00+00'::timestamptz,
  awarded_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.beta_tester_invite_rewards ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.beta_tester_invite_rewards FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.beta_tester_invite_rewards TO service_role;

-- The immutable redemption ledger is the only authority for beta eligibility.
-- Do not award from a link click, unverified signup, or user-editable profile.
CREATE OR REPLACE FUNCTION public.award_beta_invite_on_redeem()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
  IF EXISTS(SELECT 1 FROM public.beta_eligible_invitation_codes WHERE code_id=NEW.code_id) THEN
    INSERT INTO public.beta_tester_invite_rewards(profile_id,source_code_id)
    SELECT p.id, NEW.code_id FROM public.profiles p WHERE p.id=NEW.auth_id
    ON CONFLICT (profile_id) DO NOTHING;
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.award_beta_invite_on_redeem() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS beta_reward_on_code_redemption ON public.invitation_code_redemptions;
CREATE TRIGGER beta_reward_on_code_redemption AFTER INSERT ON public.invitation_code_redemptions
FOR EACH ROW EXECUTE FUNCTION public.award_beta_invite_on_redeem();

-- Backfill only confirmed beta-code redemptions; never expired/unused codes.
INSERT INTO public.beta_tester_invite_rewards(profile_id,source_code_id)
SELECT p.id,r.code_id FROM public.invitation_code_redemptions r
JOIN public.beta_eligible_invitation_codes e ON e.code_id=r.code_id
JOIN public.profiles p ON p.id=r.auth_id
ON CONFLICT (profile_id) DO NOTHING;

-- Failed delivery must not consume a beta thank-you invitation.
-- This fires only for a transition into FAILED on a bonus email invite.
CREATE OR REPLACE FUNCTION public.refund_failed_beta_email_invite()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF NEW.is_beta_bonus AND NEW.status='FAILED' AND OLD.status='PENDING' THEN
   PERFORM pg_advisory_xact_lock(hashtextextended(NEW.inviter_profile_id::text,173));
   UPDATE public.beta_tester_invite_rewards SET bonus_used=greatest(0,bonus_used-1)
   WHERE profile_id=NEW.inviter_profile_id;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.refund_failed_beta_email_invite() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS beta_refund_failed_invite ON public.member_email_invites;
CREATE TRIGGER beta_refund_failed_invite AFTER UPDATE OF status ON public.member_email_invites
FOR EACH ROW EXECUTE FUNCTION public.refund_failed_beta_email_invite();

-- Both issuing paths lock the same inviter and spend the standard allowance
-- first. Only after 3 regular invites have been issued in the rolling window
-- can a beta recipient spend one of their 3 one-time reward invites.
CREATE OR REPLACE FUNCTION public.claim_member_share_invite(p_inviter uuid,p_token_hash text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_id uuid; v_membership text; v_issued bigint; v_bonus uuid; v_is_bonus boolean := false;
BEGIN
 IF p_inviter IS NULL OR p_token_hash !~ '^[a-f0-9]{64}$'
 THEN RAISE EXCEPTION 'Invalid invitation input' USING errcode='22023'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_inviter::text,173));
 SELECT membership_level INTO v_membership FROM public.profiles WHERE id=p_inviter
   AND account_status='ACTIVE' AND coalesce(account_lifecycle_status,'ACTIVE')='ACTIVE';
 IF NOT FOUND THEN RAISE EXCEPTION 'Active membership required' USING errcode='42501'; END IF;
 IF v_membership IS DISTINCT FROM 'FOUNDING_MEMBER' THEN
   SELECT
      (SELECT count(*) FROM public.member_email_invites WHERE inviter_profile_id=p_inviter
        AND status IN ('PENDING','SENT','REDEEMED') AND is_beta_bonus=false AND created_at>now()-interval '3 months')
      +
      (SELECT count(*) FROM public.invitation_codes WHERE owner_profile_id=p_inviter
        AND source_label='MEMBER_SHARE_LINK' AND is_beta_bonus=false AND created_at>now()-interval '3 months')
   INTO v_issued;
   IF v_issued>=3 THEN
     UPDATE public.beta_tester_invite_rewards SET bonus_used=bonus_used+1
     WHERE profile_id=p_inviter AND available_at<=now() AND bonus_used<bonus_total
     RETURNING profile_id INTO v_bonus;
     IF v_bonus IS NULL THEN RAISE EXCEPTION 'Invitation allowance exhausted' USING errcode='P0001'; END IF;
     v_is_bonus := true;
   END IF;
 END IF;
 INSERT INTO public.invitation_codes
   (code_sha256,source_label,owner_name,owner_profile_id,max_uses,expires_at,created_by,is_beta_bonus)
 VALUES (p_token_hash,'MEMBER_SHARE_LINK','Member invitation',p_inviter,1,now()+interval '30 days',p_inviter,v_is_bonus)
 RETURNING id INTO v_id;
 RETURN v_id;
END $$;
REVOKE ALL ON FUNCTION public.claim_member_share_invite(uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_member_share_invite(uuid,text) TO service_role;

CREATE OR REPLACE FUNCTION public.claim_member_email_invite(p_inviter uuid,p_email_hash text,p_token_hash text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_id uuid; v_membership text; v_issued bigint; v_bonus uuid; v_is_bonus boolean := false;
BEGIN
 IF p_inviter IS NULL OR p_email_hash !~ '^[a-f0-9]{64}$' OR p_token_hash !~ '^[a-f0-9]{64}$'
 THEN RAISE EXCEPTION 'Invalid invitation input' USING errcode='22023'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_inviter::text,173));
 SELECT membership_level INTO v_membership FROM public.profiles WHERE id=p_inviter
   AND account_status='ACTIVE' AND coalesce(account_lifecycle_status,'ACTIVE')='ACTIVE';
 IF NOT FOUND THEN RAISE EXCEPTION 'Active membership required' USING errcode='42501'; END IF;
 IF v_membership IS DISTINCT FROM 'FOUNDING_MEMBER' THEN
   SELECT
     (SELECT count(*) FROM public.member_email_invites WHERE inviter_profile_id=p_inviter
       AND status IN ('PENDING','SENT','REDEEMED') AND is_beta_bonus=false AND created_at>now()-interval '3 months')
     +
     (SELECT count(*) FROM public.invitation_codes WHERE owner_profile_id=p_inviter
       AND source_label='MEMBER_SHARE_LINK' AND is_beta_bonus=false AND created_at>now()-interval '3 months')
   INTO v_issued;
   IF v_issued>=3 THEN
     UPDATE public.beta_tester_invite_rewards SET bonus_used=bonus_used+1
     WHERE profile_id=p_inviter AND available_at<=now() AND bonus_used<bonus_total
     RETURNING profile_id INTO v_bonus;
     IF v_bonus IS NULL THEN RAISE EXCEPTION 'Invitation allowance exhausted' USING errcode='P0001'; END IF;
     v_is_bonus := true;
   END IF;
 END IF;
 IF EXISTS(SELECT 1 FROM public.member_email_invites WHERE recipient_sha256=p_email_hash
   AND status IN ('PENDING','SENT','REDEEMED') AND created_at>now()-interval '30 days')
 THEN RAISE EXCEPTION 'This address has received a recent invitation' USING errcode='23505'; END IF;
 INSERT INTO public.member_email_invites(inviter_profile_id,recipient_sha256,token_sha256,expires_at,is_beta_bonus)
 VALUES(p_inviter,p_email_hash,p_token_hash,now()+interval '30 days',v_is_bonus) RETURNING id INTO v_id;
 RETURN v_id;
END $$;
REVOKE ALL ON FUNCTION public.claim_member_email_invite(uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_member_email_invite(uuid,text,text) TO service_role;
