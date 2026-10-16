/**
 * @fileoverview Achievements Vault & Permanent Score Multiplier Module
 * 10 Progressive Challenges granting permanent passive score multipliers.
 */

import { storage } from './storage.js';

export const ACHIEVEMENTS_DEF = [
  {
    id: 'first_fusion',
    titleEn: 'First Fusion',
    titlePt: 'Primeira Fusão',
    descEn: 'Perform your first plasma core fusion',
    descPt: 'Realize a sua primeira fusão nuclear de orbes',
    icon: '⚛️',
    multiplierBonus: 0.05
  },
  {
    id: 'tier5_reach',
    titleEn: 'Tachyon Pulse',
    titlePt: 'Poder Táquion',
    descEn: 'Synthesize a Tier 5 Tachyon Pulse Sphere',
    descPt: 'Sintetize um orbe Tier 5 (Táquion)',
    icon: '⚡',
    multiplierBonus: 0.05
  },
  {
    id: 'tier8_reach',
    titleEn: 'Singularity',
    titlePt: 'Singularidade',
    descEn: 'Synthesize a Tier 8 Antimatter Singularity',
    descPt: 'Sintetize um orbe Tier 8 (Antimatéria)',
    icon: '🌌',
    multiplierBonus: 0.05
  },
  {
    id: 'omega_core',
    titleEn: 'Omega Core',
    titlePt: 'Núcleo Ômega',
    descEn: 'Synthesize the supreme Omega Fusion Core (T11)',
    descPt: 'Sintetize o lendário Núcleo de Fusão Ômega (T11)',
    icon: '👑',
    multiplierBonus: 0.10
  },
  {
    id: 'combo_cascade',
    titleEn: 'Cascade Master',
    titlePt: 'Mestre da Cascata',
    descEn: 'Trigger a combo cascade x4 or higher',
    descPt: 'Atinja um combo de fusão em cascata x4 ou superior',
    icon: '💥',
    multiplierBonus: 0.05
  },
  {
    id: 'speed_runner',
    titleEn: 'Stellar Sprinter',
    titlePt: 'Velocista Estelar',
    descEn: 'Clear any sector in under 45 seconds',
    descPt: 'Conclua qualquer setor em menos de 45 segundos',
    icon: '⏱️',
    multiplierBonus: 0.05
  },
  {
    id: 'three_stars_5',
    titleEn: 'Triple Constellation',
    titlePt: 'Constelação Tripla',
    descEn: 'Earn 3 stars in at least 5 different sectors',
    descPt: 'Conquiste 3 estrelas em pelo menos 5 setores',
    icon: '🌟',
    multiplierBonus: 0.05
  },
  {
    id: 'tactical_genius',
    titleEn: 'Cosmic Tactician',
    titlePt: 'Estrategista Cósmico',
    descEn: 'Use both the Hammer and Undo tactical powerups',
    descPt: 'Utilize os power-ups táticos de Martelo e Desfazer',
    icon: '🔨',
    multiplierBonus: 0.05
  },
  {
    id: 'overdrive_survivor',
    titleEn: 'Overdrive Ace',
    titlePt: 'Piloto Overdrive',
    descEn: 'Score 2,000+ points in Overdrive Mode',
    descPt: 'Alcance 2.000 pontos no frenético Modo Overdrive',
    icon: '🚀',
    multiplierBonus: 0.05
  },
  {
    id: 'time_attack_master',
    titleEn: 'Time Lord',
    titlePt: 'Senhor do Tempo',
    descEn: 'Score 3,000+ points in Time Attack Mode',
    descPt: 'Alcance 3.000 pontos na corrida do Modo Time Attack',
    icon: '⏳',
    multiplierBonus: 0.05
  }
];

class AchievementsManager {
  isUnlocked(id) {
    return Boolean(storage.data.achievements && storage.data.achievements[id]);
  }

  getUnlockedCount() {
    return ACHIEVEMENTS_DEF.filter((a) => this.isUnlocked(a.id)).length;
  }

  unlock(id, onUnlockedCallback) {
    if (this.isUnlocked(id)) return false;
    storage.unlockAchievement(id);
    const def = ACHIEVEMENTS_DEF.find((a) => a.id === id);
    if (onUnlockedCallback && def) {
      onUnlockedCallback(def);
    }
    return true;
  }

  getPermanentMultiplier() {
    let mult = 1.0;
    ACHIEVEMENTS_DEF.forEach((a) => {
      if (this.isUnlocked(a.id)) {
        mult += a.multiplierBonus;
      }
    });
    return mult;
  }
}

export const achievements = new AchievementsManager();
