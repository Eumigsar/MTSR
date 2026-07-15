import { X } from 'lucide-react'
import { useGameStore } from '../stores/gameStore'
import AcademyPatio from '../academy/AcademyPatio'

/**
 * Painel 武 Academia — Pátio de Treino (Forma 梅花拳 + Cultivo) em tela cheia
 * sobre o mundo. Mesmo padrão de overlay dos outros painéis do HUD; o
 * conteúdo é o AcademyPatio já ligado ao gameStore + Supabase.
 */
export function AcademyPanel() {
  const setPanel = useGameStore((s) => s.setPanel)

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      <div className="absolute inset-0 bg-matsuri-ink/80 backdrop-blur-sm" onClick={() => setPanel(null)} />

      <div className="relative z-10 flex items-center justify-between px-4 py-2 bg-matsuri-ink text-matsuri-paper pointer-events-auto">
        <p className="font-display text-sm tracking-widest">武 · ACADEMIA — PÁTIO DE TREINO</p>
        <button onClick={() => setPanel(null)} className="opacity-50 hover:opacity-100 transition-opacity" title="Fechar">
          <X size={18} />
        </button>
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto pointer-events-auto">
        <AcademyPatio />
      </div>
    </div>
  )
}
