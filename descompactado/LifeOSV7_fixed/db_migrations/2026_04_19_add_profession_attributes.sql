ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS profession_attributes JSONB DEFAULT '{}'::jsonb;
