# 🚀 Nebula Drops: Fusion Core — 10 Melhorias para Sucesso no CrazyGames

> Priorizadas por impacto em **retenção (vício)**, **progressão** e **monetização** — os 3 pilares que decidem destaque no CrazyGames. Cada item indica **onde mexer no código atual**.

---

## 1. 🗓️ Menu principal inovador + Desafio Diário (Daily Seed)
**O que é:** um menu inicial real (não só a seleção de fases) com um card em destaque **"Desafio de Hoje"**: uma fase com **seed determinística** (gerada pelo hash da data), **1 tentativa por dia**, recompensa de Fragmentos escalonada pela sequência (streak).
**Por que funciona:** o motivo nº 1 de "voltar amanhã" no mobile. Gera hábito diário e vira a entrada principal do jogo.
**Como implementar:**
- `src/levels.js`: função `generateDailySector(dateString)` que produz parâmetros (targetTier, timeLimit, gravity, initialOrbs) a partir de um hash simples e determinístico.
- `src/storage.js`: campos `dailyDate`, `dailyDone`, `dailyStreak`, `lastDailyReward`.
- Novo modal/menu em `src/hud.js` (`openMainMenuModal`) com o card diário, streak visual (🔥 xN) e botão "JOGAR HOJE".
- Reset de streak se perder um dia (com 1 dia de graça para não punir demais).
**Métrica:** % de jogadores que retornam no D1/D7 (retention).

---

## 2. ⚙️ Meta-progressão: melhorias permanentes do Reator (sink de Fragmentos)
**O que é:** usar os **Plasma Shards** (hoje só acumulam) para comprar **upgrades permanentes**: +1 Pulso, +1 Purga, +15s de tempo, começar com tier 2, escudo com cooldown menor, etc.
**Por que funciona:** dá **propósito** aos Fragmentos e "mais uma partida para juntar 5 shards".
**Como implementar:**
- `src/storage.js`: `upgrades: { pulse: 0, vent: 0, timeBonus: 0, catalyst: 0, startTier: 0 }` + `buyUpgrade()`.
- `src/game.js` `loadSector()`: aplicar `pulseUses = 2 + upgrades.pulse`, `timeRemaining += upgrades.timeBonus * 5`, etc.
- Novo painel "Upgrades" no menu (com preços em shards).
**Métrica:** % de jogadores que gastam shards; sessões por usuário.

---

## 3. 🧗 20 fases com dificuldade "passável" (curva de aprendizado justa)
**O que é:** expandir de 12 para **20 setores**, mas retunar para que cada fase seja **resolvível** (orbs iniciais garantem o caminho até o Núcleo Alvo) e o salto de dificuldade seja **suave e legível**.
**Por que funciona:** jogador frustrado abandona; jogador que sente progresso continua. Fases "possíveis mas desafiadoras" são o coração do Suika-like.
**Como implementar:**
- `src/levels.js`: adicionar 8 setores (tiers 6–11), com `initialOrbs` planejados para **sempre** permitir fusão até o alvo sem depender de sorte; ajustar `gravity`/`restitution`/`timeLimit` com progressão logarítmica.
- Validar programaticamente que `initialOrbs` + drop mínimo atingem `targetTier` (teste de "resolubilidade").
**Métrica:** % de conclusão da fase; drop-off por fase (identificar picos de dificuldade).

---

## 4. 🎯 Missões & Conquistas (Quests diárias/semanais)
**O que é:** tarefas como "funda 10 He", "alcance ★★★ no setor 5", "sobreviva 3 min no infinito" recompensando shards.
**Por que funciona:** dá **objetivos de curto prazo** dentro de cada sessão (vício de "só mais uma missão").
**Como implementar:**
- `src/storage.js`: `quests: { daily: [...], weekly: [...], lastReset }`.
- `src/game.js` `_handleFusion`/`_triggerVictory`: disparar contadores de missão (fusion por tier, estrelas, tempo).
- Painel no menu + toast de "Missão concluída! +X ♦".
**Métrica:** missões completadas/dia; tempo médio de sessão.

---

## 5. 🔥 Streak diário & bônus de retorno (loop de recompensa)
**O que é:** recompensa crescente por **dias consecutivos** jogando (dias 1–7 com prêmios que sobem até um "catalisador grátis" no dia 7).
**Por que funciona:** mecanismo clássico de vício; dá razão concreta para voltar.
**Como implementar:** combinado com o item 1 (`dailyStreak`); tela de "Recompensa de Retorno" no boot do menu.
**Métrica:** retention D7; taxa de streak mantido.

