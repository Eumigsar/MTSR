# PENDENTE — Amanda (Camada 3)

> Itens que **só a Amanda** pode decidir/fazer. O Claude Code **não** tenta
> resolver nenhum deles sozinho. Cada item tem um estado e o que destrava.

_Última atualização: 2026-07-15 · sessão MVP-1 (Academia Matsuri / Mandarim Dojo)._

---

## 🔴 Bloqueios de credencial / conta

- [ ] **Contas reais** (GitHub / Supabase / Pocketbase). Precisa das suas
      credenciais. O schema de migração já pode ser preparado localmente
      (Camada 1), mas nada sobe ao ar sem você.
- [ ] **Chaves de API** (mesmo tier gratuito). Nenhuma chave foi gerada ou
      solicitada. Se o Sifu virtual algum dia usar TTS/STT além da Web Speech
      API do navegador, a decisão e a chave são suas.

## 🔴 Validação subjetiva (ninguém além de você pode fazer)

- [ ] **Fidelidade coreográfica da Forma 梅花拳 (Mei Hua Quan).**
      Implementei uma **primeira passada plausível de 12 movimentos** em
      `academy/forms.ts`, marcada com `choreographyVerified: false`.
      Preciso que você pratique/leia a sequência e diga onde ela desvia do
      Choy Lay Fut real (蔡李佛) — ordem, nomes dos movimentos, respiração
      (吸/呼), transições de postura. É um ajuste de **dados**, não de código.
- [ ] **Naturalidade do Sifu em Mandarim.** As falas roteirizadas em
      `academy/sifuEngine.ts` (PRAISE / ENCOURAGE / correções de tom) precisam
      soar naturais para um mestre real. Aponte o que soa robótico ou errado.

## 🔴 Áudio / pronúncia

- [ ] **Gravar suas amostras de pronúncia**, se decidirmos usar áudio próprio
      em vez da Web Speech API pura. Só você pode gravar sua voz.

## 🔴 Publicação / dinheiro

- [ ] **Domínio público e visibilidade** (privado vs publicado). Decisão sua.
- [ ] **Qualquer gasto**, mesmo pequeno (domínio, upgrade de plano). Nada foi
      comprado nem sugerido comprar.

---

## Contexto que o Claude Code precisa de VOCÊ (não é bloqueio de código, é de fato)

> Estes não são "decisões", são **fatos que faltam no repositório desta sessão**.
> Ver as perguntas de despacho (Camada 2) no resumo da sessão.

- [ ] O doc **`arquitetura-academia-kungfu.md`** (16 seções) **não existe neste
      repositório** (`eumigsar/mtsr`). Trabalhei a partir do que descreveu no
      chat. **Onde vive o projeto canônico?** (o MVP-1 foi feito como módulos
      portáteis `academy/*` que se plugam em qualquer renderizador.)

- [ ] **Smoke test da camada 3D (`/game`).** Criei o scaffold Babylon +
      `CharacterFactory` (6 mestres procedurais), mas **este ambiente não tem
      `node_modules`/navegador**, então NÃO consegui verificar contra a API real
      do Babylon nem renderizar a cena. Rode localmente para validar:
      `npm install && npm run dev` e monte `<GameCanvas />`. (Não precisa das
      suas credenciais — é só uma limitação do ambiente desta sessão. Detalhes
      em `game/README.md`.)
