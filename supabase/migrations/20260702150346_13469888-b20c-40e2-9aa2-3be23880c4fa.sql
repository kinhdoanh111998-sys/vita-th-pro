ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS zalo_id text UNIQUE;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS avatar_url text;