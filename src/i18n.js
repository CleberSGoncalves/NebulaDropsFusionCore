/**
 * @fileoverview Internationalization (i18n) Module for Nebula Drops: Fusion Core
 * Defaults to English ('en') per CrazyGames global requirement, with automatic
 * detection and instant switching for Portuguese ('pt').
 */

export const TRANSLATIONS = {
  en: {
    gameTitle: 'NEBULA DROPS: FUSION CORE',
    subtitle: 'ORBITAL REACTOR CONTAINMENT PUZZLE',
    skipStory: 'SKIP STORY ➔',
    continueBtn: 'CONTINUE ➔',
    startGame: 'ENTER REACTOR ➔',

    // Lore Acts
    loreAct1Title: 'ACT I — ABANDONED STATION AETHELGARD-09',
    loreAct1Text: 'Deep in the Cygnus Rift, the orbital station Aethelgard-09 lies adrift. Its crew evacuated hours ago, leaving the central Fusion Core on the brink of catastrophic collapse.',
    loreAct2Title: 'ACT II — UNSTABLE LIQUID PLASMA',
    loreAct2Text: 'Volatile Nebula Drops are pouring into the magnetic containment vessel. If the plasma orbs overflow past the critical red laser threshold, the reactor will detonate.',
    loreAct3Title: 'ACT III — SYNTHESIZE THE FUSION CORE',
    loreAct3Text: 'Collide identical plasma drops to fuse them into denser, higher-tier nuclei. Reach the target fusion state and stabilize all 12 Reactor Sectors before time runs out!',

    // HUD & Gameplay
    sector: 'SECTOR',
    endlessMode: 'ENDLESS CORE',
    score: 'SCORE',
    target: 'TARGET',
    best: 'BEST',
    nextOrb: 'NEXT',
    time: 'TIME',
    targetTier: 'TARGET CORE',
    dangerWarning: 'WARNING: CONTAINMENT OVERFLOW!',
    shieldActive: 'CONTAINMENT SHIELD ACTIVE',
    combo: 'FUSION COMBO',
    dropHintDesktop: 'MOVE: Mouse / A-D / Arrows  •  DROP: Click / Space  •  TOOLS: [F] Pulse  [V] Vent  [C] Catalyst',
    dropHintMobile: 'DRAG to aim  •  RELEASE or TAP DROP to launch plasma orb',

    // Tactical Abilities
    btnDrop: 'DROP ORB',
    btnPulse: 'GRAV PULSE [F]',
    btnVent: 'VENT SMALL [V]',
    btnCatalyst: 'CATALYST [C]',
    ready: 'READY',
    usesLeft: 'LEFT',

    // Modals
    pausedTitle: 'SIMULATION PAUSED',
    resumeBtn: 'RESUME REACTOR',
    restartBtn: 'RESTART SECTOR [R]',
    levelSelectBtn: 'SECTOR SELECT',
    endlessBtn: 'ENDLESS MELTDOWN MODE',
    muteAudio: 'AUDIO: ON',
    unmuteAudio: 'AUDIO: MUTED',

    // Level Select (Rule 10 Visual Cards)
    selectSectorTitle: 'SELECT REACTOR SECTOR',
    selectSectorSub: 'Synthesize target plasma cores and earn 3 Stars to unlock deeper containment chambers.',
    launchSector: 'LAUNCH',
    lockedSector: 'LOCKED',
    goalScore: 'Quota',
    goalTier: 'Synthesize',

    // Victory Modal
    victoryTitle: 'SECTOR STABILIZED!',
    victorySub: 'Containment pressure normalized. Core synthesis target achieved.',
    shardsEarned: 'Plasma Shards Earned',
    doubleRewardBtn: '[VIDEO] 2X PLASMA SHARDS & BONUS',
    rewardClaimed: '2X BONUS CLAIMED!',
    nextSectorBtn: 'NEXT SECTOR ➔',

    // Game Over Modal
    meltdownTitle: 'REACTOR MELTDOWN!',
    meltdownOverflow: 'Liquid plasma overflowed the magnetic containment barrier!',
    meltdownTimeout: 'Critical time limit expired before core stabilization!',
    reviveBtn: '[VIDEO] EMERGENCY SHIELD (+30s & CLEAR TOP)',
    retryBtn: 'RETRY SECTOR',
    adErrorMsg: 'Ad could not be loaded (AdBlock or network). Reward not granted.',

    // Orb Tier Names
    tiers: [
      'Micro Plasma Spark',
      'Helium Ion Core',
      'Aurora Flux Drop',
      'Solar Flare Pearl',
      'Tachyon Pulse Sphere',
      'Nova Blaze Core',
      'Quantum Void Drop',
      'Antimatter Singularity',
      'Dark Energy Matrix',
      'Pulsar Radiant Engine',
      'Nebula Fusion Core'
    ],

    // Evolution Wheel
    evolutionChain: 'FUSION EVOLUTION CHAIN'
  },

  pt: {
    gameTitle: 'NEBULA DROPS: FUSION CORE',
    subtitle: 'PUZZLE FÍSICO DE CONFINAMENTO NUCLEAR',
    skipStory: 'PULAR HISTÓRIA ➔',
    continueBtn: 'CONTINUAR ➔',
    startGame: 'ENTRAR NO REATOR ➔',

    // Lore Acts
    loreAct1Title: 'ATO I — ESTAÇÃO ABANDONADA AETHELGARD-09',
    loreAct1Text: 'Nas profundezas da Fenda de Cygnus, a estação orbital Aethelgard-09 vaga à deriva. A tripulação evacuou, deixando o Núcleo de Fusão à beira do colapso total.',
    loreAct2Title: 'ATO II — PLASMA LÍQUIDO INSTÁVEL',
    loreAct2Text: 'Núcleos de energia líquida caem na câmara de contenção magnética. Se os orbes transbordarem além do laser vermelho de perigo, o reator entrará em colapso.',
    loreAct3Title: 'ATO III — SINTETIZE O NÚCLEO SUPREMO',
    loreAct3Text: 'Colida orbes de mesmo nível para fundi-los em núcleos superiores. Alcance a meta de fusão e estabilize os 12 Setores do Reator antes que o tempo esgote!',

    // HUD & Gameplay
    sector: 'SETOR',
    endlessMode: 'MODO INFINITO',
    score: 'PONTOS',
    target: 'META',
    best: 'RECORDE',
    nextOrb: 'PRÓXIMO',
    time: 'TEMPO',
    targetTier: 'NÚCLEO ALVO',
    dangerWarning: 'PERIGO: TRANSBORDAMENTO CRÍTICO!',
    shieldActive: 'ESCUDO DE CONTENÇÃO ATIVO',
    combo: 'COMBO DE FUSÃO',
    dropHintDesktop: 'MOVER: Mouse / A-D / Setas  •  SOLTAR: Clique / Espaço  •  HABILIDADES: [F] Pulso  [V] Purgar  [C] Catalisador',
    dropHintMobile: 'ARRASTE para mirar  •  SOLTE ou TOQUE EM SOLTAR para lançar o orbe',

    // Tactical Abilities
    btnDrop: 'SOLTAR ORBE',
    btnPulse: 'PULSO GRAV [F]',
    btnVent: 'PURGAR [V]',
    btnCatalyst: 'CATALISADOR [C]',
    ready: 'PRONTO',
    usesLeft: 'RESTAM',

    // Modals
    pausedTitle: 'SIMULAÇÃO PAUSADA',
    resumeBtn: 'RETOMAR REATOR',
    restartBtn: 'REINICIAR SETOR [R]',
    levelSelectBtn: 'SELEÇÃO DE FASES',
    endlessBtn: 'MODO FUSÃO INFINITA',
    muteAudio: 'SOM: LIGADO',
    unmuteAudio: 'SOM: MUDO',

    // Level Select
    selectSectorTitle: 'SELECIONE O SETOR DO REATOR',
    selectSectorSub: 'Funda os núcleos de plasma alvo e conquiste 3 Estrelas para desbloquear novas câmaras.',
    launchSector: 'INICIAR',
    lockedSector: 'BLOQUEADO',
    goalScore: 'Meta',
    goalTier: 'Fundir',

    // Victory Modal
    victoryTitle: 'SETOR ESTABILIZADO!',
    victorySub: 'Pressão de contenção normalizada. Síntese energética concluída.',
    shardsEarned: 'Fragmentos de Plasma Obtidos',
    doubleRewardBtn: '[VÍDEO] 2X FRAGMENTOS & BÔNUS',
    rewardClaimed: 'BÔNUS 2X RESGATADO!',
    nextSectorBtn: 'PRÓXIMO SETOR ➔',

    // Game Over Modal
    meltdownTitle: 'COLAPSO DO REATOR!',
    meltdownOverflow: 'O plasma líquido transbordou a barreira de contenção magnética!',
    meltdownTimeout: 'O tempo crítico esgotou antes da estabilização do núcleo!',
    reviveBtn: '[VÍDEO] ESCUDO DE EMERGÊNCIA (+30s & LIMPAR TOPO)',
    retryBtn: 'TENTAR NOVAMENTE',
    adErrorMsg: 'Anúncio bloqueado ou indisponível (AdBlock). Recompensa não concedida.',

    // Orb Tier Names
    tiers: [
      'Centelha de Micro-Plasma',
      'Núcleo de Íon Hélio',
      'Gota de Fluxo Aurora',
      'Pérola Solar',
      'Esfera de Pulso Táquion',
      'Núcleo Supernova',
      'Gota do Vazio Quântico',
      'Singularidade Antimatéria',
      'Matriz de Energia Escura',
      'Motor Radiante Pulsar',
      'Núcleo de Fusão Nebula'
    ],

    // Evolution Wheel
    evolutionChain: 'CADEIA DE EVOLUÇÃO DE FUSÃO'
  }
};

