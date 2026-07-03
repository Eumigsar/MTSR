import { useState, useEffect, useRef } from 'react'
import { useGameStore } from '../stores/gameStore'

import { CURRICULUM } from '../rpg/curriculum'
import type { Lesson, MasterAction } from '../rpg/curriculum'

// ─── Ink-brush SVG strokes for each character ────────────────────────────────
// Each character is rendered as decorative SVG paths in background
function InkBrushBg({ char }: { char: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
      <span
        style={{
          fontSize: '28vmin',
          color: 'rgba(255,200,50,0.04)',
          fontFamily: 'serif',
          lineHeight: 1,
          userSelect: 'none',
          fontWeight: 900,
          letterSpacing: 0,
        }}
      >
        {char}
      </span>
    </div>
  )
}

// ─── Master Chin SVG silhouette ───────────────────────────────────────────────
function MasterChin({ action, size = 200 }: { action: MasterAction; size?: number }) {
  const isNodding    = action === 'nod' || action === 'bow'
  const isSweeping   = action === 'sweep-arm'
  const isPointing   = action === 'point-self' || action === 'point-up'
  const isGesturing  = action === 'gesture-come'
  const isMeditating = action === 'meditate'
  const isShaking    = action === 'shake-head'

  // Body color — deep ink silhouette
  const fill = '#1a2035'
  const accent = '#c8860a'

  const w = Math.round(size * 120 / 220)
  return (
    <svg
      viewBox="0 0 120 220"
      width={w}
      height={size}
      style={{ overflow: 'visible' }}
    >
      {/* Robe / body */}
      <ellipse cx="60" cy="165" rx="32" ry="52" fill={fill} />
      {/* Head */}
      <circle
        cx="60"
        cy="62"
        r="22"
        fill={fill}
        style={
          isShaking
            ? { animation: 'chinShake 0.5s ease-in-out infinite alternate' }
            : isNodding
            ? { animation: 'chinNod 1.2s ease-in-out infinite alternate', transformOrigin: '60px 84px' }
            : undefined
        }
      />
      {/* Hair bun */}
      <ellipse
        cx="60"
        cy="42"
        rx="8"
        ry="6"
        fill={fill}
        style={isShaking ? { animation: 'chinShake 0.5s ease-in-out infinite alternate' } : undefined}
      />
      <rect cx="60" cy="38" width="4" height="10" x="58" fill={accent} rx="2" />

      {/* Left arm */}
      <path
        d={isMeditating ? 'M44 135 Q32 148 38 162' : isGesturing ? 'M44 135 Q24 120 16 108' : 'M44 135 Q28 148 30 168'}
        stroke={fill}
        strokeWidth="14"
        strokeLinecap="round"
        fill="none"
        style={isGesturing ? { animation: 'chinGesture 1.4s ease-in-out infinite alternate' } : undefined}
      />
      {/* Right arm */}
      <path
        d={
          isPointing && action === 'point-self'
            ? 'M76 135 Q92 125 98 112'
            : isPointing && action === 'point-up'
            ? 'M76 135 Q90 110 86 80'
            : isMeditating
            ? 'M76 135 Q88 148 82 162'
            : isSweeping
            ? 'M76 135 Q100 110 108 92'
            : 'M76 135 Q92 148 90 168'
        }
        stroke={fill}
        strokeWidth="14"
        strokeLinecap="round"
        fill="none"
        style={isSweeping ? { animation: 'chinSweep 1.8s ease-in-out infinite alternate' } : undefined}
      />

      {/* Sash belt */}
      <rect x="40" y="148" width="40" height="7" fill={accent} rx="3" opacity={0.9} />

      {/* Pointing hand indicator */}
      {(action === 'point-self' || action === 'point-up') && (
        <circle
          cx={action === 'point-self' ? 100 : 84}
          cy={action === 'point-self' ? 110 : 77}
          r="5"
          fill={accent}
          opacity={0.9}
          style={{ animation: 'chinPulse 1s ease-in-out infinite alternate' }}
        />
      )}

      {/* Meditate glow */}
      {isMeditating && (
        <circle cx="60" cy="62" r="28" fill="none" stroke={accent} strokeWidth="2" opacity={0.35}
          style={{ animation: 'chinGlow 2s ease-in-out infinite alternate' }} />
      )}

      <style>{`
        @keyframes chinShake {
          from { transform: translateX(-4px); }
          to   { transform: translateX(4px); }
        }
        @keyframes chinNod {
          from { transform: rotate(-6deg); }
          to   { transform: rotate(6deg); }
        }
        @keyframes chinGesture {
          from { d: path('M44 135 Q24 120 16 108'); }
          to   { d: path('M44 135 Q28 110 20 96'); }
        }
        @keyframes chinSweep {
          from { d: path('M76 135 Q100 110 108 92'); }
          to   { d: path('M76 135 Q104 118 114 102'); }
        }
        @keyframes chinPulse {
          from { opacity: 0.5; r: 4; }
          to   { opacity: 1;   r: 6; }
        }
        @keyframes chinGlow {
          from { opacity: 0.2; }
          to   { opacity: 0.5; }
        }
      `}</style>
    </svg>
  )
}

