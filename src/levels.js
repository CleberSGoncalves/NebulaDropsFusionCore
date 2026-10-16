/**
 * @fileoverview Orb Tiers & 12 Reactor Sectors Configuration for Nebula Drops: Fusion Core
 * Balanced for satisfying Suika-style Drop & Merge progression:
 * - Chambers start clean/uncluttered with grounded starter orbs
 * - Transparent scoring and attainable tier targets
 */

export const ORB_TIERS = [
  {
    tier: 1,
    symbol: 'H+',
    radius: 20,
    mass: 1.0,
    points: 10,
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
    points: 25,
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
    points: 60,
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
    points: 130,
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
    points: 280,
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
    points: 580,
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
    points: 1200,
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
    points: 2400,
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
    points: 4800,
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
    points: 9600,
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
    points: 24000,
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
    targetScore: 250,
    targetTier: 4, // Be (Solar Flare Pearl)
    timeLimit: 140,
    gravity: 700,
    restitution: 0.32,
    initialOrbs: [
      { tier: 1, xOffset: -50 },
      { tier: 1, xOffset: 50 }
    ],
    star2Score: 380,
    star3Score: 550,
    shardReward: 30
  },
  {
    id: 2,
    nameEn: 'Ion Conduit',
    namePt: 'Conduto de Íons',
    targetScore: 500,
    targetTier: 4,
    timeLimit: 140,
    gravity: 700,
    restitution: 0.34,
    initialOrbs: [
      { tier: 1, xOffset: -60 },
      { tier: 2, xOffset: 0 },
      { tier: 1, xOffset: 60 }
    ],
    star2Score: 750,
    star3Score: 1000,
    shardReward: 40
  },
  {
    id: 3,
    nameEn: 'Aurora Collector',
    namePt: 'Coletor Aurora',
    targetScore: 900,
    targetTier: 5, // B (Tachyon Pulse Sphere)
    timeLimit: 150,
    gravity: 720,
    restitution: 0.35,
    initialOrbs: [
      { tier: 2, xOffset: -65 },
      { tier: 2, xOffset: 65 }
    ],
    star2Score: 1300,
    star3Score: 1700,
    shardReward: 50
  },
  {
    id: 4,
    nameEn: 'Stabilizer Silo',
    namePt: 'Silo Estabilizador',
    targetScore: 1400,
    targetTier: 5,
    timeLimit: 150,
    gravity: 720,
    restitution: 0.35,
    initialOrbs: [
      { tier: 2, xOffset: -75 },
      { tier: 3, xOffset: 0 },
      { tier: 2, xOffset: 75 }
    ],
    star2Score: 1900,
    star3Score: 2400,
    shardReward: 65
  },
  {
    id: 5,
    nameEn: 'Tachyon Reservoir',
    namePt: 'Reservatório Táquion',
    targetScore: 2000,
    targetTier: 6, // C (Nova Blaze Core)
    timeLimit: 160,
    gravity: 730,
    restitution: 0.35,
    initialOrbs: [
      { tier: 3, xOffset: -70 },
      { tier: 3, xOffset: 70 }
    ],
    star2Score: 2600,
    star3Score: 3300,
    shardReward: 80
  },
  {
    id: 6,
    nameEn: 'Supernova Bay',
    namePt: 'Baía Supernova',
    targetScore: 2800,
    targetTier: 6,
    timeLimit: 160,
    gravity: 740,
    restitution: 0.35,
    initialOrbs: [
      { tier: 3, xOffset: -80 },
      { tier: 4, xOffset: 0 },
      { tier: 3, xOffset: 80 }
    ],
    star2Score: 3600,
    star3Score: 4500,
    shardReward: 100
  },
  {
    id: 7,
    nameEn: 'Quantum Well',
    namePt: 'Poço Quântico',
    targetScore: 3800,
    targetTier: 7, // N (Quantum Void Drop)
    timeLimit: 170,
    gravity: 750,
    restitution: 0.36,
    initialOrbs: [
      { tier: 4, xOffset: -75 },
      { tier: 4, xOffset: 75 }
    ],
    star2Score: 4800,
    star3Score: 6000,
    shardReward: 120
  },
  {
    id: 8,
    nameEn: 'Antimatter Vault',
    namePt: 'Cofre de Antimatéria',
    targetScore: 5000,
    targetTier: 7,
    timeLimit: 170,
    gravity: 750,
    restitution: 0.36,
    initialOrbs: [
      { tier: 4, xOffset: -85 },
      { tier: 5, xOffset: 0 },
      { tier: 4, xOffset: 85 }
    ],
    star2Score: 6400,
    star3Score: 8000,
    shardReward: 150
  },
  {
    id: 9,
    nameEn: 'Hypergravity Core',
    namePt: 'Núcleo Hipergravidade',
    targetScore: 6500,
    targetTier: 8, // O (Antimatter Singularity)
    timeLimit: 180,
    gravity: 780,
    restitution: 0.34,
    initialOrbs: [
      { tier: 4, xOffset: -80 },
      { tier: 5, xOffset: 80 }
    ],
    star2Score: 8200,
    star3Score: 10500,
    shardReward: 180
  },
  {
    id: 10,
    nameEn: 'Dark Energy Matrix',
    namePt: 'Matriz Energia Escura',
    targetScore: 8500,
    targetTier: 9, // Ne (Dark Energy Matrix)
    timeLimit: 190,
    gravity: 760,
    restitution: 0.36,
    initialOrbs: [
      { tier: 5, xOffset: -85 },
      { tier: 5, xOffset: 85 }
    ],
    star2Score: 11000,
    star3Score: 14000,
    shardReward: 220
  },
  {
    id: 11,
    nameEn: 'Pulsar Dynamo',
    namePt: 'Dínamo Pulsar',
    targetScore: 12000,
    targetTier: 10, // Ar (Pulsar Radiant Engine)
    timeLimit: 200,
    gravity: 750,
    restitution: 0.36,
    initialOrbs: [
      { tier: 5, xOffset: -90 },
      { tier: 6, xOffset: 0 },
      { tier: 5, xOffset: 90 }
    ],
    star2Score: 16000,
    star3Score: 21000,
    shardReward: 300
  },
  {
    id: 12,
    nameEn: 'Omega Nebula Apex',
    namePt: 'Ápice Ômega Nebula',
    targetScore: 20000,
    targetTier: 11, // Ω (Nebula Fusion Core)
    timeLimit: 240,
    gravity: 740,
    restitution: 0.36,
    initialOrbs: [
      { tier: 6, xOffset: -90 },
      { tier: 6, xOffset: 90 }
    ],
    star2Score: 28000,
    star3Score: 38000,
    shardReward: 600
  }
];
