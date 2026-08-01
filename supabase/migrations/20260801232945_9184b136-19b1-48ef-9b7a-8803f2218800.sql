ALTER TABLE public.athletes ADD COLUMN IF NOT EXISTS sport_gender TEXT;
ALTER TABLE public.athletes DROP CONSTRAINT IF EXISTS athletes_sport_gender_check;
ALTER TABLE public.athletes ADD CONSTRAINT athletes_sport_gender_check CHECK (sport_gender IN ('mens','womens'));