// ─── Tone badge ───────────────────────────────────────────────────────────────
const TONE_STYLE: Record<number, { border: string; glow: string; label: string }> = {
  1: { border: '#3B82F6', glow: '0 0 32px #3B82F688', label: '1° — nivelado ¯' },
  2: { border: '#00A86B', glow: '0 0 32px #00A86B88', label: '2° — ascendente /' },
  3: { border: '#9B59B6', glow: '0 0 32px #9B59B688', label: '3° — ondulante ˇ' },
  4: { border: '#AA0000', glow: '0 0 32px #AA000088', label: '4° — descendente \\' },
  5: { border: '#666',    glow: '0 0 24px #66666644', label: 'neutro' },
}

// ─── Phase: Story ─────────────────────────────────────────────────────────────
function StoryPhase({ lesson, onContinue }: { lesson: Lesson; onContinue: () => void }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { const t = setTimeout(() => setVisible(true), 120); return () => clearTimeout(t) }, [])

  const ts = TONE_STYLE[lesson.hanzi.tone]

  return (
    <div className="flex flex-col items-center px-8 py-6 gap-5" style={{ minHeight: '100%', paddingBottom: 56 }}>
      {/* Master + dialogue */}
      <div
        className="flex items-center gap-6 w-full max-w-xl flex-shrink-0"
        style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.6s ease' }}
      >
        <div className="flex-shrink-0">
          <MasterChin action={lesson.masterAction} size={155} />
        </div>
        <div
          className="relative rounded-2xl px-5 py-4 flex-1"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div
            className="absolute left-0 top-1/2 -translate-x-3 -translate-y-1/2 w-0 h-0"
            style={{ borderTop: '10px solid transparent', borderBottom: '10px solid transparent', borderRight: '12px solid rgba(255,255,255,0.05)' }}
          />
          <p className="text-white/80 text-sm leading-relaxed font-light tracking-wide">
            {lesson.storyContext}
          </p>
        </div>
      </div>

      {/* Character reveal */}
      <div
        className="flex flex-col items-center gap-3 flex-shrink-0"
        style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.8s ease 0.3s' }}
      >
        <div
          className="flex items-center justify-center rounded-2xl"
          style={{
            width: 140, height: 140,
            background: 'rgba(0,0,0,0.4)',
            border: `2px solid ${ts.border}`,
            boxShadow: ts.glow,
          }}
        >
          <span style={{ fontSize: 84, lineHeight: 1, fontFamily: 'serif', color: '#fff', textShadow: ts.glow }}>
            {lesson.hanzi.hanzi}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-amber-300 text-xl font-light tracking-widest">{lesson.hanzi.pinyin}</span>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: ts.border + '33', color: ts.border, border: `1px solid ${ts.border}55` }}
          >
            {ts.label}
          </span>
        </div>
      </div>

      {/* Continue */}
      <button
        onClick={onContinue}
        className="px-10 py-3 rounded-xl text-sm font-medium tracking-widest uppercase transition-all duration-200 flex-shrink-0"
        style={{
          background: 'rgba(200,134,10,0.15)',
          border: '1px solid rgba(200,134,10,0.5)',
          color: '#e8b84b',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.6s ease 0.6s, background 0.2s',
        }}
        onMouseEnter={e => { (e.target as HTMLButtonElement).style.background = 'rgba(200,134,10,0.3)' }}
        onMouseLeave={e => { (e.target as HTMLButtonElement).style.background = 'rgba(200,134,10,0.15)' }}
      >
        Estou pronto(a) →
      </button>
    </div>
  )
}

