import { X } from 'lucide-react'
import { Suspense, lazy, useState } from 'react'
import { useGameStore } from '../stores/gameStore'
import AcademyPatio from '../academy/AcademyPatio'

// Babylon é pesado — carrega a cena 3D só quando a aba é aberta.
const GameCanvas = lazy(() => import('../../game/GameCanvas'))

/**
 * Painel 武 Academia. Duas abas:
 *  · 练武场 2D — Pátio de Treino (Forma + Deck Marcial + Cultivo), ligado ao Supabase.
 *  · 演武场 3D — cena Babylon com os 6 mestres procedurais interativos.
 */
export function AcademyPanel() {
  const setPanel = useGameStore((s) => s.setPanel)
  const [view, setView] = useState<'2d' | '3d'>('2d')

  const tab = (active: boolean) =>
    `px-3 py-1 rounded-full text-[11px] font-bold tracking-wide border transition-colors ${
      active ? 'bg-matsuri-imperial border-matsuri-gold text-matsuri-gold' : 'bg-transparent border-white/15 text-matsuri-paper/60 hover:border-matsuri-imperial'
    }`

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      <div className="absolute inset-0 bg-matsuri-ink/80 backdrop-blur-sm" onClick={() => setPanel(null)} />

      <div className="relative z-10 flex items-center justify-between px-4 py-2 bg-matsuri-ink text-matsuri-paper pointer-events-auto">
        <p className="font-display text-sm tracking-widest">武 · ACADEMIA</p>
        <div className="flex items-center gap-2">
          <button className={tab(view === '2d')} onClick={() => setView('2d')}>练武场 2D</button>
          <button className={tab(view === '3d')} onClick={() => setView('3d')}>演武场 3D</button>
          <button onClick={() => setPanel(null)} className="ml-1 opacity-50 hover:opacity-100 transition-opacity" title="Fechar">
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="relative z-10 flex-1 overflow-hidden pointer-events-auto">
        {view === '2d' && (
          <div className="h-full overflow-y-auto">
            <AcademyPatio />
          </div>
        )}
        {view === '3d' && (
          <Suspense fallback={<div className="h-full flex items-center justify-center text-matsuri-paper/50 text-sm">Carregando o pátio 3D…</div>}>
            <GameCanvas />
          </Suspense>
        )}
      </div>
    </div>
  )
}
