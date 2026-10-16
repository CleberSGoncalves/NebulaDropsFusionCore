# 🌌 Nebula Drops: Fusion Core — Plano de Implementação (Melhorias Extremas)

> Data: 15/10/2026
> Escopo: corrigir **menus desordenados/sobrepostos** e **fases que travam e não voltam**, além de elevar a robustez geral do jogo.

---

## 0. Contexto técnico (leitura obrigatória)

O jogo **publicado** é o build web (`index.html` + `src/*.js` via Vite). A pasta `scenes/` e `scripts/` contém um **protótipo legado em Godot/GDScript** que **não** é carregado pelo `index.html` (que só importa `./src/main.js`).

- **Código vivo (corrigir aqui):** `src/game.js`, `src/hud.js`, `src/style.css`, `src/crazygames.js`, `src/main.js`.
- **Atenção estratégica:** manter duas bases em paralelo (GDScript + JS) gera retrabalho e confusão. Recomendo (Fase 3) definir **uma única fonte de verdade** e desativar/remover a outra para evitar regressões.

---

## 1. Diagnóstico (sintoma → causa-raiz → local)

### 🔴 P1 — Fases travam e não voltam (congelamento)

**Causa-raiz 1 (crítica): a máquina de estados dos modais não restaura `isRoundOver`.**
- Ao abrir "Sector Select" **a partir do modal de Vitória ou de Game Over**, o jogo chama `openLevelSelectModal()`, que faz `onPause()` (define `isPaused=true`), mas `isRoundOver` continua `true`.
- O botão **X** do seletor (`src/hud.js`, linhas 573–577) chama `closeModal()` + `onResume()` → `onResume` (em `src/main.js`, 30–36) só zera `isPaused`/`isAdPaused`, **mas não `isRoundOver`**.
- Resultado: o loop (`src/game.js`, `_loop()` linha 533) trava a física em `!isRoundOver`, e **nenhum modal fica na tela** → tela congelada, sem botão, "não volta".

**Causa-raiz 2: ciclo de pausa/resume inconsistente entre modais.**
- `openEvolutionModal`/`openPauseModal`/`openLevelSelectModal` chamam `onPause`.
- `openVictoryModal`/`openGameOverModal` **não** chamam `onPause` (já entram com `isRoundOver=true`).
- Não existe um único "controlador de navegação" — cada modal gerencia estado à sua maneira, abrindo espaço para estados órfãos.

**Causa-raiz 3: transições via anúncio dependem de callbacks assíncronos sem garantia de "sempre restaurar".**
- `src/crazygames.js` já tem watchdogs (midgame 2.5s, rewarded 4s), mas a restauração de estado está espalhada entre `main.js`, `hud.js` e `game.js`, sem um `finally` centralizado.

---

### 🟠 P1 — Menus desordenados / sobrepostos

**Causa-raiz 1: header superior não é responsivo.**
- `.hud-top-row` usa `flex-wrap: nowrap` (`src/style.css`, 57–63) com 3 pills + 5 botões fixos. Em telas ≤ ~480px, o conteúdo **transborda horizontalmente** e sobrepõe o canvas.

**Causa-raiz 2: linha de missão aperta em telas estreitas.**
- `.hud-mission-row` (`style.css`, 81–87) mantém barra de estrelas + "goal pill" + botão "✅ CONCLUIR FASE (★) ➔" em `nowrap`, causando esmagamento/clipping no mobile.

**Causa-raiz 3: banner de perigo sobrepõe o emissor.**
- `.hud-danger-banner` é `position:absolute; top:8px` dentro do `.canvas-wrap` (`style.css`, 284–302) → em layout compacto cobre o dropper/linha de mira no topo da câmara.

**Causa-raiz 4: safe-area / notch não tratado no topo.**
- Só o rodapé tem `env(safe-area-inset-bottom)` (`style.css`, 329). No iPhone/notch o header pode ficar sob a barra do sistema.

**Causa-raiz 5: sobreposição de overlays sem escala de `z-index` única.**
- Intro (`#cinematic-overlay`) e modais usam ambos `z-index: 99999`. Não há um mapa de camadas definido.

---

## 2. Plano de implementação por fases

Prioridades: **P0** (corrige congelamento hoje) → **P1** (UI) → **P2** (robustez) → **P3** (qualidade extrema).

---

### FASE 0 — Estancar o congelamento (P0, ~1 dia)

#### 0.1 Criar um controlador único de estado/navegação
- **Arquivo novo:** `src/ui_controller.js` (ou método central em `GameHUD`) com uma **pilha de modais** (`openModal(name)`, `closeModal()`, `goBack()`).
- Garante que **fechar qualquer modal sempre restaura o estado anterior correto**, inclusive decidindo entre "voltar ao jogo" vs "voltar ao modal de vitória/game over".
- Substitui o `modalBackdrop.innerHTML = ''` ad-hoc (hoje em `hud.js`, 389–392) por uma API explícita.

#### 0.2 Corrigir a restauração de `isRoundOver`
- Em `game.js`, criar `resumeFromModal()` que, além de `isPaused=false`/`isAdPaused=false`, decide `isRoundOver`:
  - Se existe modal de vitória/game-over "por baixo", **reabre-o** em vez de voltar para um estado morto.
  - Se o jogo estava em partida normal, apenas retoma.
- Trocar o `onResume` de `main.js` (30–36) para chamar esse novo método.

#### 0.3 Botão "Sector Select" vindo de Vitória/Game Over
- Ao fechar o seletor sem escolher fase, **voltar para o modal de origem** (vitória/game over), nunca para a tela congelada.

