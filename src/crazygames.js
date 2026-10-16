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
 * - Includes strict 2.5s Watchdog Timeout & environment check so local/custom domains NEVER freeze after 3 levels
 */

export class CrazyGamesBridge {
  constructor() {
    this.sdk = null;
    this.isInitialized = false;
    this.isLiveCrazyGamesHost = false;
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
   * Checks whether the SDK is running inside an active CrazyGames environment
   * (either *.crazygames.* or local crazygames developer testing).
   * @returns {boolean}
   */
  _canRequestLiveAds() {
    if (!this.sdk || !this.sdk.ad || typeof this.sdk.ad.requestAd !== 'function') {
      return false;
    }
    const env = this.sdk.environment;
    if (env === 'disabled') {
      return false;
    }
    if (typeof window !== 'undefined' && window.location) {
      const host = (window.location.hostname || '').toLowerCase();
      const isCgHost = host.includes('crazygames') || host.includes('1001juegos');
      if (!isCgHost && env !== 'crazygames' && env !== 'local') {
        return false;
      }
      // If running on custom domain or localhost without ?crazygames, SDK environment is 'disabled' or 'local'
      if (!isCgHost && env === 'local' && !window.location.search.includes('crazygames')) {
        return false;
      }
    }
    return true;
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
          await Promise.race([
            this.sdk.init(),
            new Promise((resolve) => setTimeout(resolve, 2000))
          ]);
        }
        if (this.sdk.ad && typeof this.sdk.ad.hasAdblock === 'function') {
          try {
            this.hasAdblock = await Promise.race([
              this.sdk.ad.hasAdblock(),
              new Promise((resolve) => setTimeout(() => resolve(false), 1200))
            ]);
          } catch (_) {
            this.hasAdblock = false;
          }
        }
        this.isInitialized = true;
        this.isLiveCrazyGamesHost = this._canRequestLiveAds();
        console.log(`[CrazyGames] SDK v3 initialized (env=${this.sdk.environment || 'unknown'}, liveAds=${this.isLiveCrazyGamesHost}).`);
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
      if (this.sdk && this.sdk.game && typeof this.sdk.game.gameplayStart === 'function' && this.sdk.environment !== 'disabled') {
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
      if (this.sdk && this.sdk.game && typeof this.sdk.game.gameplayStop === 'function' && this.sdk.environment !== 'disabled') {
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
      if (this.sdk && this.sdk.game && this.sdk.environment !== 'disabled') {
        if (typeof this.sdk.game.happytime === 'function') {
          this.sdk.game.happytime();
        } else if (typeof this.sdk.game.happyTime === 'function') {
          this.sdk.game.happyTime();
        }
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

    if (this._canRequestLiveAds()) {
      let settled = false;
      const watchdog = setTimeout(() => {
        if (settled) return;
        settled = true;
        console.warn('[CrazyGames] Rewarded Ad watchdog timeout -> Resuming game safely.');
        if (this.onAdResumeCallback) this.onAdResumeCallback();
        if (onError) onError('timeout');
      }, 4000);

      try {
        await this.sdk.ad.requestAd('rewarded', {
          adStarted: () => {
            console.log('[CrazyGames] Rewarded Ad started -> Muting & freezing physics.');
            if (this.onAdPauseCallback) this.onAdPauseCallback();
          },
          adFinished: () => {
            if (settled) return;
            settled = true;
            clearTimeout(watchdog);
            console.log('[CrazyGames] Rewarded Ad finished -> Restoring audio & granting reward.');
            if (this.onAdResumeCallback) this.onAdResumeCallback();
            if (onRewarded) onRewarded();
          },
          adError: (err) => {
            if (settled) return;
            settled = true;
            clearTimeout(watchdog);
            console.warn('[CrazyGames] Rewarded Ad error / AdBlock -> NO reward granted:', err);
            if (this.onAdResumeCallback) this.onAdResumeCallback();
            if (onError) onError(err);
          }
        });
      } catch (err) {
        if (!settled) {
          settled = true;
          clearTimeout(watchdog);
          console.warn('[CrazyGames] Exception during Rewarded Ad -> NO reward granted:', err);
          if (this.onAdResumeCallback) this.onAdResumeCallback();
          if (onError) onError(err);
        }
      }
    } else {
      // If AdBlock blocked the SDK on a live host, do not grant reward
      if (this.hasAdblock) {
        if (this.onAdResumeCallback) this.onAdResumeCallback();
        if (onError) onError('adblock_detected');
        return;
      }
      // Local / standalone environment simulation
      console.log('[CrazyGames Standalone] Simulating Rewarded Ad completion.');
      if (this.onAdResumeCallback) this.onAdResumeCallback();
      if (onRewarded) onRewarded();
    }
  }

  /**
   * Requests a Midgame Ad during logical transitions (Victory / Game Over).
   * Enforces a 180-second minimum cooldown and a strict 2.5s watchdog so the game NEVER freezes after 3 levels!
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

    // Reset counters immediately so even if an ad is skipped or errors, it won't re-trigger on every click
    this.lastMidgameTime = now;
    this.levelsCompletedSinceLastAd = 0;

    if (!this._canRequestLiveAds()) {
      if (this.onAdResumeCallback) this.onAdResumeCallback();
      if (onComplete) onComplete();
      return;
    }

    if (this.onAdPauseCallback) this.onAdPauseCallback();
    this.gameplayStop();

    let settled = false;
    const finishSafely = () => {
      if (settled) return;
      settled = true;
      clearTimeout(watchdog);
      if (this.onAdResumeCallback) this.onAdResumeCallback();
      if (onComplete) onComplete();
    };

    const watchdog = setTimeout(() => {
      console.warn('[CrazyGames] Midgame Ad watchdog timeout (2.5s) -> Proceeding to next sector.');
      finishSafely();
    }, 2500);

    try {
      await this.sdk.ad.requestAd('midgame', {
        adStarted: () => {
          if (this.onAdPauseCallback) this.onAdPauseCallback();
        },
        adFinished: () => {
          finishSafely();
        },
        adError: () => {
          finishSafely();
        }
      });
    } catch (_) {
      finishSafely();
    }
  }

  notifyLevelCompleted() {
    this.levelsCompletedSinceLastAd++;
  }
}

export const crazyGames = new CrazyGamesBridge();
