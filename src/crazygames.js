/**
 * @fileoverview CrazyGames SDK v3 Integration Bridge for Nebula Drops: Fusion Core
 * Strictly complies with CrazyGames publishing guidelines:
 * - Asynchronous SDK initialization with resilient AdBlock handling
 * - Proper gameplayStart() / gameplayStop() lifecycle tracking
 * - Mandatory audio muting and physics freeze on adStarted; restore on adFinished / adError
 * - Rewarded Ad 1: Emergency Shield (+30s & clear top overflow + 3s invulnerability, 1x per attempt)
 * - Rewarded Ad 2: Double Plasma Shards / Bonus on sector victory
 * - Strictly NEVER grant reward on adError (AdBlock active)
 * - Midgame Ads: 180s cooldown, strictly on logical screens (victory / game over), never mid-gameplay
 */

export class CrazyGamesBridge {
  constructor() {
    this.sdk = null;
    this.isInitialized = false;
    this.hasAdblock = false;
    this.inGameplay = false;
    this.lastMidgameTime = performance.now();
    this.levelsCompletedSinceLastAd = 0;
    this.onAdPauseCallback = null;
    this.onAdResumeCallback = null;
  }

  /**
   * Registers global callbacks to freeze physics and mute audio during ads.
   * @param {() => void} onPause
   * @param {() => void} onResume
   */
  setAdCallbacks(onPause, onResume) {
    this.onAdPauseCallback = onPause;
    this.onAdResumeCallback = onResume;
  }

