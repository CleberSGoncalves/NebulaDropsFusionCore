/**
 * @fileoverview Orb Tiers & 12 Reactor Sectors Configuration for Nebula Drops: Fusion Core
 */

export const ORB_TIERS = [
  {
    tier: 1,
    symbol: 'H+',
    radius: 21,
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
    radius: 28,
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
    radius: 36,
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
    radius: 45,
    mass: 3.2,
    points: 160,
    color: '#eab308',
    coreColor: '#fef9c3',
    glowColor: 'rgba(234, 179, 8, 0.55)',
    ringColor: '#ca8a04'
  },
  {
    tier: 5,
    symbol: 'B',
    radius: 55,
    mass: 4.5,
    points: 320,
    color: '#f97316',
    coreColor: '#ffedd5',
    glowColor: 'rgba(249, 115, 22, 0.6)',
    ringColor: '#ea580c'
  },
  {
    tier: 6,
    symbol: 'C',
    radius: 65,
    mass: 6.2,
    points: 640,
    color: '#ef4444',
    coreColor: '#fee2e2',
    glowColor: 'rgba(239, 68, 68, 0.6)',
    ringColor: '#dc2626'
  },
  {
    tier: 7,
    symbol: 'N',
    radius: 76,
    mass: 8.5,
    points: 1280,
    color: '#a855f7',
    coreColor: '#f3e8ff',
    glowColor: 'rgba(168, 85, 247, 0.65)',
    ringColor: '#9333ea'
  },
  {
    tier: 8,
    symbol: 'O',
    radius: 88,
    mass: 11.5,
    points: 2560,
    color: '#ec4899',
    coreColor: '#fce7f3',
    glowColor: 'rgba(236, 72, 153, 0.65)',
    ringColor: '#db2777'
  },
  {
    tier: 9,
    symbol: 'Ne',
    radius: 101,
    mass: 15.0,
    points: 5120,
    color: '#6366f1',
    coreColor: '#e0e7ff',
    glowColor: 'rgba(99, 102, 241, 0.7)',
    ringColor: '#4f46e5'
  },
  {
    tier: 10,
    symbol: 'Ar',
    radius: 115,
    mass: 20.0,
    points: 10240,
    color: '#14b8a6',
    coreColor: '#ccfbf1',
    glowColor: 'rgba(20, 184, 166, 0.75)',
    ringColor: '#0d9488'
  },
  {
    tier: 11,
    symbol: 'Ω',
    radius: 130,
    mass: 28.0,
    points: 25000,
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
    targetScore: 300,
    targetTier: 4, // Solar Flare Pearl (Be)
    timeLimit: 120,
    gravity: 680,
    restitution: 0.35,
    initialOrbs: [
      { tier: 1, xOffset: -70 },
      { tier: 2, xOffset: 0 },
      { tier: 2, xOffset: 65 }
    ],
    star2Score: 450,
    star3Score: 650,
    shardReward: 25
  },
  {
    id: 2,
    nameEn: 'Ion Conduit',
    namePt: 'Conduto de Íons',
    targetScore: 650,
    targetTier: 5, // Tachyon Pulse Sphere (B)
    timeLimit: 120,
    gravity: 700,
    restitution: 0.38,
    initialOrbs: [
      { tier: 2, xOffset: -80 },
      { tier: 3, xOffset: 0 },
      { tier: 3, xOffset: 75 }
    ],
    star2Score: 900,
    star3Score: 1200,
    shardReward: 35
  },
  {
    id: 3,
    nameEn: 'Aurora Collector',
    namePt: 'Coletor Aurora',
    targetScore: 1100,
    targetTier: 5,
    timeLimit: 115,
    gravity: 720,
    restitution: 0.4,
    initialOrbs: [
      { tier: 1, xOffset: -95 },
      { tier: 3, xOffset: -30 },
      { tier: 2, xOffset: 40 },
      { tier: 3, xOffset: 95 }
    ],
    star2Score: 1500,
    star3Score: 2000,
    shardReward: 45
  },
  {
    id: 4,
    nameEn: 'Low-G Centrifuge',
    namePt: 'Centrífuga Baixa-G',
    targetScore: 1600,
    targetTier: 6, // Nova Blaze Core (C)
    timeLimit: 130,
    gravity: 520,
    restitution: 0.48,
    initialOrbs: [
      { tier: 3, xOffset: -75 },
      { tier: 4, xOffset: 0 },
      { tier: 4, xOffset: 80 }
    ],
    star2Score: 2100,
    star3Score: 2700,
    shardReward: 60
  },
  {
    id: 5,
    nameEn: 'Tachyon Reservoir',
    namePt: 'Reservatório Táquion',
    targetScore: 2200,
    targetTier: 6,
    timeLimit: 125,
    gravity: 740,
    restitution: 0.36,
    initialOrbs: [
      { tier: 2, xOffset: -100 },
      { tier: 4, xOffset: -35 },
      { tier: 3, xOffset: 35 },
      { tier: 4, xOffset: 100 }
    ],
    star2Score: 2900,
    star3Score: 3600,
    shardReward: 75
  },
  {
    id: 6,
    nameEn: 'Supernova Silo',
    namePt: 'Silo Supernova',
    targetScore: 3200,
    targetTier: 7, // Quantum Void Drop (N)
    timeLimit: 135,
    gravity: 750,
    restitution: 0.38,
    initialOrbs: [
      { tier: 4, xOffset: -85 },
      { tier: 5, xOffset: 0 },
      { tier: 5, xOffset: 85 }
    ],
    star2Score: 4200,
    star3Score: 5200,
    shardReward: 95
  },
  {
    id: 7,
    nameEn: 'Quantum Well',
    namePt: 'Poço Quântico',
    targetScore: 4500,
    targetTier: 7,
    timeLimit: 130,
    gravity: 780,
    restitution: 0.42,
    initialOrbs: [
      { tier: 3, xOffset: -100 },
      { tier: 5, xOffset: -30 },
      { tier: 4, xOffset: 40 },
      { tier: 5, xOffset: 100 }
    ],
    star2Score: 5800,
    star3Score: 7200,
    shardReward: 115
  },
  {
    id: 8,
    nameEn: 'Antimatter Vault',
    namePt: 'Cofre de Antimatéria',
    targetScore: 6500,
    targetTier: 8, // Antimatter Singularity (O)
    timeLimit: 145,
    gravity: 760,
    restitution: 0.4,
    initialOrbs: [
      { tier: 5, xOffset: -90 },
      { tier: 6, xOffset: 0 },
      { tier: 6, xOffset: 90 }
    ],
    star2Score: 8000,
    star3Score: 10000,
    shardReward: 140
  },
  {
    id: 9,
    nameEn: 'Hypergravity Core',
    namePt: 'Núcleo Hipergravidade',
    targetScore: 8500,
    targetTier: 8,
    timeLimit: 140,
    gravity: 920,
    restitution: 0.3,
    initialOrbs: [
      { tier: 4, xOffset: -100 },
      { tier: 6, xOffset: -25 },
      { tier: 5, xOffset: 45 },
      { tier: 6, xOffset: 105 }
    ],
    star2Score: 10500,
    star3Score: 13000,
    shardReward: 170
  },
  {
    id: 10,
    nameEn: 'Dark Energy Matrix',
    namePt: 'Matriz Energia Escura',
    targetScore: 12000,
    targetTier: 9, // Dark Energy Matrix (Ne)
    timeLimit: 155,
    gravity: 760,
    restitution: 0.38,
    initialOrbs: [
      { tier: 6, xOffset: -95 },
      { tier: 7, xOffset: 0 },
      { tier: 7, xOffset: 95 }
    ],
    star2Score: 15000,
    star3Score: 18500,
    shardReward: 210
  },
  {
    id: 11,
    nameEn: 'Pulsar Dynamo',
    namePt: 'Dínamo Pulsar',
    targetScore: 20000,
    targetTier: 10, // Pulsar Radiant Engine (Ar)
    timeLimit: 170,
    gravity: 740,
    restitution: 0.38,
    initialOrbs: [
      { tier: 7, xOffset: -95 },
      { tier: 8, xOffset: 0 },
      { tier: 8, xOffset: 95 }
    ],
    star2Score: 25000,
    star3Score: 31000,
    shardReward: 280
  },
  {
    id: 12,
    nameEn: 'Omega Nebula Apex',
    namePt: 'Ápice Ômega Nebula',
    targetScore: 40000,
    targetTier: 11, // Nebula Fusion Core (Omega)
    timeLimit: 190,
    gravity: 720,
    restitution: 0.38,
    initialOrbs: [
      { tier: 8, xOffset: -100 },
      { tier: 9, xOffset: 0 },
      { tier: 9, xOffset: 100 }
    ],
    star2Score: 50000,
    star3Score: 65000,
    shardReward: 500
  }
];
