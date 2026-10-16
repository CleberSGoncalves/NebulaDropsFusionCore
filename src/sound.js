/**
 * @fileoverview Procedural Audio & Haptic System for Nebula Drops: Fusion Core
 * - Harmonic ascending pentatonic scale synthesis (C4 to C6)
 * - Combo Cascade multi-tone chimes
 * - Zen Crystal ambient lo-fi generator
 * - Web Haptics (navigator.vibrate)
 */

import { sound } from './audio.js';

export const PENTATONIC_SCALE = [
  261.63, // C4
  293.66, // D4
  329.63, // E4
  392.00, // G4
  440.00, // A4
  523.25, // C5
  587.33, // D5
  659.25, // E5
  783.99, // G5
  880.00, // A5
  1046.50 // C6
];

export function triggerHaptic(durationMs = 25) {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(durationMs);
    }
  } catch (_) {}
}

export function playCascadeChime(cascadeLevel = 2) {
  if (!sound._ensureContext()) return;
  const ctx = sound.ctx;
  const now = ctx.currentTime;
  const noteIdx = Math.min(PENTATONIC_SCALE.length - 1, Math.max(0, cascadeLevel + 1));
  const freq = PENTATONIC_SCALE[noteIdx];

  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(freq, now);
  osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.18);

  g.gain.setValueAtTime(0.22, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

  osc.connect(g);
  g.connect(sound.masterGain);
  osc.start(now);
  osc.stop(now + 0.3);

  triggerHaptic(20 + cascadeLevel * 10);
}

export function playTacticalHammerSound() {
  if (!sound._ensureContext()) return;
  const ctx = sound.ctx;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(180, now);
  osc.frequency.exponentialRampToValueAtTime(45, now + 0.2);

  g.gain.setValueAtTime(0.28, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

  osc.connect(g);
  g.connect(sound.masterGain);
  osc.start(now);
  osc.stop(now + 0.28);

  triggerHaptic(45);
}

export function playTacticalUndoSound() {
  if (!sound._ensureContext()) return;
  const ctx = sound.ctx;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(260, now);
  osc.frequency.exponentialRampToValueAtTime(520, now + 0.15);

  g.gain.setValueAtTime(0.18, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

  osc.connect(g);
  g.connect(sound.masterGain);
  osc.start(now);
  osc.stop(now + 0.22);

  triggerHaptic(25);
}

export { sound };
