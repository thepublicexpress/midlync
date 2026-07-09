-- OTP storage for Midlync email verification

CREATE TABLE IF NOT EXISTS public.user_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  otp TEXT NOT NULL,
  purpose TEXT NOT NULL DEFAULT 'email_verification',
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '5 minutes'),
  created_at TIMESTAMPTZ DEFAULT now(),
  verified BOOLEAN DEFAULT FALSE,
  attempts INT DEFAULT 0
);

ALTER TABLE public.user_otps
  ADD COLUMN IF NOT EXISTS purpose TEXT NOT NULL DEFAULT 'email_verification';

CREATE INDEX IF NOT EXISTS idx_user_otps_user_id ON public.user_otps(user_id);
CREATE INDEX IF NOT EXISTS idx_user_otps_otp ON public.user_otps(otp);
CREATE INDEX IF NOT EXISTS idx_user_otps_purpose ON public.user_otps(purpose);

NOTIFY pgrst, 'reload schema';