---

## 6. ♾️ Modo Infinito com Leaderboard global (SDK CrazyGames)
**O que é:** além do infinito atual, submeter a pontuação a um **leaderboard global** do CrazyGames e mostrar "Você está entre os top X%".
**Por que funciona:** competição social é um dos maiores motores de retenção no portal.
**Como implementar:**
- `src/crazygames.js`: usar `sdk.game.leaderboard` (ou `sdk.user`) para enviar highscore no game over do infinito.
- Tabela "TOP 10" no menu do infinito (com fallback offline).
**Métrica:** nº de envios de score; retenção dos que veem o ranking.

---

## 7. 💰 Monetização inteligente (rewarded ads no loop certo, nunca intrusivo)
**O que é:** manter os 2 rewarded atuais e adicionar **1 "continuar" no infinito** e **"dobrar recompensa da missão"**, sempre com recusa visível e **nunca** midgame durante gameplay ativa.
**Por que funciona:** CrazyGames premia jogos que monetizam sem quebrar o fluxo; rewarded bem posicionado tem alta conversão.
**Como implementar:** reutilizar `crazyGames.requestRewardedAd` já existente; adicionar callbacks nos novos pontos de oferta.
**Métrica:** fill rate / eCPM; conversão de rewarded; sem queda de D0 por ads intrusivos.

---

## 8. 🎓 Onboarding contextual (ensina sem tutorial chato)
**O que é:** nas 2 primeiras fases, dicas inline ("junte 2 iguais", "F = Pulso", "fundir o alvo = ★★★") que **desaparecem** após o jogador executar a ação.
**Por que funciona:** CrazyGames exige "land in gameplay ≤ 1 clique", então o tutorial precisa ser **embutido**, não uma tela separada.
**Como implementar:**
- `src/game.js`: rastrear "primeira fusão", "primeiro pulso" etc. e exibir dicas via `hud` (banner não intrusivo).
- Reaproveitar o painel de telemetria/evolução para o guia.
**Métrica:** conclusão da fase 1 no 1º dia; % que usa habilidades táticas.

---

## 9. 🎨 Skins/temas de orbe (colecionáveis por Fragmentos)
**O que é:** temas visuais dos orbes (neon, magma, aurora, cristal) comprados com shards, mudando cores/partículas (sem afetar gameplay).
**Por que funciona:** colecionismo + personalização = vício e diferenciação visual.
**Como implementar:**
- `src/levels.js`: paleta de temas mapeando tier → cores.
- `src/storage.js`: `equippedTheme` + `ownedThemes`.
- `src/game.js` `_renderOrb`/`_renderPreviewOrb`: aplicar o tema equipado.
**Métrica:** nº de temas comprados/usuário.

---

## 10. 💥 Juice & feedback reforçado (cada fusão tem que ser satisfatória)
**O que é:** amplificar hit-stop, screen shake, partículas, texto flutuante, flash de cor e **som por camada** em fusões altas (tier 5+), além de um "happy time" mais festivo ao vencer.
**Por que funciona:** game feel é o que separa "jogo fraco" de "jogo que vicia" — a satisfação de cada merge é o loop central.
**Como implementar:**
- `src/physics.js`: mais partículas/escala de shockwave por tier; `CameraShaker` com resposta mais viva.
- `src/game.js` `_handleFusion`: combo FX, screen flash sutil, e chamada `crazyGames.happyTime()` em tier 8+.
- `src/audio.js`: camada de sub-bass em fusões tier 6+.
**Métrica:** duração média de sessão; nº de fusões por sessão.

---

## 📌 Resumo do plano de ataque (ordem)
| Ordem | Melhoria | Alavanca |
|---|---|---|
| 1 | Menu + Desafio Diário | Retenção (hábito) |
| 2 | Meta-progressão (shards) | Progressão/sentido |
| 3 | 20 fases passáveis | Retenção (justiça) |
| 4 | Missões/Quests | Objetivos curtos |
| 5 | Streak diário | Vício |
| 6 | Leaderboard infinito | Competição |
| 7 | Monetização rewarded | Receita |
| 8 | Onboarding embutido | Conversão |
| 9 | Skins de orbe | Colecionismo |
| 10 | Juice reforçado | Satisfação |

> As melhorias 1, 2 e 3 são as de **maior impacto imediato** e usam estruturas já existentes (`levels.js`, `storage.js`, `hud.js`), então são rápidas de implementar sem risco.
