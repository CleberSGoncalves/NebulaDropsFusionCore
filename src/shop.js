/**
 * @fileoverview Cosmetic Skins Shop Module for Web Playtest
 * Matches Godot 4.7.2 ShopManager 1:1.
 */

import { storage } from './storage.js';
import { crazyGames } from './crazygames.js';

export const SKINS_DEF = [
  {
    id: 'default',
    nameEn: 'Plasma Nebular',
    namePt: 'Plasma Nebular',
    descEn: 'Classic cosmic energy and radiant cyan glow',
    descPt: 'Paleta clássica com orbes de energia cósmica neon',
    cost: 0,
    accent: '#00f5ff',
    theme: 'default'
  },
  {
    id: 'cyber_void',
    nameEn: 'Cyberpunk Synth',
    namePt: 'Cyber Void Neon',
    descEn: 'Synthwave grid with hot pink and electric magenta',
    descPt: 'Estilo synthwave com rosa choque e ciano elétrico',
    cost: 150,
    accent: '#ec4899',
    theme: 'cyber_void'
  },
  {
    id: 'zen_crystal',
    nameEn: 'Zen Crystals',
    namePt: 'Cristais Zen',
    descEn: 'Prismatic translucent crystal facets and lo-fi vibes',
    descPt: 'Facetas translúcidas de cristal prismático e quartzo',
    cost: 300,
    accent: '#2dd4bf',
    theme: 'zen_crystal'
  },
  {
    id: 'solar_flare',
    nameEn: 'Solar Flare',
    namePt: 'Tempestade Solar',
    descEn: 'Blazing coronal glow and molten golden plasma',
    descPt: 'Brilho ardente de coroa solar e labaredas douradas',
    cost: 450,
    accent: '#f59e0b',
    theme: 'solar'
  },
  {
    id: 'quantum_neon',
    nameEn: 'Quantum Void',
    namePt: 'Vazio Quântico',
    descEn: 'Deep void ultraviolet and gamma radiation',
    descPt: 'Profundezas do vácuo com ultravioleta e radiação gama',
    cost: 600,
    accent: '#a855f7',
    theme: 'quantum'
  },
  {
    id: 'matrix_code',
    nameEn: 'Terminal Matrix',
    namePt: 'Terminal Matrix',
    descEn: 'Cybernetic phosphor green hacker terminal aesthetics',
    descPt: 'Fósforo verde de terminal hacker cibernético',
    cost: 800,
    accent: '#22c55e',
    theme: 'matrix'
  }
];

export class ShopManager {
  constructor() {
    this.skins = SKINS_DEF;
  }

  isUnlocked(skinId) {
    if (skinId === 'default') return true;
    return Boolean(storage.data.unlockedSkins && storage.data.unlockedSkins[skinId]);
  }

  getEquippedSkinId() {
    return storage.data.equippedSkin || 'default';
  }

  equip(skinId) {
    if (this.isUnlocked(skinId)) {
      storage.equipSkin(skinId);
      return true;
    }
    return false;
  }

  buyWithShards(skinId) {
    const skin = this.skins.find(s => s.id === skinId);
    if (!skin) return { success: false, reason: 'not_found' };

    if (this.isUnlocked(skinId)) {
      this.equip(skinId);
      return { success: true, reason: 'already_unlocked' };
    }

    const currentShards = storage.data.plasmaShards || 0;
    if (currentShards < skin.cost) {
      return { success: false, reason: 'insufficient_shards', needed: skin.cost - currentShards };
    }

    storage.save({ plasmaShards: currentShards - skin.cost });
    storage.unlockSkin(skinId);
    return { success: true, reason: 'purchased' };
  }

  async unlockWithAd(skinId) {
    const skin = this.skins.find(s => s.id === skinId);
    if (!skin) return false;

    return new Promise((resolve) => {
      crazyGames.requestRewardedAd(
        'double_shards',
        () => {
          storage.unlockSkin(skinId);
          storage.equipSkin(skinId);
          resolve(true);
        },
        () => {
          resolve(false);
        }
      );
    });
  }
}

export const shopManager = new ShopManager();
