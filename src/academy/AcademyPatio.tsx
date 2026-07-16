import { useEffect, useState } from 'react'
import PatioTreino from '../../academy/PatioTreino'
import { useCultivationSync } from './useCultivationSync'

/**
 * Host wiring do Pátio de Treino dentro do RPG MATSU-RI.
 *
 * Drop-in: monte <AcademyPatio /> em qualquer ponto da UI do jogo. Ele lê o
 * personagem do gameStore, carrega o XP de Cultivo do Supabase (quando logado
 * e não-demo) e repassa cada evento de XP / conclusão de Forma às tabelas da
 * migração 003. Em modo demo/offline, cai no localStorage sem tocar a rede.
 */
export default function AcademyPatio() {
  const sync = useCultivationSync()
  const [initialXp, setInitialXp] = useState<number | undefined>(undefined)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let alive = true
    if (sync.enabled) {
      sync.loadTotalXp().then((xp) => { if (alive) { setInitialXp(xp); setReady(true) } })
    } else {
      setInitialXp(undefined) // deixa o PatioTreino usar o localStorage
      setReady(true)
    }
    return () => { alive = false }
  }, [sync])

  if (!ready) return null

  return (
    <PatioTreino
      initialXp={initialXp}
      onXpEvent={(source, amount) => { void sync.recordXp(source, amount) }}
      onFormComplete={(formId) => { void sync.recordFormCompletion(formId) }}
      onMartialReview={(termId, patch) => { void sync.recordMartialReview(termId, patch) }}
    />
  )
}