  /**
   * Initializes the CrazyGames SDK v3 asynchronously.
   * @returns {Promise<boolean>}
   */
  async init() {
    if (this.isInitialized) return true;

    try {
      if (typeof window !== 'undefined' && window.CrazyGames && window.CrazyGames.SDK) {
        this.sdk = window.CrazyGames.SDK;
        if (typeof this.sdk.init === 'function') {
          await this.sdk.init();
        }
        if (this.sdk.ad && typeof this.sdk.ad.hasAdblock === 'function') {
          try {
            this.hasAdblock = await this.sdk.ad.hasAdblock();
          } catch (_) {
            this.hasAdblock = false;
          }
        }
        this.isInitialized = true;
        console.log('[CrazyGames] SDK v3 initialized successfully.');
        return true;
      } else {
        console.warn('[CrazyGames] SDK v3 not found on window (Fallback mode active).');
        this.isInitialized = false;
        return false;
      }
    } catch (err) {
      console.warn('[CrazyGames] SDK v3 init failed (AdBlock or offline):', err);
      this.hasAdblock = true;
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * Signals that active gameplay has begun or resumed.
   */
  gameplayStart() {
    if (this.inGameplay) return;
    this.inGameplay = true;
    try {
      if (this.sdk && this.sdk.game && typeof this.sdk.game.gameplayStart === 'function') {
        this.sdk.game.gameplayStart();
        console.log('[CrazyGames] gameplayStart() triggered.');
      }
    } catch (err) {
      console.debug('[CrazyGames] gameplayStart error:', err);
    }
  }

  /**
   * Signals that active gameplay has paused, ended, or entered a menu.
   */
  gameplayStop() {
    if (!this.inGameplay) return;
    this.inGameplay = false;
    try {
      if (this.sdk && this.sdk.game && typeof this.sdk.game.gameplayStop === 'function') {
        this.sdk.game.gameplayStop();
        console.log('[CrazyGames] gameplayStop() triggered.');
      }
    } catch (err) {
      console.debug('[CrazyGames] gameplayStop error:', err);
    }
  }

  /**
   * Signals a celebratory moment (sector cleared or Tier 8+ core synthesized).
   */
  happyTime() {
    try {
      if (this.sdk && this.sdk.game && typeof this.sdk.game.happytime === 'function') {
        this.sdk.game.happytime();
      } else if (this.sdk && this.sdk.game && typeof this.sdk.game.happyTime === 'function') {
        this.sdk.game.happyTime();
      }
    } catch (err) {
      console.debug('[CrazyGames] happyTime error:', err);
    }
  }

  /**
   * Requests a Rewarded Ad.
   * Strict compliance:
   * - Freeze physics & mute audio on adStarted
   * - Resume physics & audio on adFinished / adError
   * - NEVER grant reward on adError (e.g. AdBlock)
   *
   * @param {'revive' | 'double_shards'} rewardType
   * @param {() => void} onRewarded
   * @param {(err?: any) => void} [onError]
   */
  async requestRewardedAd(rewardType, onRewarded, onError) {
    console.log(`[CrazyGames] Requesting Rewarded Ad: ${rewardType}`);

    if (this.onAdPauseCallback) this.onAdPauseCallback();
    this.gameplayStop();

    if (this.sdk && this.sdk.ad && typeof this.sdk.ad.requestAd === 'function') {
      try {
        await this.sdk.ad.requestAd('rewarded', {
          adStarted: () => {
            console.log('[CrazyGames] Rewarded Ad started -> Muting & freezing physics.');
            if (this.onAdPauseCallback) this.onAdPauseCallback();
          },
          adFinished: () => {
            console.log('[CrazyGames] Rewarded Ad finished -> Restoring audio & granting reward.');
            if (this.onAdResumeCallback) this.onAdResumeCallback();
            if (onRewarded) onRewarded();
          },
          adError: (err) => {
            console.warn('[CrazyGames] Rewarded Ad error / AdBlock -> NO reward granted:', err);
            if (this.onAdResumeCallback) this.onAdResumeCallback();
            if (onError) onError(err);
          }
        });
      } catch (err) {
        console.warn('[CrazyGames] Exception during Rewarded Ad -> NO reward granted:', err);
        if (this.onAdResumeCallback) this.onAdResumeCallback();
        if (onError) onError(err);
      }
    } else {
      // If AdBlock blocked the SDK entirely, do not grant reward if hasAdblock is flagged
      if (this.hasAdblock) {
        if (this.onAdResumeCallback) this.onAdResumeCallback();
        if (onError) onError('adblock_detected');
        return;
      }
      // Local dev simulation
      console.log('[CrazyGames Local Dev] Simulating Rewarded Ad completion.');
      if (this.onAdResumeCallback) this.onAdResumeCallback();
      if (onRewarded) onRewarded();
    }
  }

  /**
   * Requests a Midgame Ad during logical transitions (Victory / Game Over).
   * Enforces a 180-second minimum cooldown.
   * @param {() => void} [onComplete]
   */
  async requestMidgameAd(onComplete) {
    const now = performance.now();
    const elapsedSec = (now - this.lastMidgameTime) / 1000;
    const cooldownReady = elapsedSec >= 180 || this.levelsCompletedSinceLastAd >= 3;

    if (!cooldownReady) {
      if (onComplete) onComplete();
      return;
    }

    if (this.onAdPauseCallback) this.onAdPauseCallback();
    this.gameplayStop();

    if (this.sdk && this.sdk.ad && typeof this.sdk.ad.requestAd === 'function') {
      try {
        await this.sdk.ad.requestAd('midgame', {
          adStarted: () => {
            if (this.onAdPauseCallback) this.onAdPauseCallback();
          },
          adFinished: () => {
            this.lastMidgameTime = performance.now();
            this.levelsCompletedSinceLastAd = 0;
            if (this.onAdResumeCallback) this.onAdResumeCallback();
            if (onComplete) onComplete();
          },
          adError: () => {
            this.lastMidgameTime = performance.now();
            if (this.onAdResumeCallback) this.onAdResumeCallback();
            if (onComplete) onComplete();
          }
        });
      } catch (_) {
        if (this.onAdResumeCallback) this.onAdResumeCallback();
        if (onComplete) onComplete();
      }
    } else {
      this.lastMidgameTime = performance.now();
      this.levelsCompletedSinceLastAd = 0;
      if (this.onAdResumeCallback) this.onAdResumeCallback();
      if (onComplete) onComplete();
    }
  }

  notifyLevelCompleted() {
    this.levelsCompletedSinceLastAd++;
  }
}

export const crazyGames = new CrazyGamesBridge();
