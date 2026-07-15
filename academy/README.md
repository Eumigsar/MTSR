# Academia Matsuri (蔡李佛学院) — módulos de conteúdo/lógica · MVP-1

Bancos de dados e lógica **portáteis** para a Academia de Mandarim + Choy Lay Fut.
Tudo aqui é **tecnologia gratuita** e **agnóstico de renderizador**: importável
tanto pela academia 2D single-file (`../mandarim-dojo.tsx`) quanto por uma futura
camada 3D Babylon.js. Zero backend obrigatório; persistência opcional via
`localStorage` (padrão) ou callback para Supabase/Pocketbase.

## Conteúdo

| Arquivo | O quê | Tipo |
|---|---|---|
| `types.ts` | Contratos de tipo compartilhados | tipos |
| `martialVocab.ts` | Banco marcial de vocabulário (25 termos: posturas, golpes, corpo, virtude, comandos, números) | dados |
| `forms.ts` | Forma 梅花拳 (Mei Hua Quan) como sequência de 12 movimentos jogáveis | dados |
| `cultivation.ts` | Sistema de Cultivo — Reino 1 (筑基 Fundação), 5 estágios, curva de XP | dados + lógica pura |
| `sifuEngine.ts` | Sifu virtual híbrido: diálogo roteirizado + regras de tom/gramática (sem GPT pago) | lógica pura |
| `PatioTreino.tsx` | Pátio de Treino jogável (React, identidade preto/dourado/vinho) | UI |
| `index.ts` | Reexporta tudo | barrel |

## Uso rápido

```tsx
import PatioTreino from "./academy/PatioTreino";

// Padrão: persiste XP em localStorage.
<PatioTreino />

// Plugando persistência externa (Supabase/Pocketbase) sem tocar no componente:
<PatioTreino initialXp={xpDoBanco} onXpChange={(xp) => salvarNoSupabase(xp)} />
```

Ou consumindo só os dados/lógica em outro renderizador:

```ts
import { MEI_HUA_QUAN, stageForXp, checkTone } from "./academy";

const estagio = stageForXp(640);          // → 固元 (Firmar a Essência)
const veredito = checkTone(3, 2);         // Sifu corrige tom 3 vs tom 2
MEI_HUA_QUAN.moves.forEach(m => render(m)); // sequência da Forma
```

## Limites conhecidos (ver `../PENDENTE-AMANDA.md`)

- `MEI_HUA_QUAN.choreographyVerified === false` — coreografia aguarda playtest
  da Amanda (praticante de Choy Lay Fut). Ajuste é de **dados**, não de código.
- As falas do Sifu são roteirizadas por regras; naturalidade em Mandarim
  precisa de revisão humana.

## Verificação

- `academy/*.ts` passam `tsc --strict` com 0 erros.
- `academy/*.tsx` passam bundle `esbuild` (tipos de `react` exigem
  `npm install` — ainda não instalado neste clone).
- Lógica coberta por 21 testes funcionais (Cultivo, Forma, Sifu, vocab).
