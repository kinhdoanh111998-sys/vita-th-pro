
-- 1. Combos table
CREATE TABLE public.combos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  headline TEXT,
  subtitle TEXT,
  description TEXT DEFAULT '',
  image_url TEXT,
  discount_type TEXT NOT NULL DEFAULT 'percent',
  discount_value NUMERIC(14,2) NOT NULL DEFAULT 0,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT combos_discount_type_check CHECK (discount_type IN ('percent','amount')),
  CONSTRAINT combos_discount_value_check CHECK (discount_value >= 0)
);

GRANT SELECT ON public.combos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.combos TO authenticated;
GRANT ALL ON public.combos TO service_role;

ALTER TABLE public.combos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read visible combos"
  ON public.combos FOR SELECT
  TO anon, authenticated
  USING (is_hidden = false);

CREATE POLICY "Ops read all combos"
  ON public.combos FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'staff'));

CREATE POLICY "Admin insert combos"
  ON public.combos FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(),'admin'));

CREATE POLICY "Admin update combos"
  ON public.combos FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(),'admin'))
  WITH CHECK (has_role(auth.uid(),'admin'));

CREATE POLICY "Admin delete combos"
  ON public.combos FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_combos_updated_at
  BEFORE UPDATE ON public.combos
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 2. Combo items (junction)
CREATE TABLE public.combo_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  combo_id UUID NOT NULL REFERENCES public.combos(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT combo_items_qty_check CHECK (quantity > 0),
  CONSTRAINT combo_items_unique UNIQUE (combo_id, service_id)
);

GRANT SELECT ON public.combo_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.combo_items TO authenticated;
GRANT ALL ON public.combo_items TO service_role;

ALTER TABLE public.combo_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read combo_items of visible combos"
  ON public.combo_items FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (SELECT 1 FROM public.combos c WHERE c.id = combo_id AND c.is_hidden = false)
  );

CREATE POLICY "Ops read combo_items"
  ON public.combo_items FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'staff'));

CREATE POLICY "Admin write combo_items"
  ON public.combo_items FOR ALL
  TO authenticated
  USING (has_role(auth.uid(),'admin'))
  WITH CHECK (has_role(auth.uid(),'admin'));

CREATE INDEX idx_combo_items_combo ON public.combo_items(combo_id);
CREATE INDEX idx_combo_items_service ON public.combo_items(service_id);
