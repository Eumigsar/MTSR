-- =====================================================================
--  Academia Matsuri — Cultivo (修炼), XP e progresso marcial · v0.3
-- ---------------------------------------------------------------------
--  Espelha os módulos de conteúdo em academy/* (fonte da verdade do
--  CONTEÚDO: vocabulário, Formas, Reinos). Este schema guarda só o
--  PROGRESSO POR JOGADOR. Tecnologia gratuita (Supabase free tier).
--
--  ⚠️ Camada 1: arquivo de migração preparado localmente. NÃO foi
--  aplicado a nenhum projeto remoto. Para aplicar: cole no Editor SQL
--  do painel Supabase, ou `supabase db push` com o projeto linkado.
-- =====================================================================

-- ── Estado de Cultivo (1 linha por personagem) ──────────────────────
-- realm_id / stage_id referenciam os ids de academy/cultivation.ts
-- (ex.: realm 'foundation', stage 'f1'..'f5'). Mantidos como text para
-- não acoplar o banco à tabela de conteúdo (que vive no TS).
CREATE TABLE IF NOT EXISTS public.player_cultivation (
  character_id uuid PRIMARY KEY REFERENCES public.characters(id) ON DELETE CASCADE,
  total_xp     integer     NOT NULL DEFAULT 0,
  realm_id     text        NOT NULL DEFAULT 'foundation',
  stage_id     text        NOT NULL DEFAULT 'f1',
  updated_at   timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.player_cultivation ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cultivation_own" ON public.player_cultivation;
CREATE POLICY "cultivation_own" ON public.player_cultivation
  FOR ALL USING (character_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid()));

-- ── Log append-only de XP (fonte da verdade do total) ───────────────
-- source ∈ {vocab, forma, treino_fisico, streak, sifu} (ver XP_TABLE).
CREATE TABLE IF NOT EXISTS public.player_xp_events (
  id           uuid        DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  character_id uuid        NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  source       text        NOT NULL,
  amount       integer     NOT NULL,
  note         text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT xp_source_valid CHECK (source IN ('vocab','forma','treino_fisico','streak','sifu'))
);
CREATE INDEX IF NOT EXISTS idx_xp_events_char ON public.player_xp_events (character_id, created_at DESC);
ALTER TABLE public.player_xp_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "xp_events_own" ON public.player_xp_events;
CREATE POLICY "xp_events_own" ON public.player_xp_events
  FOR ALL USING (character_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid()));

-- ── Progresso por Forma (Taolu) ─────────────────────────────────────
-- form_id referencia academy/forms.ts (ex.: 'meihuaquan').
CREATE TABLE IF NOT EXISTS public.player_form_progress (
  id                uuid        DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  character_id      uuid        NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  form_id           text        NOT NULL,
  completions       integer     NOT NULL DEFAULT 0,
  last_completed_at timestamptz,
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (character_id, form_id)
);
ALTER TABLE public.player_form_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "form_progress_own" ON public.player_form_progress;
CREATE POLICY "form_progress_own" ON public.player_form_progress
  FOR ALL USING (character_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid()));

-- ── SRS do vocabulário marcial (paralelo a player_learning_stats) ───
-- term_id referencia academy/martialVocab.ts (ex.: 'mabu', 'quan').
-- Separado de player_learning_stats (que é keyed por hanzi HSK) para não
-- misturar o deck marcial com o deck geral.
CREATE TABLE IF NOT EXISTS public.player_martial_vocab (
  id               uuid        DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  character_id     uuid        NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  term_id          text        NOT NULL,
  box              integer     NOT NULL DEFAULT 0,
  streak           integer     NOT NULL DEFAULT 0,
  correct_count    integer     NOT NULL DEFAULT 0,
  incorrect_count  integer     NOT NULL DEFAULT 0,
  last_reviewed_at timestamptz,
  next_review_at   timestamptz,
  UNIQUE (character_id, term_id)
);
CREATE INDEX IF NOT EXISTS idx_martial_vocab_due ON public.player_martial_vocab (character_id, next_review_at);
ALTER TABLE public.player_martial_vocab ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "martial_vocab_own" ON public.player_martial_vocab;
CREATE POLICY "martial_vocab_own" ON public.player_martial_vocab
  FOR ALL USING (character_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid()));

-- ── Conveniência: recomputar total de XP a partir do log ────────────
-- Opcional. O app pode chamar para reconciliar player_cultivation.total_xp
-- com a soma real dos eventos (fonte da verdade = player_xp_events).
CREATE OR REPLACE FUNCTION public.recompute_cultivation_xp(p_character_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_total integer;
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO v_total
    FROM public.player_xp_events
   WHERE character_id = p_character_id;

  INSERT INTO public.player_cultivation (character_id, total_xp, updated_at)
       VALUES (p_character_id, v_total, now())
  ON CONFLICT (character_id)
  DO UPDATE SET total_xp = EXCLUDED.total_xp, updated_at = now();

  RETURN v_total;
END;
$$;
