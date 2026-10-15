# 🌌 Nebula Drops: Fusion Core

> 🎮 Jogo WebGL / HTML5 de Puzzle Físico & Síntese de Plasma Líquido, desenvolvido sob o selo **FluidCleb Interactive** e 100% homologado para os requisitos oficiais do **CrazyGames**.

---

## 🌟 Visão Geral & Especificações Técnicas

- **Título Comercial**: Nebula Drops: Fusion Core (*Nome Inédito e Inovador*)
- **URL Pública de Entrega**: [https://nebuladropsfusioncore.kinomuse.com.br](https://nebuladropsfusioncore.kinomuse.com.br)
- **Repositório GitHub**: [https://github.com/CleberSGoncalves/NebulaDropsFusionCore](https://github.com/CleberSGoncalves/NebulaDropsFusionCore)
- **Gênero / Estilo**: Puzzle de Física (Drop & Merge / Síntese Gravitacional 2D)
- **Stack Tecnológica**: Godot Engine 4.7.2 (GDScript 2.0 `gl_compatibility`) + Vite HTML5 / Canvas 2D WebGL Pipeline
- **Resolução Lógica**: `960 x 540` (16:9 responsivo com suporte a Desktop e Mobile Touch)
- **Tamanho do Bundle Inicial**: `< 1 MB` (Qualificado para Mobile Homepage — requisito oficial ≤ 20MB)
- **Física Determinística**: `FIXED_DT = 1/60s` com sub-stepping (240Hz internos), garantindo comportamento idêntico em monitores de **60Hz, 144Hz e 165Hz**

---

## 📖 Lore & Ambientação

Em uma estação espacial abandonada na Fenda de Cygnus (**Aethelgard-09**), núcleos de energia líquida instável (**Nebula Drops**) caem continuamente na câmara de contenção magnética. O jogador deve posicionar o emissor orbital, soltar os orbes utilizando gravidade e colidir núcleos de mesmo nível para fundi-los em elementos mais densos antes que o recipiente transborde além do laser vermelho de perigo e o reator principal entre em colapso total.

---

## 🎮 Controles & Loop de Jogabilidade

### Desktop (Teclado & Mouse)
- **Mouse / A-D / Setas**: Posicionar o emissor magnético no topo da câmara
- **Clique Esquerdo / Espaço / S**: Soltar o orbe de plasma na câmara
- **F**: Disparar **Pulso Gravitacional (EMP)** para reorganizar orbes travados
- **V**: Acionar **Purga de Plasma** (vaporiza os 2 menores orbes da câmara)
- **C**: Ativar **Orbe Catalisador Universal** (funde-se com qualquer nível ao tocar)
- **R**: Reiniciar setor atual
- **P / Esc**: Pausar simulação

### Mobile / Touchscreen
- **Arrastar na Tela**: Mirar com a linha guia holográfica de trajetória
- **Soltar o Toque / Botão DROP ORB**: Lançar o orbe
- **Botões Táticos Inferiores**: Pulso Gravitacional, Purga e Catalisador (áreas de toque ≥ 48x48px)

---

## 🧩 Módulos & Features Implementadas

1. **Arquitetura Desacoplada (`EventBus.gd` / `hud.js`)**: UI 100% independente da árvore de física.
2. **Menu de Seleção de Fases com Cards Visuais e 3 Estrelas (Regra 10)**: Grade de 3 colunas com miniaturas procedurais do núcleo alvo, meta de pontos e 3 estrelas ASCII (`★ / ☆`).
3. **Game Feel & Juiciness (`JuiceCamera2D.gd`, `SquashStretch2D.gd`, `HitStopManager.gd`)**:
   - Screen Shake baseado em $\text{Trauma}^2$ com decaimento exponencial suave.
   - Deformação elástica Squash & Stretch amortecida por mola em quedas, impactos e fusões.
   - Micro-congelamento (Hit-Stop de `50ms`) ao sintetizar núcleos de nível 5+.
4. **Save Game Atômico Anti-Corrupção (`user://save_temp.json` / `storage.js`)**: Gravação verificada em slot temporário antes do commit definitivo.
5. **Vinheta Oficial FluidCleb Interactive (0.0s a 2.8s)**: Orbes cósmicos (`#00f5ff`, `#38bdf8`), fusão central, emblema da gota metálica (`#94a3b8`), tipografia neon e áudio sintético procedural, seguida pela Lore Interativa com botão **Skip Story ➔** (Land in Gameplay ≤ 1 clique).
6. **Conformidade Total CrazyGames SDK v3**:
   - `<script src="https://sdk.crazygames.com/crazygames-sdk-v3.js"></script>`
   - Ciclo `gameplayStart()`, `gameplayStop()` e `happyTime()`.
   - Mute total do Web Audio e pausa da física em `adStarted`, restaurando apenas em `adFinished` ou `adError`.
   - **Rewarded Ad 1**: Escudo de Contenção de Emergência (+30s, limpa o topo e concede 3.5s de invulnerabilidade, 1x por tentativa).
   - **Rewarded Ad 2**: Dobrar Fragmentos de Plasma (`2x Plasma Shards`) ao concluir o setor.
   - Bloqueio estrito de recompensa caso ocorra `adError` (AdBlock).
   - Sem botão customizado de Fullscreen no canvas.
