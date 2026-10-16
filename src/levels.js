/**
 * @fileoverview Orb Tiers & 20 Progressive Handcrafted Sectors for Nebula Drops: Fusion Core
 * Balanced for intuitive, crystal-clear Suika-style Drop & Merge progression:
 * - 20 Handcrafted progressive sectors (Default, Cyber Void, and Zen Crystal themes)
 * - Explicit 1-Star (star1Score), 2-Star (star2Score), and 3-Star (star3Score) thresholds
 * - Synthesizing the Sector's Target Core (targetTier) awards an instant Target Bonus and completes the sector!
 * - Reaching 1-Star (star1Score) unlocks the "COMPLETE SECTOR" button (or players can keep merging for 2★ and 3★!)
 */

export const ORB_TIERS = [
  {
    tier: 1,
    symbol: 'H+',
    radius: 20,
    mass: 1.0,
    points: 15,
    color: '#00f5ff',
    coreColor: '#e0f2fe',
    glowColor: 'rgba(0, 245, 255, 0.55)',
    ringColor: '#38bdf8'
  },
  {
    tier: 2,
    symbol: 'He',
    radius: 27,
    mass: 1.5,
    points: 35,
    color: '#38bdf8',
    coreColor: '#bae6fd',
    glowColor: 'rgba(56, 189, 248, 0.55)',
    ringColor: '#0284c7'
  },
  {
    tier: 3,
    symbol: 'Li',
    radius: 35,
    mass: 2.2,
    points: 80,
    color: '#22c55e',
    coreColor: '#dcfce7',
    glowColor: 'rgba(34, 197, 94, 0.55)',
    ringColor: '#16a34a'
  },
  {
    tier: 4,
    symbol: 'Be',
    radius: 44,
    mass: 3.2,
    points: 180,
    color: '#eab308',
    coreColor: '#fef9c3',
    glowColor: 'rgba(234, 179, 8, 0.55)',
    ringColor: '#ca8a04'
  },
  {
    tier: 5,
    symbol: 'B',
    radius: 54,
    mass: 4.5,
    points: 380,
    color: '#f97316',
    coreColor: '#ffedd5',
    glowColor: 'rgba(249, 115, 22, 0.6)',
    ringColor: '#ea580c'
  },
  {
    tier: 6,
    symbol: 'C',
    radius: 64,
    mass: 6.2,
    points: 750,
    color: '#ef4444',
    coreColor: '#fee2e2',
    glowColor: 'rgba(239, 68, 68, 0.6)',
    ringColor: '#dc2626'
  },
  {
    tier: 7,
    symbol: 'N',
    radius: 75,
    mass: 8.5,
    points: 1500,
    color: '#a855f7',
    coreColor: '#f3e8ff',
    glowColor: 'rgba(168, 85, 247, 0.65)',
    ringColor: '#9333ea'
  },
  {
    tier: 8,
    symbol: 'O',
    radius: 86,
    mass: 11.5,
    points: 3000,
    color: '#ec4899',
    coreColor: '#fce7f3',
    glowColor: 'rgba(236, 72, 153, 0.65)',
    ringColor: '#db2777'
  },
  {
    tier: 9,
    symbol: 'Ne',
    radius: 98,
    mass: 15.0,
    points: 6000,
    color: '#6366f1',
    coreColor: '#e0e7ff',
    glowColor: 'rgba(99, 102, 241, 0.7)',
    ringColor: '#4f46e5'
  },
  {
    tier: 10,
    symbol: 'Ar',
    radius: 112,
    mass: 20.0,
    points: 12000,
    color: '#14b8a6',
    coreColor: '#ccfbf1',
    glowColor: 'rgba(20, 184, 166, 0.75)',
    ringColor: '#0d9488'
  },
  {
    tier: 11,
    symbol: 'Ω',
    radius: 128,
    mass: 27.0,
    points: 28000,
    color: '#facc15',
    coreColor: '#ffffff',
    glowColor: 'rgba(250, 204, 21, 0.85)',
    ringColor: '#00f5ff'
  }
];

