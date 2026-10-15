/**
 * @fileoverview Atomic Anti-Corruption Save System for Nebula Drops: Fusion Core
 * Implements temporary write verification before committing to primary storage key,
 * mirroring Godot's user://save_temp.json -> user://savegame.json pattern.
 */

const TEMP_STORAGE_KEY = 'nebula_drops_save_temp_v1';
const FINAL_STORAGE_KEY = 'nebula_drops_save_v1';

const DEFAULT_SAVE_DATA = {
  maxLevel: 1,
  highScore: 0,
  plasmaShards: 0,
  muted: false,
  stars: {},
  bestScores: {}
};

class StorageManager {
  constructor() {
    this.data = this.load();
  }

  /**
   * Computes a lightweight integrity hash to prevent corrupted JSON states.
   * @param {string} str
   * @returns {number}
   */
  _computeHash(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  /**
   * Atomically writes save state:
   * 1. Serialize & write to temporary slot (user://save_temp.json equivalent)
   * 2. Verify parse & checksum
   * 3. Commit to final slot
   */
  save(partialData = {}) {
    this.data = {
      ...this.data,
      ...partialData,
      stars: { ...(this.data.stars || {}), ...(partialData.stars || {}) },
      bestScores: { ...(this.data.bestScores || {}), ...(partialData.bestScores || {}) }
    };

    try {
      const payloadStr = JSON.stringify(this.data);
      const envelope = JSON.stringify({
        checksum: this._computeHash(payloadStr),
        timestamp: Date.now(),
        payload: payloadStr
      });

      // Step 1: Write to temporary key
      localStorage.setItem(TEMP_STORAGE_KEY, envelope);

      // Step 2: Verify temporary write integrity
      const verifyRaw = localStorage.getItem(TEMP_STORAGE_KEY);
      if (verifyRaw) {
        const parsedEnv = JSON.parse(verifyRaw);
        if (parsedEnv && this._computeHash(parsedEnv.payload) === parsedEnv.checksum) {
          // Step 3: Atomic commit to final key
          localStorage.setItem(FINAL_STORAGE_KEY, verifyRaw);
          localStorage.removeItem(TEMP_STORAGE_KEY);
        }
      }
    } catch (err) {
      console.warn('[Storage] Atomic save fallback (private browsing or quota):', err);
    }
  }

  load() {
    try {
      const raw = localStorage.getItem(FINAL_STORAGE_KEY) || localStorage.getItem(TEMP_STORAGE_KEY);
      if (!raw) return { ...DEFAULT_SAVE_DATA, stars: {}, bestScores: {} };

      const env = JSON.parse(raw);
      if (env && env.payload) {
        const parsed = JSON.parse(env.payload);
        return {
          maxLevel: Math.max(1, Number(parsed.maxLevel) || 1),
          highScore: Math.max(0, Number(parsed.highScore) || 0),
          plasmaShards: Math.max(0, Number(parsed.plasmaShards) || 0),
          muted: Boolean(parsed.muted),
          stars: typeof parsed.stars === 'object' && parsed.stars ? parsed.stars : {},
          bestScores: typeof parsed.bestScores === 'object' && parsed.bestScores ? parsed.bestScores : {}
        };
      }
    } catch (err) {
      console.warn('[Storage] Corrupt save detected, restoring clean state:', err);
    }
    return { ...DEFAULT_SAVE_DATA, stars: {}, bestScores: {} };
  }

  recordSectorWin(levelId, score, starsEarned, shardsAdded) {
    const prevStars = Number(this.data.stars[levelId]) || 0;
    const prevBest = Number(this.data.bestScores[levelId]) || 0;
    const nextMaxLevel = Math.max(this.data.maxLevel, Math.min(12, levelId + 1));
    const nextHighScore = Math.max(this.data.highScore, score);

    this.save({
      maxLevel: nextMaxLevel,
      highScore: nextHighScore,
      plasmaShards: (this.data.plasmaShards || 0) + shardsAdded,
      stars: { [levelId]: Math.max(prevStars, starsEarned) },
      bestScores: { [levelId]: Math.max(prevBest, score) }
    });
  }

  recordHighScore(score) {
    if (score > this.data.highScore) {
      this.save({ highScore: score });
    }
  }

  addShards(amount) {
    this.save({ plasmaShards: (this.data.plasmaShards || 0) + amount });
  }
}

export const storage = new StorageManager();
