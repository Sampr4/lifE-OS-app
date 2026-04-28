-- LifeOS fix: profession personalization + AI generation stability

ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS profession_attributes JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.ai_generations
ADD COLUMN IF NOT EXISTS raw_output JSONB,
ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Optional: keep old rows valid
UPDATE public.user_profiles
SET profession_attributes = '{}'::jsonb
WHERE profession_attributes IS NULL;