**Critério de aceite:** em qualquer caminho (Vitória → Selecionar → X; Game Over → Selecionar → X; Pausa → Selecionar → X), o jogo **nunca** fica sem UI e sem física.

---

### FASE 1 — Redesign responsivo de menus (P1, ~2–3 dias)

#### 1.1 Header colapsável e mobile-first
- Reescrever `.hud-top-row` com **`flex-wrap: wrap`** ou, melhor, **dois agrupamentos lógicos**:
  - Grupo A (status): setor + timer + próximo orbe.
  - Grupo B (ações): mover `CHAIN`, `[::]`, `PT`, `mute`, `pause` para um **menu "hambúrguer/…"** em telas estreitas.
- Em telas < 760px, esconder botões secundários atrás de um **único botão "☰"** que abre um painel (bottom sheet).

#### 1.2 Linha de missão adaptativa
- Permitir que a barra de estrelas ocupe a largura toda; mover "goal pill + concluir fase" para uma linha própria em telas estreitas.
- Reduzir o texto do botão "✅ CONCLUIR FASE" (ex.: ícone + "CONCLUIR") com `label` curto no mobile.

#### 1.3 Reposicionar o banner de perigo
- Mover `.hud-danger-banner` para **fora do canvas** (no header ou como overlay com `pointer-events:none` em posição que não cubra o emissor), ou deslocar o topo da câmara para baixo quando o banner estiver ativo.

#### 1.4 Safe-area e viewport
- Aplicar `env(safe-area-inset-top/left/right)` no header, além do bottom.
- Usar `100dvh` (já usado) e testar em iOS Safari (notch).

#### 1.5 Escala única de camadas (`z-index`)
- Definir tokens: `--z-hud: 30`, `--z-banner: 25`, `--z-modal: 100`, `--z-intro: 90`, etc. Eliminar o `99999` mágico duplicado.

**Critério de aceite:** em 320px/360px/768px/1280px (retrato e paisagem), **nenhum elemento se sobrepõe** e todos os controles são tocáveis (área ≥ 48×48px, conforme GDD).

---

### FASE 2 — Robustez de transições e anúncios (P2, ~1–2 dias)

#### 2.1 Centralizar o fluxo de anúncio com "sempre restaura"
- Em `crazygames.js`, unificar `requestMidgameAd`/`requestRewardedAd` numa única rotina com **`try/finally`** que **sempre** chama `onAdResumeCallback` + `onComplete`/`onError` exatamente uma vez.
- Garantir que `gameplayStart()` seja reemitido após toda transição real de gameplay.

#### 2.2 Guardas anti-`NaN` e anti-explosão na física
- Em `physics.js`, validar posições/velocidades (se `!isFinite` → redefinir) e impor **limite máximo de orbes** (ex.: 128) para evitar travamento por excesso de colisões.

#### 2.3 Guardas de estado no loop
- Em `game.js` `_loop`, adicionar `Number.isFinite(rawDt)` e proteção contra `accumulator` descontrolado.

#### 2.4 Migração de save com versão
- Adicionar campo `version` no `storage.js` e migração automática para evitar dados corrompidos antigos.

**Critério de aceite:** 60 FPS estáveis por 10+ min, sem freezes ao trocar de fase com AdBlock ativo, offline, ou em host fora do CrazyGames.

---

### FASE 3 — Melhorias extremas & QA (P3, contínuo)

1. **Unificar a base de código** (remover/arquivar o protótipo GDScript ou conectá-lo de verdade) — hoje ele só gera confusão e risco de regressão.
2. **Testes de fumaça automatizados** (ex.: Playwright) cobrindo: boot → intro → skip → gameplay → vitória → next → game over → revive → seleção de fases, em 3 resoluções.
3. **Checklist cross-device** (iOS/Android/desktop, 60/144Hz) documentado no README.
4. **Métricas de performance** (FPS, memória, GC) no console de QA (`window.__nebulaEngine`).
5. **Polimento de game feel**: confirmação de saída, transições suaves entre modais, feedback tátil (vibration API) no mobile.

---

## 3. Ordem de execução recomendada

| # | Tarefa | Prioridade | Esforço |
|---|--------|-----------|---------|
| 1 | Controlador único de modais + pilha de navegação | P0 | M |
| 2 | Corrigir `isRoundOver` ao fechar seletor vindo de vitória/game over | P0 | S |
| 3 | Header responsivo + menu agrupado (hambúrguer no mobile) | P1 | M |
| 4 | Banner de perigo fora da área de jogo | P1 | S |
| 5 | Safe-area + escala de z-index | P1 | S |
| 6 | Anúncios com `finally` garantido | P2 | M |
| 7 | Guardas anti-NaN/limite de orbes | P2 | S |
| 8 | Save versionado | P2 | S |
| 9 | Unificar base GDScript/JS | P3 | L |
| 10 | Testes automatizados + QA checklist | P3 | L |

---

## 4. Como validar (aceite global)

- [ ] Nenhum caminho deixa o jogo congelado sem UI (fases "voltam" sempre).
- [ ] Menus sem sobreposição em 320px→1280px, retrato e paisagem.
- [ ] Botões ≥ 48×48px no mobile.
- [ ] Anúncios: sem recompensa em `adError`; sem freeze em AdBlock/offline/host externo.
- [ ] 60 FPS estáveis em 60/144/165Hz (física determinística preservada).

---

*Este plano foca no código que realmente roda no navegador (`src/`). A base GDScript (`scenes/` + `scripts/`) deve ser tratada na Fase 3 para não gerar duas verdades.*
