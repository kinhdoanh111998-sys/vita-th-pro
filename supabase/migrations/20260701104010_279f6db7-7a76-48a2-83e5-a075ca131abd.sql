
-- 1. users profile table
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text,
  role text NOT NULL DEFAULT 'customer',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
CREATE POLICY "Users can read own profile"
  ON public.users FOR SELECT
  TO authenticated
  USING (email = auth.jwt() ->> 'email');

-- 2. Create admin auth user (idempotent)
DO $$
DECLARE
  new_uid uuid;
  existing_uid uuid;
BEGIN
  SELECT id INTO existing_uid FROM auth.users WHERE email = 'zinzon010198@gmail.com';

  IF existing_uid IS NULL THEN
    new_uid := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change,
      email_change_token_new, recovery_token
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_uid,
      'authenticated',
      'authenticated',
      'zinzon010198@gmail.com',
      crypt('Minhquang98$', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{}'::jsonb,
      now(), now(), '', '', '', ''
    );

    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    )
    VALUES (
      gen_random_uuid(),
      new_uid,
      jsonb_build_object('sub', new_uid::text, 'email', 'zinzon010198@gmail.com', 'email_verified', true),
      'email',
      'zinzon010198@gmail.com',
      now(), now(), now()
    );
  ELSE
    -- Reset password + ensure confirmed
    UPDATE auth.users
       SET encrypted_password = crypt('Minhquang98$', gen_salt('bf')),
           email_confirmed_at = COALESCE(email_confirmed_at, now()),
           updated_at = now()
     WHERE id = existing_uid;
    new_uid := existing_uid;
  END IF;

  -- 3. Upsert profile row with admin role
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (new_uid, 'zinzon010198@gmail.com', 'Administrator', 'admin')
  ON CONFLICT (email) DO UPDATE SET role = 'admin', id = EXCLUDED.id;
END $$;
