/**
 * @fileoverview Procedural Web Audio Synthesizer & Relaxing Cosmic Ambient Generator
 * - Continuous zero-latency relaxing cosmic lo-fi ambient soundtrack
 * - Auto-unlocks AudioContext on first user interaction (pointerdown, click, touch, keydown)
 * - Starts unmuted by default with smooth master volume control
 * - Soft, pleasant organic sound effects (gentle water drops, warm chimes, sub-bass pulse)
 * - Strict Ad-Mute compliance for CrazyGames SDK v3
 */

import { storage } from './storage.js';

// Pentatonic / Major cosmic scale frequencies for the 11 Orb Tiers
const TIER_FREQUENCIES = [
  261.63, // Tier 1: C4
  293.66, // Tier 2: D4
  329.63, // Tier 3: E4
  392.00, // Tier 4: G4
  440.00, // Tier 5: A4
  523.25, // Tier 6: C5
  587.33, // Tier 7: D5
  659.25, // Tier 8: E5
  783.99, // Tier 9: G5
  880.00, // Tier 10: A5
  1046.50 // Tier 11: C6 (Nebula Fusion Core!)
];

// Relaxing Ambient Chord Progressions (Warm, slow-breathing analog synth pads)
const AMBIENT_CHORDS = {
  default: [
    // Cmaj9 (Celestial Warmth)
    [130.81, 196.00, 246.94, 293.66, 329.63],
    // Fmaj7 (Expansive Deep Space)
    [174.61, 220.00, 261.63, 329.63, 392.00],
    // Am9 (Cosmic Reflection)
    [110.00, 164.81, 196.00, 246.94, 261.63],
    // G6/9 (Gentle Zero-G Floating)
    [98.00, 146.83, 196.00, 246.94, 293.66]
  ],
  cyber_void: [
    // Dm9 (Synthwave Twilight)
    [146.83, 220.00, 261.63, 329.63, 392.00],
    // Bbmaj7 (Neon Horizon)
    [116.54, 174.61, 233.08, 293.66, 349.23],
    // Fmaj7 (Retrowave Sunset)
    [174.61, 220.00, 261.63, 329.63, 440.00],
    // C9 (Electric Aurora)
    [130.81, 196.00, 246.94, 293.66, 392.00]
  ],
  zen_crystal: [
    // E pentatonic (Crystal Singing Bowl)
    [164.81, 246.94, 293.66, 329.63, 493.88],
    // Amaj9 (Translucent Quartz)
    [110.00, 220.00, 277.18, 329.63, 440.00],
    // C#m7 (Jade Sanctuary)
    [138.59, 207.65, 277.18, 329.63, 493.88],
    // Bsus4 (Prismatic Bell)
    [123.47, 185.00, 246.94, 329.63, 369.99]
  ]
};

