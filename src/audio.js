/**
 * @fileoverview Procedural Web Audio Synthesizer for Nebula Drops: Fusion Core
 * Synthesizes all sound effects and ambient cosmic pads in real-time with zero external MP3/WAV dependencies.
 * Implements randomized pitch variation (0.95 - 1.10) for Game Feel and strict Ad-Mute isolation.
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

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.isMuted = Boolean(storage.data.muted);
    this.isAdMuted = false;
  }

  _ensureContext() {
    if (this.isAdMuted || this.isMuted) return false;
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return false;
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.65;
        this.masterGain.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return true;
    } catch (_) {
      return false;
    }
  }

  /**
   * Mutes/unmutes all audio specifically during CrazyGames Ads.
   * @param {boolean} adMuted
   */
  setAdMuted(adMuted) {
    this.isAdMuted = Boolean(adMuted);
    if (this.ctx && this.masterGain) {
      const now = this.ctx.currentTime;
      const shouldMute = this.isAdMuted || this.isMuted;
      this.masterGain.gain.setValueAtTime(shouldMute ? 0.0 : 0.65, now);
      if (this.isAdMuted && this.ctx.state === 'running') {
        this.ctx.suspend().catch(() => {});
      } else if (!this.isAdMuted && !this.isMuted && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    storage.save({ muted: this.isMuted });
    if (this.ctx && this.masterGain) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.setValueAtTime((this.isMuted || this.isAdMuted) ? 0.0 : 0.65, now);
    }
    return this.isMuted;
  }

  // ── 1. FluidCleb Interactive Splash Sounds (0.0s - 2.8s) ──────────────────
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
      g.gain.linearRampToValueAtTime(0.08, now + 0.3);
      g.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc.connect(g);
      g.connect(this.masterGain);
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
    g.gain.setValueAtTime(0.18, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc.connect(g);
    g.connect(this.masterGain);
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
      g.gain.setValueAtTime(0.09, now + i * 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
      osc.connect(g);
      g.connect(this.masterGain);
      osc.start(now + i * 0.05);
      osc.stop(now + 0.95);
    });
  }

  // ── 2. Gameplay & Physics Juice Sounds ────────────────────────────────────
  playDrop(tier = 1) {
    if (!this._ensureContext()) return;
    const now = this.ctx.currentTime;
    const pitchJitter = 0.95 + Math.random() * 0.1;
    const baseFreq = Math.max(160, 420 - tier * 24) * pitchJitter;

    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.55, now + 0.11);

    g.gain.setValueAtTime(0.14, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  playBounce(intensity = 0.4) {
    if (!this._ensureContext()) return;
    const vol = Math.min(0.12, Math.max(0.02, intensity * 0.08));
    const now = this.ctx.currentTime;
    const pitch = 0.92 + Math.random() * 0.16;

    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140 * pitch, now);
    osc.frequency.exponentialRampToValueAtTime(65 * pitch, now + 0.06);

    g.gain.setValueAtTime(vol, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  playMerge(newTier = 2, comboCount = 1) {
    if (!this._ensureContext()) return;
    const now = this.ctx.currentTime;
    const idx = Math.max(0, Math.min(TIER_FREQUENCIES.length - 1, newTier - 1));
    const pitchJitter = 0.97 + Math.random() * 0.06;
    const comboBoost = 1 + Math.min(0.35, (comboCount - 1) * 0.06);
    const rootFreq = TIER_FREQUENCIES[idx] * pitchJitter * comboBoost;

    // Harmonic triad chime
    const harmonics = [1, 1.25, 1.5];
    harmonics.forEach((mult, i) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = i === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(rootFreq * mult * 0.85, now + i * 0.025);
      osc.frequency.exponentialRampToValueAtTime(rootFreq * mult, now + i * 0.025 + 0.08);

      const duration = 0.25 + newTier * 0.025;
      g.gain.setValueAtTime(0.16 / (i + 1), now + i * 0.025);
      g.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(g);
      g.connect(this.masterGain);
      osc.start(now + i * 0.025);
      osc.stop(now + duration + 0.02);
    });

    // Sub-bass impact punch for Tier 5+ fusions
    if (newTier >= 5) {
      const sub = this.ctx.createOscillator();
      const subG = this.ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(110, now);
      sub.frequency.exponentialRampToValueAtTime(38, now + 0.22);
      subG.gain.setValueAtTime(0.24, now);
      subG.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
      sub.connect(subG);
      subG.connect(this.masterGain);
      sub.start(now);
      sub.stop(now + 0.25);
    }
  }

  playPulseEMP() {
    if (!this._ensureContext()) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(95, now);
    osc.frequency.exponentialRampToValueAtTime(480, now + 0.28);
    g.gain.setValueAtTime(0.18, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.34);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.36);
  }

  playVent() {
    if (!this._ensureContext()) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(640, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.22);
    g.gain.setValueAtTime(0.15, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.26);
  }

  playDangerAlarm() {
    if (!this._ensureContext()) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(580, now);
    osc.frequency.setValueAtTime(440, now + 0.08);
    g.gain.setValueAtTime(0.07, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  playVictory() {
    if (!this._ensureContext()) return;
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.09);
      g.gain.setValueAtTime(0.16, now + idx * 0.09);
      g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.55);
      osc.connect(g);
      g.connect(this.masterGain);
      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 0.58);
    });
  }

  playGameOver() {
    if (!this._ensureContext()) return;
    const now = this.ctx.currentTime;
    [392.0, 349.23, 311.13, 261.63].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);
      g.gain.setValueAtTime(0.12, now + idx * 0.12);
      g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.45);
      osc.connect(g);
      g.connect(this.masterGain);
      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.48);
    });
  }
}

export const sound = new SoundEngine();
