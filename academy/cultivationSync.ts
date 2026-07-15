// =====================================================================
//  Camada de sync do Cultivo — academy ⇄ Supabase (opcional)
// ---------------------------------------------------------------------
//  Traduz eventos de XP/Forma/vocabulário marcial para as tabelas da
//  migração 003 (player_xp_events, player_cultivation, ...).
//
//  Desacoplado de propósito: recebe o client por parâmetro em vez de
//  importar src/lib/supabaseClient — assim academy/ continua portátil
//  para qualquer repo. É NO-OP seguro quando não há client (modo demo)
//  ou characterId. localStorage continua sendo o fallback offline.
// =====================================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import { FOUNDATION_REALM, stageForXp } from "./cultivation";
import type { XpSource } from "./types";

/** Deriva realm_id/stage_id a partir do XP total (lógica pura, testável). */
export function cultivationRowFor(totalXp: number): { realm_id: string; stage_id: string; total_xp: number } {
  const stage = stageForXp(totalXp, FOUNDATION_REALM);
  return { realm_id: FOUNDATION_REALM.id, stage_id: stage.id, total_xp: totalXp };
}

export interface SyncResult {
  ok: boolean;
  totalXp?: number;
  error?: string;
}

export interface CultivationSync {
  readonly enabled: boolean;
  loadTotalXp(): Promise<number>;
  recordXp(source: XpSource, amount: number, note?: string): Promise<SyncResult>;
  recordFormCompletion(formId: string): Promise<SyncResult>;
  recordMartialReview(termId: string, patch: MartialReviewPatch): Promise<SyncResult>;
}

export interface MartialReviewPatch {
  box: number;
  streak: number;
  correct: boolean;
  nextReviewAt: string; // ISO
}

/**
 * Cria a camada de sync. Passe `null` como client (ou omita characterId)
 * para obter uma instância desabilitada que não toca a rede — todos os
 * métodos resolvem sem erro e o app segue no localStorage.
 */
export function createCultivationSync(
  supabase: SupabaseClient | null,
  characterId: string | null | undefined,
): CultivationSync {
  const enabled = !!supabase && !!characterId;

  const disabled = (): SyncResult => ({ ok: false, error: "sync desabilitado (sem supabase/characterId)" });

  return {
    enabled,

    async loadTotalXp(): Promise<number> {
      if (!enabled) return 0;
      const { data, error } = await supabase!
        .from("player_cultivation")
        .select("total_xp")
        .eq("character_id", characterId)
        .maybeSingle();
      if (error || !data) return 0;
      return data.total_xp ?? 0;
    },

    async recordXp(source: XpSource, amount: number, note?: string): Promise<SyncResult> {
      if (!enabled) return disabled();
      try {
        // 1) log append-only (fonte da verdade)
        const insErr = (await supabase!.from("player_xp_events").insert({
          character_id: characterId,
          source,
          amount,
          note: note ?? null,
        })).error;
        if (insErr) return { ok: false, error: insErr.message };

        // 2) recomputa total e faz upsert do estado de Cultivo
        const { data: sum, error: sumErr } = await supabase!
          .from("player_xp_events")
          .select("amount")
          .eq("character_id", characterId);
        if (sumErr) return { ok: false, error: sumErr.message };
        const total = (sum ?? []).reduce((s: number, r: { amount: number }) => s + (r.amount || 0), 0);

        const row = cultivationRowFor(total);
        const upErr = (await supabase!.from("player_cultivation").upsert(
          { character_id: characterId, ...row, updated_at: new Date().toISOString() },
          { onConflict: "character_id" },
        )).error;
        if (upErr) return { ok: false, error: upErr.message };

        return { ok: true, totalXp: total };
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : String(e) };
      }
    },

    async recordFormCompletion(formId: string): Promise<SyncResult> {
      if (!enabled) return disabled();
      try {
        // lê a contagem atual e incrementa (upsert manual para evitar RPC)
        const { data: cur } = await supabase!
          .from("player_form_progress")
          .select("completions")
          .eq("character_id", characterId)
          .eq("form_id", formId)
          .maybeSingle();
        const completions = (cur?.completions ?? 0) + 1;
        const upErr = (await supabase!.from("player_form_progress").upsert(
          {
            character_id: characterId,
            form_id: formId,
            completions,
            last_completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "character_id,form_id" },
        )).error;
        return upErr ? { ok: false, error: upErr.message } : { ok: true };
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : String(e) };
      }
    },

    async recordMartialReview(termId: string, patch: MartialReviewPatch): Promise<SyncResult> {
      if (!enabled) return disabled();
      try {
        const { data: cur } = await supabase!
          .from("player_martial_vocab")
          .select("correct_count, incorrect_count")
          .eq("character_id", characterId)
          .eq("term_id", termId)
          .maybeSingle();
        const correct_count = (cur?.correct_count ?? 0) + (patch.correct ? 1 : 0);
        const incorrect_count = (cur?.incorrect_count ?? 0) + (patch.correct ? 0 : 1);
        const upErr = (await supabase!.from("player_martial_vocab").upsert(
          {
            character_id: characterId,
            term_id: termId,
            box: patch.box,
            streak: patch.streak,
            correct_count,
            incorrect_count,
            last_reviewed_at: new Date().toISOString(),
            next_review_at: patch.nextReviewAt,
          },
          { onConflict: "character_id,term_id" },
        )).error;
        return upErr ? { ok: false, error: upErr.message } : { ok: true };
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : String(e) };
      }
    },
  };
}
