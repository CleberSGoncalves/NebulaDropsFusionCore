# 🎮 GDD — Nebula Drops: Fusion Core

**Nome Comercial**: Nebula Drops: Fusion Core (Inédito e Inovador)  
**Gênero / Estilo**: Puzzle de Física  
**Plataforma Alvo**: CrazyGames (HTML5 / WebGL)  
**URL de Entrega / Produção**: [https://nebuladropsfusioncore.kinomuse.com.br](https://nebuladropsfusioncore.kinomuse.com.br)  
**Stack Tecnológica**: Godot Engine 4.7.2 (GDScript 2.0)  
**Data de Concepção**: 15/10/2026 17:38  
**Arquiteta Mestre de Criação**: Esmeralda (GLX Agent)  

---

## 🌟 1. Identidade de Marca & Introdução Obrigatória
1. **Intro FluidCleb Interactive (0.0s a 2.8s)**:
   - Splash Screen procedural obrigatória em Canvas idêntica aos títulos de referência (*Sobrevivente da Névoa* e *Hydrologic*).
   - Orbes de energia azul subindo (`#00f5ff`, `#38bdf8`, `#0284c7`), fusão central com áudio sintético procedural (`playFluidClebIntro()`), emblema da gota d'água metálica (`#94a3b8` / `#0284c7`), logo em neon `FLUIDCLEB` (38px) e subtítulo `INTERACTIVE` (13px), com barra de progresso suave.
2. **Apresentação em Animação Realista (Intro Narrativa / Lore Interativa)**:
   - Exibida imediatamente após a Splash Screen da FluidCleb.
   - Animação cinematográfica procedural em Canvas com partículas volumétricas, feixes de luz e transição dramática que narra os 3 atos da Lore em até 5 segundos com botões 'Continuar ➔' e 'Pular História'.

---

## 📖 2. Lore, Ambientação & Premissa
Em uma estação espacial abandonada, núcleos de energia líquida instável precisam ser fundidos antes que o reator principal entre em colapso total.

---

## ⚡ 3. Core Gameplay Loop & Controles
1. Posicionar o orbe no topo da área de jogo. 2. Soltar utilizando gravidade e simulação física 2D. 3. Colidir orbes de mesmo nível para fundi-los em um nível superior. 4. Evitar que o recipiente transborde além da linha de perigo. 5. Alcançar a pontuação ou fusão alvo antes do tempo esgotar.

---

## 🧩 4. Módulos & Features Aprovados para o Jogo
- **Arquitetura Desacoplada EventBus.gd (UI independente)**
- **Menu de Seleção de Fases com Cards Visuais e 3 Estrelas (Regra 10)**
- **Game Feel: Screen Shake com Trauma² e Squash & Stretch**
- **Conformidade CrazyGames SDK v3 (gameplay_start, stop e happy_time)**
- **Save Game Atômico Anti-Corrupção (user://save_temp.json)**
- **Injeção de Módulo: JuiceCamera2D.gd**
- **Injeção de Módulo: HitStopManager.gd**
- **Injeção de Módulo: SquashStretch2D.gd**
- **Injeção de Módulo: EventBus.gd**

---

## 💰 5. Estratégia de Monetização e Requisitos Oficiais CrazyGames
Rewarded Ad 1: Continuar partida (+30 segundos ou reviver com escudo). Rewarded Ad 2: Dobrar moedas ou recursos coletados ao concluir fase.

### Requisitos Obrigatórios de Publicação CrazyGames (Docs Oficiais):
1. **Gameplay (Land in Gameplay & Física)**:
   - O jogador deve cair na ação em no máximo 1 clique (Play / Pular História direto na partida).
   - Física e movimentação com `deltaTime` (fixed timestep) consistente em 60Hz, 144Hz e 165Hz.
   - Proibido qualquer botão customizado de Fullscreen dentro do canvas (CrazyGames já fornece nativamente).
   - Localização em Inglês (EN) por padrão, com seletor/detecção PT-BR. PEGI 12.
2. **Técnico (Tamanho & Caminhos)**:
   - Bundle inicial ≤ 50MB (≤ 20MB para qualificar para mobile), total ≤ 250MB, máximo 1500 arquivos.
   - Caminhos estritamente relativos no build (`base: './'`), tempo de carga ≤ 20s.
3. **Anúncios & SDK v3 (CrazyGames Ads)**:
   - Chamadas de ciclo `gameplayStart()` e `gameplayStop()`.
   - Mute de áudio e pausa de jogo obrigatórios durante anúncios (`adStarted` -> mudo/pausa; `adFinished`/`adError` -> desmuta/retoma).
   - Rewarded Ads com ícone de vídeo, botão de recusar com mesma visibilidade; se der `adError` (AdBlock), NUNCA premiar.
   - Nunca disparar Midgame Ads durante gameplay ativa.

---

## 🛡️ 6. Protocolo de Validação de Qualidade por 2 Subagentes (QA)
- **Subagente 1 (Mecânica & Fluidez)**: Validação de 60 FPS constantes, física sem travamentos, movimentação precisa, colisão e conformidade com monitores de alta taxa de quadros (144Hz/165Hz).
- **Subagente 2 (Jogabilidade & CrazyGames SDK)**: Validação de interface/HUD responsiva sem sobreposição, efeitos visuais nítidos, localização em inglês e conformidade total com os requisitos oficiais do CrazyGames SDK v3 (mute em ads, pause, land in gameplay).