// ─── Phase: Challenge ─────────────────────────────────────────────────────────
function ChallengePhase({
  lesson,
  onAnswer,
}: {
  lesson: Lesson
  onAnswer: (correct: boolean, chosenIdx: number) => void
}) {
  const [chosen, setChosen] = useState<number | null>(null)
  const ts = TONE_STYLE[lesson.hanzi.tone]

  const pick = (i: number) => {
    if (chosen !== null) return
    setChosen(i)
    const correct = i === lesson.correctIndex
    setTimeout(() => onAnswer(correct, i), 900)
  }

  return (
    <div className="flex flex-col items-center px-8 py-6 gap-6" style={{ minHeight: '100%', paddingBottom: 56 }}>
      {/* Prompt */}
      <div className="text-center space-y-1">
        <p className="text-white/40 text-xs uppercase tracking-widest">Mestre Chin pergunta</p>
        <p className="text-white/85 text-base leading-snug max-w-md">{lesson.challengePrompt}</p>
      </div>

      {/* Character */}
      <div className="flex flex-col items-center gap-2">
        <div
          className="flex items-center justify-center rounded-2xl"
          style={{
            width: 140, height: 140,
            background: 'rgba(0,0,0,0.45)',
            border: `2px solid ${chosen === null ? ts.border : chosen === lesson.correctIndex ? '#00A86B' : '#AA0000'}`,
            boxShadow: chosen === null ? ts.glow : chosen === lesson.correctIndex ? '0 0 32px #00A86B88' : '0 0 32px #AA000088',
            transition: 'border-color 0.4s, box-shadow 0.4s',
          }}
        >
          <span style={{ fontSize: 84, lineHeight: 1, fontFamily: 'serif', color: '#fff' }}>
            {lesson.hanzi.hanzi}
          </span>
        </div>
        <span className="text-amber-300 text-xl tracking-widest">{lesson.hanzi.pinyin}</span>
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
        {lesson.options.map((opt, i) => {
          const isCorrect = i === lesson.correctIndex
          const isChosen  = chosen === i
          let bg = 'rgba(255,255,255,0.05)'
          let border = 'rgba(255,255,255,0.1)'
          let color = 'rgba(255,255,255,0.8)'
          if (chosen !== null) {
            if (isCorrect) { bg = 'rgba(0,168,107,0.2)'; border = '#00A86B'; color = '#00A86B' }
            else if (isChosen) { bg = 'rgba(170,0,0,0.2)'; border = '#AA0000'; color = '#AA0000' }
          }
          return (
            <button
              key={i}
              onClick={() => pick(i)}
              disabled={chosen !== null}
              className="py-4 px-5 rounded-xl text-sm font-medium transition-all duration-300 disabled:cursor-default"
              style={{ background: bg, border: `1px solid ${border}`, color }}
            >
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Phase: Result ────────────────────────────────────────────────────────────
function ResultPhase({
  lesson,
  correct,
  onNext,
}: {
  lesson: Lesson
  correct: boolean
  onNext: () => void
}) {
  const [reveal, setReveal] = useState(false)
  useEffect(() => { const t = setTimeout(() => setReveal(true), 300); return () => clearTimeout(t) }, [])
  const ts = TONE_STYLE[lesson.hanzi.tone]

  return (
    <div className="flex flex-col items-center px-8 py-5 gap-4" style={{ paddingBottom: 56 }}>
      {/* Verdict banner */}
      <div
        className="w-full max-w-md rounded-xl px-6 py-2.5 text-center text-sm font-medium tracking-widest uppercase flex-shrink-0"
        style={correct
          ? { background: 'rgba(0,168,107,0.15)', border: '1px solid #00A86B66', color: '#00A86B' }
          : { background: 'rgba(170,0,0,0.15)', border: '1px solid #AA000066', color: '#dd4444' }}
      >
        {correct ? '✓ Correto — seu espírito avança' : '✗ A mente precisa de mais treino'}
      </div>

      {/* Compact character + meaning row */}
      <div className="flex items-center gap-5 flex-shrink-0">
        <div
          className="flex items-center justify-center rounded-xl"
          style={{ width: 78, height: 78, background: 'rgba(0,0,0,0.4)', border: `2px solid ${ts.border}`, boxShadow: ts.glow, flexShrink: 0 }}
        >
          <span style={{ fontSize: 46, lineHeight: 1, fontFamily: 'serif', color: '#fff' }}>
            {lesson.hanzi.hanzi}
          </span>
        </div>
        <div>
          <p className="text-amber-300 text-xl tracking-widest">{lesson.hanzi.pinyin}</p>
          <p className="text-white font-medium text-base">{lesson.hanzi.meaning_pt}</p>
          <p className="text-white/35 text-xs mt-0.5 italic">{lesson.hanzi.hsk_level > 0 ? `HSK ${lesson.hanzi.hsk_level}` : ''}</p>
        </div>
      </div>

      {/* Decomposition */}
      <div
        className="w-full max-w-md flex-shrink-0"
        style={{ opacity: reveal ? 1 : 0, transition: 'opacity 0.7s ease' }}
      >
        <p className="text-white/25 text-xs uppercase tracking-widest mb-2">Decomposição radical</p>
        <div className="flex gap-2 flex-wrap mb-2">
          {lesson.decomposition.map((part, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-lg px-3 py-2"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <span style={{ fontSize: 24, fontFamily: 'serif', color: '#e8b84b' }}>{part.char}</span>
              <div className="text-xs">
                <p className="text-white/75">{part.meaning}</p>
                {part.note && <p className="text-white/30 mt-0.5">{part.note}</p>}
              </div>
            </div>
          ))}
        </div>
        <p className="text-white/40 text-xs leading-relaxed italic">{lesson.hanzi.etymology}</p>
      </div>

      {/* Master's insight */}
      <div
        className="w-full max-w-md rounded-xl px-5 py-3 flex-shrink-0"
        style={{
          background: 'rgba(200,134,10,0.07)',
          border: '1px solid rgba(200,134,10,0.2)',
          opacity: reveal ? 1 : 0,
          transition: 'opacity 0.7s ease 0.4s',
        }}
      >
        <p className="text-xs text-amber-500/50 uppercase tracking-widest mb-1.5">Mestre Chin diz</p>
        <p className="text-amber-100/70 text-sm leading-relaxed">{lesson.masterInsight}</p>
      </div>

      <button
        onClick={onNext}
        className="px-10 py-3 rounded-xl text-sm font-medium tracking-widest uppercase flex-shrink-0 mb-2"
        style={{
          background: 'rgba(200,134,10,0.15)',
          border: '1px solid rgba(200,134,10,0.5)',
          color: '#e8b84b',
          opacity: reveal ? 1 : 0,
          transition: 'opacity 0.6s ease 0.8s',
        }}
      >
        Próxima lição →
      </button>
    </div>
  )
}

// ─── Lesson runner ────────────────────────────────────────────────────────────
type LessonPhase = 'story' | 'challenge' | 'result'

function LessonRunner({ lesson, onComplete }: { lesson: Lesson; onComplete: () => void }) {
  const [phase, setPhase] = useState<LessonPhase>('story')
  const [wasCorrect, setWasCorrect] = useState(false)
  const submitAnswer = useGameStore((s) => s.submitAnswer)

  const handleAnswer = (correct: boolean) => {
    setWasCorrect(correct)
    submitAnswer(lesson.hanzi, correct)
    setPhase('result')
  }

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <InkBrushBg char={lesson.hanzi.hanzi} />
      <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', scrollbarWidth: 'none' }}>
        {phase === 'story'     && <StoryPhase     lesson={lesson} onContinue={() => setPhase('challenge')} />}
        {phase === 'challenge' && <ChallengePhase lesson={lesson} onAnswer={(c) => handleAnswer(c)} />}
        {phase === 'result'    && <ResultPhase    lesson={lesson} correct={wasCorrect} onNext={onComplete} />}
      </div>
    </div>
  )
}

// ─── Dojo home — lesson map ───────────────────────────────────────────────────
function DojoHome({
  currentIdx,
  masteredHanzi,
  onSelectLesson,
}: {
  currentIdx: number
  masteredHanzi: Set<string>
  onSelectLesson: (idx: number) => void
}) {
  const acts = [1, 2, 3, 4]
  return (
    <div className="flex flex-col h-full px-6 py-8 gap-6 overflow-y-auto">
      {/* Header */}
      <div className="text-center space-y-1">
        <p className="text-amber-400/60 text-xs uppercase tracking-[0.3em]">Dojo da Mestre Chin</p>
        <h1 className="text-white text-2xl font-light tracking-widest">武學漢字</h1>
        <p className="text-white/30 text-xs">A arte marcial da linguagem</p>
      </div>

      {/* Lesson tiles grouped by act */}
      <div className="space-y-6 flex-1">
        {acts.map((act) => {
          const actLessons = CURRICULUM.filter((l) => l.act === act)
          if (!actLessons.length) return null
          return (
            <div key={act}>
              <p className="text-white/20 text-xs uppercase tracking-widest mb-3">Ato {act}</p>
              <div className="grid grid-cols-5 gap-2">
                {actLessons.map((lesson) => {
                  const globalIdx = CURRICULUM.findIndex((l) => l.id === lesson.id)
                  const mastered  = masteredHanzi.has(lesson.hanzi.hanzi)
                  const active    = globalIdx === currentIdx
                  const locked    = globalIdx > currentIdx && !mastered
                  const ts        = TONE_STYLE[lesson.hanzi.tone]
                  return (
                    <button
                      key={lesson.id}
                      onClick={() => !locked && onSelectLesson(globalIdx)}
                      disabled={locked}
                      title={locked ? 'Complete a lição anterior primeiro' : lesson.hanzi.meaning_pt}
                      className="relative flex flex-col items-center justify-center rounded-xl py-3 transition-all duration-200"
                      style={{
                        background: mastered
                          ? 'rgba(0,168,107,0.15)'
                          : active
                          ? `${ts.border}22`
                          : 'rgba(255,255,255,0.04)',
                        border: mastered
                          ? '1px solid #00A86B55'
                          : active
                          ? `2px solid ${ts.border}`
                          : locked
                          ? '1px solid rgba(255,255,255,0.04)'
                          : '1px solid rgba(255,255,255,0.1)',
                        opacity: locked ? 0.3 : 1,
                        cursor: locked ? 'not-allowed' : 'pointer',
                        boxShadow: active ? ts.glow : 'none',
                      }}
                    >
                      <span style={{ fontSize: 28, fontFamily: 'serif', color: mastered ? '#00A86B' : locked ? '#555' : '#fff' }}>
                        {lesson.hanzi.hanzi}
                      </span>
                      <span className="text-xs mt-1" style={{ color: mastered ? '#00A86B88' : 'rgba(255,255,255,0.3)' }}>
                        {lesson.hanzi.pinyin}
                      </span>
                      {mastered && (
                        <span className="absolute top-1 right-1 text-xs text-green-500 opacity-70">✓</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Master Chin ambient */}
      <div className="flex items-center gap-4 px-4 py-3 rounded-xl" style={{ background: 'rgba(200,134,10,0.06)', border: '1px solid rgba(200,134,10,0.15)' }}>
        <MasterChin action="standing" size={80} />
        <div>
          <p className="text-amber-300/80 text-xs font-medium mb-1">Mestre Chin</p>
          <p className="text-white/40 text-xs leading-relaxed">
            {masteredHanzi.size === 0
              ? '"O maior palácio começa com um único tijolo. Comece pela primeira lição."'
              : masteredHanzi.size < 5
              ? `"Você já domina ${masteredHanzi.size} caractere${masteredHanzi.size > 1 ? 's' : ''}. O caminho continua."`
              : '"Seu espírito já brilha. Continue — o mandarim é um oceano sem fim."'}
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── GameScene ────────────────────────────────────────────────────────────────
export function GameScene() {
  const masteredHanzi = useGameStore((s) => s.masteredHanzi)
  const learningRecords = useGameStore((s) => s.learningRecords)

  // Find the first lesson not yet mastered
  const firstPendingIdx = CURRICULUM.findIndex(
    (l) => !masteredHanzi.has(l.hanzi.hanzi)
  )
  const currentIdx = firstPendingIdx === -1 ? CURRICULUM.length - 1 : firstPendingIdx

  const [view, setView] = useState<'home' | 'lesson'>('home')
  const [lessonIdx, setLessonIdx] = useState(currentIdx)

  // Sync when mastery changes
  const prevMastered = useRef(masteredHanzi.size)
  useEffect(() => {
    if (masteredHanzi.size !== prevMastered.current) {
      prevMastered.current = masteredHanzi.size
    }
  }, [masteredHanzi])

  const startLesson = (idx: number) => {
    setLessonIdx(idx)
    setView('lesson')
  }

  const completeLesson = () => {
    setView('home')
  }

  const lesson = CURRICULUM[lessonIdx]

  return (
    <div
      className="relative w-full h-full flex flex-col"
      style={{
        background: 'linear-gradient(160deg, #06080F 0%, #0d1220 55%, #0a0e18 100%)',
        color: '#fff',
        overflow: 'hidden',
      }}
    >
      {/* Ambient grid lines */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Ambient glow top-left */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: -80, left: -80, width: 340, height: 340,
          background: 'radial-gradient(circle, rgba(200,134,10,0.08) 0%, transparent 70%)',
        }}
      />

      {/* Top bar */}
      <div
        className="relative z-10 flex items-center justify-between px-5 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 22, fontFamily: 'serif', color: '#c8860a' }}>武</span>
          <span className="text-white/50 text-xs tracking-widest uppercase">Mestre Chin</span>
        </div>
        {view === 'lesson' && (
          <button
            onClick={() => setView('home')}
            className="text-white/30 text-xs hover:text-white/60 transition-colors"
          >
            ← Voltar ao Dojo
          </button>
        )}
        {view === 'home' && learningRecords.size > 0 && (
          <button
            onClick={() => startLesson(currentIdx)}
            className="text-xs px-4 py-1.5 rounded-lg transition-colors"
            style={{
              background: 'rgba(200,134,10,0.15)',
              border: '1px solid rgba(200,134,10,0.35)',
              color: '#e8b84b',
            }}
          >
            Continuar →
          </button>
        )}
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 min-h-0">
        {view === 'home' && (
          <DojoHome
            currentIdx={currentIdx}
            masteredHanzi={masteredHanzi}
            onSelectLesson={startLesson}
          />
        )}
        {view === 'lesson' && lesson && (
          <LessonRunner lesson={lesson} onComplete={completeLesson} />
        )}
        {view === 'lesson' && !lesson && (
          <div className="flex items-center justify-center h-full text-white/30">
            Todas as lições dominadas. Mestre Chin sorri.
          </div>
        )}
      </div>

    </div>
  )
}
