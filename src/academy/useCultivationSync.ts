import { useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useGameStore } from '../stores/gameStore'
import { createCultivationSync, type CultivationSync } from '../../academy/cultivationSync'

// Mesma convenção do gameStore: contas demo não persistem no Supabase.
const isDemo = (id: string) => id.startsWith('demo-')

/**
 * Liga a camada de sync do Cultivo ao personagem atual do gameStore.
 * Retorna um sync DESABILITADO (no-op, segue no localStorage) quando não há
 * personagem, quando é conta demo, ou quando o Supabase não está configurado.
 */
export function useCultivationSync(): CultivationSync {
  const character = useGameStore((s) => s.character)
  const characterId = character && !isDemo(character.id) ? character.id : null
  return useMemo(() => createCultivationSync(supabase, characterId), [characterId])
}
