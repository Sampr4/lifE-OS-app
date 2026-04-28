-- LifeOS: Add missing profession_attributes column to user_profiles
-- Run this in Supabase SQL Editor if you see PGRST204 errors for profession_attributes
-- Dashboard: https://app.supabase.com/project/xlyxrepcvhkxdhuykcbw/editor

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS profession_attributes JSONB DEFAULT '{}';

-- Verify:
-- SELECT column_name FROM information_schema.columns 
-- WHERE table_name = 'user_profiles' AND column_name = 'profession_attributes';
