ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS message text,
  ADD COLUMN IF NOT EXISTS email text;

UPDATE public.contacts SET full_name = COALESCE(full_name, name), message = COALESCE(message, content);