class I18nManager {
  constructor() {
    // CrazyGames requires English by default, with optional locale detection
    this.lang = 'en';
    try {
      const savedLang = localStorage.getItem('nebula_drops_lang');
      if (savedLang === 'en' || savedLang === 'pt') {
        this.lang = savedLang;
      }
    } catch (_) {
      this.lang = 'en';
    }
    this.listeners = [];
  }

  t(key) {
    const dict = TRANSLATIONS[this.lang] || TRANSLATIONS.en;
    return dict[key] !== undefined ? dict[key] : (TRANSLATIONS.en[key] || key);
  }

  getTierName(tierIndex1Based) {
    const dict = TRANSLATIONS[this.lang] || TRANSLATIONS.en;
    const idx = Math.max(0, Math.min(dict.tiers.length - 1, tierIndex1Based - 1));
    return dict.tiers[idx];
  }

  setLang(newLang) {
    if (newLang !== 'en' && newLang !== 'pt') return;
    this.lang = newLang;
    try {
      localStorage.setItem('nebula_drops_lang', newLang);
    } catch (_) {}
    this.listeners.forEach((cb) => cb(this.lang));
  }

  toggleLang() {
    this.setLang(this.lang === 'en' ? 'pt' : 'en');
    return this.lang;
  }

  onChange(cb) {
    this.listeners.push(cb);
  }
}

export const i18n = new I18nManager();
