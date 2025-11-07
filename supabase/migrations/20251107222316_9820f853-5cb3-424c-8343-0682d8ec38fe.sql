-- Fix: Allow user_role_audit to cascade when user is deleted
-- This prevents foreign key violations during user deletion

ALTER TABLE public.user_role_audit
DROP CONSTRAINT IF EXISTS user_role_audit_user_id_fkey;

ALTER TABLE public.user_role_audit
ADD CONSTRAINT user_role_audit_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;