-- Fix: Make user_role_audit foreign key DEFERRABLE
-- This allows the constraint check to happen at END of transaction
-- instead of immediately, avoiding issues with trigger + cascade

ALTER TABLE public.user_role_audit
DROP CONSTRAINT IF EXISTS user_role_audit_user_id_fkey;

ALTER TABLE public.user_role_audit
ADD CONSTRAINT user_role_audit_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE
DEFERRABLE INITIALLY DEFERRED;