// Soothing high pentatonic starlight chimes
const STARLIGHT_CHIMES = [
  523.25, // C5
  659.25, // E5
  783.99, // G5
  880.00, // A5
  1046.50, // C6
  1174.66, // D6
  1318.51  // E6
];

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.musicGain = null;

    // Never start muted by default: guarantee clear, unmuted audio start
    this.isMuted = false;
    this.isAdMuted = false;

    // Ambient loop state
    this.ambientRunning = false;
    this.ambientStep = 0;
    this.ambientTimer = null;
    this.chimeTimer = null;
    this.currentTheme = 'default';

    this._setupAutoUnlock();
  }

  _setupAutoUnlock() {
    if (typeof window === 'undefined') return;
    const unlock = () => {
      this._ensureContext();
      this.startAmbientMusic();
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('click', unlock);
    };
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
    window.addEventListener('touchstart', unlock, { passive: true });
    window.addEventListener('click', unlock, { passive: true });
  }

  _ensureContext() {
    if (this.isAdMuted) return false;
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return false;
        this.ctx = new AudioCtx();

        // Master output node
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0.0 : 0.72, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);

        // Sound effects sub-bus
        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.setValueAtTime(0.75, this.ctx.currentTime);
        this.sfxGain.connect(this.masterGain);

        // Ambient music sub-bus (soft, calming background level)
        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.setValueAtTime(0.26, this.ctx.currentTime);
        this.musicGain.connect(this.masterGain);
      }

      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return true;
    } catch (_) {
      return false;
    }
  }

  setTheme(themeName = 'default') {
    if (AMBIENT_CHORDS[themeName]) {
      this.currentTheme = themeName;
    } else {
      this.currentTheme = 'default';
    }
  }

  // ── RELAXING PROCEDURAL AMBIENT MUSIC GENERATOR ──────────────────────────
  startAmbientMusic() {
    if (this.ambientRunning) return;
    if (!this._ensureContext()) return;
    this.ambientRunning = true;

    // Immediately schedule the first warm pad chord
    this._playNextAmbientChord();

    // Loop pads every 5.0 seconds (smooth 2.2s crossfade between chords)
    this.ambientTimer = setInterval(() => {
      if (!this.ambientRunning || this.isMuted || this.isAdMuted) return;
      this._playNextAmbientChord();
    }, 5000);

    // Schedule gentle starlight bell chimes at pleasant random intervals (2.5s - 4.5s)
    this._scheduleNextChime();
  }

  stopAmbientMusic() {
    this.ambientRunning = false;
    if (this.ambientTimer) {
      clearInterval(this.ambientTimer);
      this.ambientTimer = null;
    }
    if (this.chimeTimer) {
      clearTimeout(this.chimeTimer);
      this.chimeTimer = null;
    }
  }

  _scheduleNextChime() {
    if (!this.ambientRunning) return;
    const delayMs = 2600 + Math.random() * 2200;
    this.chimeTimer = setTimeout(() => {
      if (this.ambientRunning && !this.isMuted && !this.isAdMuted) {
        this._playStarlightChime();
      }
      this._scheduleNextChime();
    }, delayMs);
  }

  _playNextAmbientChord() {
    if (!this._ensureContext()) return;
    const now = this.ctx.currentTime;
    const palette = AMBIENT_CHORDS[this.currentTheme] || AMBIENT_CHORDS.default;
    const chord = palette[this.ambientStep % palette.length];
    this.ambientStep++;

    const chordDuration = 6.8;
    const attack = 2.0;
    const release = 2.4;
    const noteVol = 0.22 / Math.sqrt(chord.length);

    chord.forEach((freq, idx) => {
      // 2 Detuned soft oscillators for rich, warm analog chorus warmth
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq * 0.998, now);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq * 1.002, now);

      // Warm low-pass filter to remove any harsh digital highs
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(620 + idx * 45, now);
      filter.Q.value = 1.1;

      // Lush breathing envelope
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(noteVol, now + attack);
      gain.gain.setValueAtTime(noteVol, now + chordDuration - release);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + chordDuration);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + chordDuration + 0.1);
      osc2.stop(now + chordDuration + 0.1);
    });
  }

  _playStarlightChime() {
    if (!this._ensureContext()) return;
    const now = this.ctx.currentTime;
    const freq = STARLIGHT_CHIMES[Math.floor(Math.random() * STARLIGHT_CHIMES.length)];

    const osc = this.ctx.createOscillator();
    const overtone = this.ctx.createOscillator();
    const g = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    overtone.type = 'sine';
    overtone.frequency.setValueAtTime(freq * 2.0, now);

    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(0.045, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

    osc.connect(g);
    overtone.connect(g);
    g.connect(this.musicGain);

    osc.start(now);
    overtone.start(now);
    osc.stop(now + 1.85);
    overtone.stop(now + 1.85);
  }

  /**
   * Mutes/unmutes audio specifically during CrazyGames Ads.
   * @param {boolean} adMuted
   */
  setAdMuted(adMuted) {
    this.isAdMuted = Boolean(adMuted);
    if (this.ctx && this.masterGain && this.musicGain) {
      const now = this.ctx.currentTime;
      if (this.isAdMuted) {
        this.masterGain.gain.setTargetAtTime(0.0, now, 0.08);
        this.musicGain.gain.setTargetAtTime(0.0, now, 0.08);
      } else {
        const masterVol = this.isMuted ? 0.0 : 0.72;
        this.masterGain.gain.setTargetAtTime(masterVol, now, 0.15);
        this.musicGain.gain.setTargetAtTime(0.26, now, 0.3);
      }
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    storage.save({ muted: this.isMuted });
    if (this.ctx && this.masterGain) {
      const now = this.ctx.currentTime;
      const target = (this.isMuted || this.isAdMuted) ? 0.0 : 0.72;
      this.masterGain.gain.setTargetAtTime(target, now, 0.1);
      if (!this.isMuted && !this.ambientRunning) {
        this.startAmbientMusic();
      }
    }
    return this.isMuted;
  }

  // ── GAMEPLAY SOUND EFFECTS (WARM, ROUNDED, SATISFYING) ───────────────────

  playDrop(tier = 1) {
    if (!this._ensureContext()) return;
    const now = this.ctx.currentTime;
    const pitchJitter = 0.98 + Math.random() * 0.04;
    const baseFreq = Math.max(180, 440 - tier * 22) * pitchJitter;

    // Organic water droplet bubble plop
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq * 0.85, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.3, now + 0.035);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.45, now + 0.12);

    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(0.12, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  playBounce(intensity = 0.4) {
    if (!this._ensureContext()) return;
    const vol = Math.min(0.09, Math.max(0.015, intensity * 0.06));
    const now = this.ctx.currentTime;
    const pitch = 0.94 + Math.random() * 0.12;

    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(130 * pitch, now);
    osc.frequency.exponentialRampToValueAtTime(60 * pitch, now + 0.07);

    g.gain.setValueAtTime(vol, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  playMerge(newTier = 2, comboCount = 1) {
    if (!this._ensureContext()) return;
    const now = this.ctx.currentTime;
    const idx = Math.max(0, Math.min(TIER_FREQUENCIES.length - 1, newTier - 1));
    const pitchJitter = 0.98 + Math.random() * 0.04;
    const comboBoost = 1 + Math.min(0.3, (comboCount - 1) * 0.05);
    const rootFreq = TIER_FREQUENCIES[idx] * pitchJitter * comboBoost;

    // Harmonious crystalline bell chord (Root + Perfect 5th + Octave)
    const harmonics = [1.0, 1.5, 2.0];
    harmonics.forEach((mult, i) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(rootFreq * mult * 0.95, now + i * 0.02);
      osc.frequency.exponentialRampToValueAtTime(rootFreq * mult, now + i * 0.02 + 0.06);

      const duration = 0.35 + newTier * 0.03;
      g.gain.setValueAtTime(0.001, now + i * 0.02);
      g.gain.linearRampToValueAtTime(0.14 / (i + 1), now + i * 0.02 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(now + i * 0.02);
      osc.stop(now + duration + 0.03);
    });

    // Warm sub-bass rumble for Tier 5+ fusions
    if (newTier >= 5) {
      const sub = this.ctx.createOscillator();
      const subG = this.ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(105, now);
      sub.frequency.exponentialRampToValueAtTime(42, now + 0.22);
      subG.gain.setValueAtTime(0.18, now);
      subG.gain.exponentialRampToValueAtTime(0.001, now + 0.23);
      sub.connect(subG);
      subG.connect(this.sfxGain);
      sub.start(now);
      sub.stop(now + 0.24);
    }
  }

  playDangerAlarm() {
    if (!this._ensureContext()) return;
    const now = this.ctx.currentTime;
    // Pleasant warm warning pulse (sine instead of abrasive square wave)
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(390, now + 0.16);

    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(0.065, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  playVictory() {
    if (!this._ensureContext()) return;
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.09);
      g.gain.setValueAtTime(0.001, now + idx * 0.09);
      g.gain.linearRampToValueAtTime(0.13, now + idx * 0.09 + 0.03);
      g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.65);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 0.7);
    });
  }

  playGameOver() {
    if (!this._ensureContext()) return;
    const now = this.ctx.currentTime;
    [392.0, 349.23, 311.13, 261.63].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);
      g.gain.setValueAtTime(0.001, now + idx * 0.12);
      g.gain.linearRampToValueAtTime(0.09, now + idx * 0.12 + 0.03);
      g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.45);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.5);
    });
  }

  playFluidClebIntro() {
    if (!this._ensureContext()) return;
    const now = this.ctx.currentTime;
    const freqs = [220, 277.18, 329.63, 440];
    freqs.forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f * 0.8, now + idx * 0.06);
      osc.frequency.exponentialRampToValueAtTime(f, now + 0.9);
      g.gain.setValueAtTime(0.001, now);
      g.gain.linearRampToValueAtTime(0.07, now + 0.3);
      g.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(now + idx * 0.06);
      osc.stop(now + 1.25);
    });
  }

  playFluidClebFusion() {
    if (!this._ensureContext()) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.35);
    g.gain.setValueAtTime(0.14, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.6);
  }

  playFluidClebEject() {
    if (!this._ensureContext()) return;
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + i * 0.05);
      g.gain.setValueAtTime(0.08, now + i * 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(now + i * 0.05);
      osc.stop(now + 0.95);
    });
  }

  playPulseEMP() {
    if (!this._ensureContext()) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.26);
    g.gain.setValueAtTime(0.15, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.34);
  }

  playVent() {
    if (!this._ensureContext()) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(580, now);
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.22);
    g.gain.setValueAtTime(0.12, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.26);
  }
}

export const sound = new SoundEngine();
