/**
 * @fileoverview Atomic Anti-Corruption Save System for Nebula Drops: Fusion Core
 * Supports:
 * - 20 Sectors progression & stars
 * - Permanent Achievements Vault & Multiplier
 * - 7-Day Daily Login Rewards Calendar
 * - Cosmetic Skins Shop (6 palettes)
 * - Tactical Power-ups: Hammer & Undo
 * - Overdrive & Time Attack high score records
 */

const TEMP_STORAGE_KEY = 'nebula_drops_save_temp_v2';
const FINAL_STORAGE_KEY = 'nebula_drops_save_v2';

const DEFAULT_SAVE_DATA = {
  maxLevel: 1,
  highScore: 0,
  overdriveBest: 0,
  timeAttackBest: 0,
  plasmaShards: 0,
  muted: false,
  stars: {},
  bestScores: {},
  achievements: {},
  dailyStreak: 1,
  lastClaimDayEpoch: 0,
  unlockedSkins: { default: true },
  equippedSkin: 'default',
  hammerCount: 1,
  undoCount: 1
};

class StorageManager {
  constructor() {
    this.data = this.load();
  }

  _computeHash(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  save(partialData = {}) {
    this.data = {
      ...this.data,
      ...partialData,
      stars: { ...(this.data.stars || {}), ...(partialData.stars || {}) },
      bestScores: { ...(this.data.bestScores || {}), ...(partialData.bestScores || {}) },
      achievements: { ...(this.data.achievements || {}), ...(partialData.achievements || {}) },
      unlockedSkins: { ...(this.data.unlockedSkins || {}), ...(partialData.unlockedSkins || {}) }
    };

    try {
      const payloadStr = JSON.stringify(this.data);
      const envelope = JSON.stringify({
        checksum: this._computeHash(payloadStr),
        timestamp: Date.now(),
        payload: payloadStr
      });

      localStorage.setItem(TEMP_STORAGE_KEY, envelope);

      const verifyRaw = localStorage.getItem(TEMP_STORAGE_KEY);
      if (verifyRaw) {
        const parsedEnv = JSON.parse(verifyRaw);
        if (parsedEnv && this._computeHash(parsedEnv.payload) === parsedEnv.checksum) {
          localStorage.setItem(FINAL_STORAGE_KEY, verifyRaw);
          localStorage.removeItem(TEMP_STORAGE_KEY);
        }
      }
    } catch (err) {
      console.warn('[Storage] Atomic save fallback:', err);
    }
  }

  load() {
    try {
      const raw = localStorage.getItem(FINAL_STORAGE_KEY) || localStorage.getItem(TEMP_STORAGE_KEY);
      if (!raw) return { ...DEFAULT_SAVE_DATA };

      const env = JSON.parse(raw);
      if (env && env.payload) {
        const parsed = JSON.parse(env.payload);
        return {
          maxLevel: Math.max(1, Number(parsed.maxLevel) || 1),
          highScore: Math.max(0, Number(parsed.highScore) || 0),
          overdriveBest: Math.max(0, Number(parsed.overdriveBest) || 0),
          timeAttackBest: Math.max(0, Number(parsed.timeAttackBest) || 0),
          plasmaShards: Math.max(0, Number(parsed.plasmaShards) || 0),
          muted: false, // Guaranteed unmuted on game launch so music and sfx play immediately
          stars: typeof parsed.stars === 'object' && parsed.stars ? parsed.stars : {},
          bestScores: typeof parsed.bestScores === 'object' && parsed.bestScores ? parsed.bestScores : {},
          achievements: typeof parsed.achievements === 'object' && parsed.achievements ? parsed.achievements : {},
          dailyStreak: Math.max(1, Number(parsed.dailyStreak) || 1),
          lastClaimDayEpoch: Number(parsed.lastClaimDayEpoch) || 0,
          unlockedSkins: typeof parsed.unlockedSkins === 'object' && parsed.unlockedSkins ? parsed.unlockedSkins : { default: true },
          equippedSkin: typeof parsed.equippedSkin === 'string' ? parsed.equippedSkin : 'default',
          hammerCount: Number(parsed.hammerCount) !== undefined && !isNaN(parsed.hammerCount) ? Number(parsed.hammerCount) : 2,
          undoCount: Number(parsed.undoCount) !== undefined && !isNaN(parsed.undoCount) ? Number(parsed.undoCount) : 2
        };
      }
    } catch (err) {
      console.warn('[Storage] Corrupt save detected, restoring clean state:', err);
    }
    return { ...DEFAULT_SAVE_DATA };
  }

  recordSectorWin(levelId, score, starsEarned, shardsAdded) {
    const prevStars = Number(this.data.stars[levelId]) || 0;
    const prevBest = Number(this.data.bestScores[levelId]) || 0;
    const nextMaxLevel = Math.max(this.data.maxLevel, Math.min(20, levelId + 1));
    const nextHighScore = Math.max(this.data.highScore, score);

    this.save({
      maxLevel: nextMaxLevel,
      highScore: nextHighScore,
      plasmaShards: (this.data.plasmaShards || 0) + shardsAdded,
      stars: { [levelId]: Math.max(prevStars, starsEarned) },
      bestScores: { [levelId]: Math.max(prevBest, score) }
    });
  }

  recordHighScore(score, mode = 'normal') {
    if (mode === 'overdrive') {
      if (score > (this.data.overdriveBest || 0)) {
        this.save({ overdriveBest: score });
      }
    } else if (mode === 'time_attack') {
      if (score > (this.data.timeAttackBest || 0)) {
        this.save({ timeAttackBest: score });
      }
    } else {
      if (score > this.data.highScore) {
        this.save({ highScore: score });
      }
    }
  }

  addShards(amount) {
    this.save({ plasmaShards: (this.data.plasmaShards || 0) + amount });
  }

  unlockAchievement(id) {
    if (!this.data.achievements[id]) {
      this.save({ achievements: { [id]: true } });
      return true;
    }
    return false;
  }

  unlockSkin(skinId) {
    this.save({
      unlockedSkins: { [skinId]: true },
      equippedSkin: skinId
    });
  }

  equipSkin(skinId) {
    if (this.data.unlockedSkins[skinId]) {
      this.save({ equippedSkin: skinId });
      return true;
    }
    return false;
  }

  updatePowerups(hammers, undos) {
    this.save({ hammerCount: hammers, undoCount: undos });
  }

  canClaimDaily() {
    const todayEpoch = Math.floor(Date.now() / 86400000);
    return !this.data.lastClaimDayEpoch || todayEpoch > this.data.lastClaimDayEpoch;
  }

  claimDailyReward(shardsAwarded) {
    const todayEpoch = Math.floor(Date.now() / 86400000);
    const prevEpoch = this.data.lastClaimDayEpoch || 0;
    let nextStreak = this.data.dailyStreak || 1;

    if (prevEpoch > 0 && todayEpoch - prevEpoch > 1) {
      nextStreak = 1; // streak reset
    } else {
      nextStreak = (nextStreak % 7) + 1;
    }

    this.save({
      plasmaShards: (this.data.plasmaShards || 0) + shardsAwarded,
      lastClaimDayEpoch: todayEpoch,
      dailyStreak: nextStreak
    });
    return nextStreak;
  }
}

export const storage = new StorageManager();