export const SECTORS = [
  {
    id: 1,
    nameEn: 'Ignition Chamber',
    namePt: 'Câmara de Ignição',
    targetScore: 150,
    star1Score: 150,
    star2Score: 260,
    star3Score: 400,
    targetTier: 3,
    timeLimit: 150,
    gravity: 700,
    restitution: 0.32,
    theme: 'default',
    shardReward: 30,
    initialOrbs: [
      { tier: 1, xOffset: -45 },
      { tier: 2, xOffset: 45 }
    ]
  },
  {
    id: 2,
    nameEn: 'Ion Conduit',
    namePt: 'Conduto de Íons',
    targetScore: 320,
    star1Score: 320,
    star2Score: 520,
    star3Score: 780,
    targetTier: 4,
    timeLimit: 150,
    gravity: 700,
    restitution: 0.34,
    theme: 'default',
    shardReward: 40,
    initialOrbs: [
      { tier: 2, xOffset: -55 },
      { tier: 2, xOffset: 55 }
    ]
  },
  {
    id: 3,
    nameEn: 'Aurora Collector',
    namePt: 'Coletor Aurora',
    targetScore: 550,
    star1Score: 550,
    star2Score: 850,
    star3Score: 1200,
    targetTier: 4,
    timeLimit: 150,
    gravity: 720,
    restitution: 0.35,
    theme: 'cyber_void',
    shardReward: 50,
    initialOrbs: [
      { tier: 2, xOffset: -65 },
      { tier: 3, xOffset: 0 },
      { tier: 2, xOffset: 65 }
    ]
  },
  {
    id: 4,
    nameEn: 'Stabilizer Silo',
    namePt: 'Silo Estabilizador',
    targetScore: 900,
    star1Score: 900,
    star2Score: 1350,
    star3Score: 1850,
    targetTier: 5,
    timeLimit: 160,
    gravity: 720,
    restitution: 0.35,
    theme: 'default',
    shardReward: 65,
    initialOrbs: [
      { tier: 3, xOffset: -60 },
      { tier: 3, xOffset: 60 }
    ]
  },
  {
    id: 5,
    nameEn: 'Tachyon Reservoir',
    namePt: 'Reservatório Táquion',
    targetScore: 1300,
    star1Score: 1300,
    star2Score: 1900,
    star3Score: 2600,
    targetTier: 5,
    timeLimit: 160,
    gravity: 730,
    restitution: 0.35,
    theme: 'cyber_void',
    shardReward: 80,
    initialOrbs: [
      { tier: 3, xOffset: -70 },
      { tier: 4, xOffset: 0 },
      { tier: 3, xOffset: 70 }
    ]
  },
  {
    id: 6,
    nameEn: 'Supernova Bay',
    namePt: 'Baía Supernova',
    targetScore: 1900,
    star1Score: 1900,
    star2Score: 2700,
    star3Score: 3600,
    targetTier: 6,
    timeLimit: 170,
    gravity: 740,
    restitution: 0.35,
    theme: 'zen_crystal',
    shardReward: 100,
    initialOrbs: [
      { tier: 4, xOffset: -65 },
      { tier: 4, xOffset: 65 }
    ]
  },
  {
    id: 7,
    nameEn: 'Quantum Well',
    namePt: 'Poço Quântico',
    targetScore: 2700,
    star1Score: 2700,
    star2Score: 3800,
    star3Score: 5000,
    targetTier: 6,
    timeLimit: 175,
    gravity: 750,
    restitution: 0.36,
    theme: 'default',
    shardReward: 120,
    initialOrbs: [
      { tier: 4, xOffset: -75 },
      { tier: 5, xOffset: 0 },
      { tier: 4, xOffset: 75 }
    ]
  },
  {
    id: 8,
    nameEn: 'Antimatter Vault',
    namePt: 'Cofre de Antimatéria',
    targetScore: 3800,
    star1Score: 3800,
    star2Score: 5200,
    star3Score: 6800,
    targetTier: 7,
    timeLimit: 180,
    gravity: 750,
    restitution: 0.36,
    theme: 'cyber_void',
    shardReward: 150,
    initialOrbs: [
      { tier: 5, xOffset: -70 },
      { tier: 5, xOffset: 70 }
    ]
  },
  {
    id: 9,
    nameEn: 'Hypergravity Core',
    namePt: 'Núcleo Hipergravidade',
    targetScore: 5400,
    star1Score: 5400,
    star2Score: 7400,
    star3Score: 9600,
    targetTier: 8,
    timeLimit: 190,
    gravity: 770,
    restitution: 0.34,
    theme: 'default',
    shardReward: 180,
    initialOrbs: [
      { tier: 5, xOffset: -75 },
      { tier: 6, xOffset: 75 }
    ]
  },
  {
    id: 10,
    nameEn: 'Dark Energy Matrix',
    namePt: 'Matriz Energia Escura',
    targetScore: 7500,
    star1Score: 7500,
    star2Score: 10500,
    star3Score: 14000,
    targetTier: 9,
    timeLimit: 200,
    gravity: 760,
    restitution: 0.36,
    theme: 'cyber_void',
    shardReward: 220,
    initialOrbs: [
      { tier: 6, xOffset: -75 },
      { tier: 6, xOffset: 75 }
    ]
  },
  {
    id: 11,
    nameEn: 'Pulsar Dynamo',
    namePt: 'Dínamo Pulsar',
    targetScore: 11000,
    star1Score: 11000,
    star2Score: 15500,
    star3Score: 20500,
    targetTier: 10,
    timeLimit: 210,
    gravity: 750,
    restitution: 0.36,
    theme: 'zen_crystal',
    shardReward: 300,
    initialOrbs: [
      { tier: 6, xOffset: -80 },
      { tier: 7, xOffset: 0 },
      { tier: 6, xOffset: 80 }
    ]
  },
  {
    id: 12,
    nameEn: 'Omega Nebula Apex',
    namePt: 'Ápice Ômega Nebula',
    targetScore: 18000,
    star1Score: 18000,
    star2Score: 25000,
    star3Score: 34000,
    targetTier: 11,
    timeLimit: 240,
    gravity: 740,
    restitution: 0.36,
    theme: 'cyber_void',
    shardReward: 600,
    initialOrbs: [
      { tier: 7, xOffset: -80 },
      { tier: 7, xOffset: 80 }
    ]
  },
  {
    id: 13,
    nameEn: 'Prismatic Apex',
    namePt: 'Ápice Prismático',
    targetScore: 22000,
    star1Score: 22000,
    star2Score: 30000,
    star3Score: 40000,
    targetTier: 7,
    timeLimit: 220,
    gravity: 730,
    restitution: 0.36,
    theme: 'zen_crystal',
    shardReward: 400,
    initialOrbs: [
      { tier: 5, xOffset: -60 },
      { tier: 5, xOffset: 60 }
    ]
  },
  {
    id: 14,
    nameEn: 'Vortex Rift',
    namePt: 'Fenda de Vórtice',
    targetScore: 26000,
    star1Score: 26000,
    star2Score: 35000,
    star3Score: 48000,
    targetTier: 8,
    timeLimit: 230,
    gravity: 750,
    restitution: 0.36,
    theme: 'cyber_void',
    shardReward: 450,
    initialOrbs: [
      { tier: 6, xOffset: -70 },
      { tier: 6, xOffset: 70 }
    ]
  },
  {
    id: 15,
    nameEn: 'Cryo Reactor Core',
    namePt: 'Reator Crio-Zero',
    targetScore: 31000,
    star1Score: 31000,
    star2Score: 42000,
    star3Score: 56000,
    targetTier: 8,
    timeLimit: 240,
    gravity: 710,
    restitution: 0.35,
    theme: 'zen_crystal',
    shardReward: 500,
    initialOrbs: [
      { tier: 5, xOffset: -75 },
      { tier: 6, xOffset: 0 },
      { tier: 5, xOffset: 75 }
    ]
  },
  {
    id: 16,
    nameEn: 'Singularity Forge',
    namePt: 'Forja de Singularidades',
    targetScore: 37000,
    star1Score: 37000,
    star2Score: 50000,
    star3Score: 66000,
    targetTier: 9,
    timeLimit: 250,
    gravity: 760,
    restitution: 0.36,
    theme: 'cyber_void',
    shardReward: 550,
    initialOrbs: [
      { tier: 6, xOffset: -75 },
      { tier: 7, xOffset: 75 }
    ]
  },
  {
    id: 17,
    nameEn: 'Magnetic Storm Chamber',
    namePt: 'Câmara Tempestade Magnética',
    targetScore: 44000,
    star1Score: 44000,
    star2Score: 59000,
    star3Score: 78000,
    targetTier: 9,
    timeLimit: 260,
    gravity: 770,
    restitution: 0.36,
    theme: 'default',
    shardReward: 600,
    initialOrbs: [
      { tier: 6, xOffset: -80 },
      { tier: 7, xOffset: 0 },
      { tier: 6, xOffset: 80 }
    ]
  },
  {
    id: 18,
    nameEn: 'Cosmic Labyrinth',
    namePt: 'Labirinto Cósmico',
    targetScore: 52000,
    star1Score: 52000,
    star2Score: 70000,
    star3Score: 92000,
    targetTier: 10,
    timeLimit: 270,
    gravity: 740,
    restitution: 0.36,
    theme: 'zen_crystal',
    shardReward: 700,
    initialOrbs: [
      { tier: 7, xOffset: -75 },
      { tier: 7, xOffset: 75 }
    ]
  },
  {
    id: 19,
    nameEn: 'Event Horizon Nexus',
    namePt: 'Nexus Horizonte de Eventos',
    targetScore: 62000,
    star1Score: 62000,
    star2Score: 82000,
    star3Score: 110000,
    targetTier: 10,
    timeLimit: 280,
    gravity: 780,
    restitution: 0.36,
    theme: 'cyber_void',
    shardReward: 800,
    initialOrbs: [
      { tier: 7, xOffset: -80 },
      { tier: 8, xOffset: 0 },
      { tier: 7, xOffset: 80 }
    ]
  },
  {
    id: 20,
    nameEn: 'Supreme Stellar Collapse',
    namePt: 'Colapso Estelar Supremo',
    targetScore: 75000,
    star1Score: 75000,
    star2Score: 100000,
    star3Score: 140000,
    targetTier: 11,
    timeLimit: 300,
    gravity: 790,
    restitution: 0.36,
    theme: 'cyber_void',
    shardReward: 1000,
    initialOrbs: [
      { tier: 8, xOffset: -85 },
      { tier: 8, xOffset: 85 }
    ]
  }
];
