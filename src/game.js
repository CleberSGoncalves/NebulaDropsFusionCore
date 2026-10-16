/**
 * @fileoverview Main Game Engine & Full-Bleed Dynamic Renderer for Nebula Drops: Fusion Core
 * - Uses ResizeObserver on #canvas-wrap for 1:1 full-bleed rendering (ZERO "tela pequena" letterboxing)
 * - Strictly aligned with the 3-Row Flex HUD (Row 1 Top Header -> Row 2 Canvas -> Row 3 Tactical Footer)
 * - Fixed Timestep Physics Accumulator (FIXED_DT = 1/60s) for 60Hz, 144Hz, and 165Hz
 * - Transparent 1★, 2★, and 3★ progression + Instant Victory on Goal Core synthesis or 3★ Score
 */

import { FIXED_DT, PhysicsWorld } from './physics.js';
import { ORB_TIERS, SECTORS } from './levels.js';
import { sound } from './audio.js';
import { storage } from './storage.js';
import { i18n } from './i18n.js';
import { crazyGames } from './crazygames.js';
import { playCascadeChime, triggerHaptic, playTacticalHammerSound, playTacticalUndoSound } from './sound.js';
import { achievements } from './achievements.js';
import { shopManager } from './shop.js';

export function getSkinOrbColors(tier, skinId = 'default') {
  const base = ORB_TIERS[tier - 1] || ORB_TIERS[0];
  if (!skinId || skinId === 'default') {
    return { coreColor: base.coreColor, color: base.color, ringColor: base.ringColor };
  }
  if (skinId === 'cyber_void') {
    const cyberColors = [
      { coreColor: '#fdf2f8', color: '#ec4899', ringColor: '#be185d' },
      { coreColor: '#e0f2fe', color: '#06b6d4', ringColor: '#0e7490' },
      { coreColor: '#fef08a', color: '#eab308', ringColor: '#a16207' },
      { coreColor: '#f3e8ff', color: '#a855f7', ringColor: '#7e22ce' },
      { coreColor: '#fce7f3', color: '#f43f5e', ringColor: '#be123c' },
      { coreColor: '#cffafe', color: '#00f5ff', ringColor: '#0891b2' }
    ];
    return cyberColors[(tier - 1) % cyberColors.length];
  }
  if (skinId === 'zen_crystal') {
    const zenColors = [
      { coreColor: '#f0fdf4', color: '#2dd4bf', ringColor: '#0f766e' },
      { coreColor: '#dcfce7', color: '#10b981', ringColor: '#047857' },
      { coreColor: '#f5f3ff', color: '#8b5cf6', ringColor: '#6d28d9' },
      { coreColor: '#e0e7ff', color: '#6366f1', ringColor: '#4338ca' },
      { coreColor: '#fdf4ff', color: '#d946ef', ringColor: '#a21caf' },
      { coreColor: '#ecfeff', color: '#06b6d4', ringColor: '#0e7490' }
    ];
    return zenColors[(tier - 1) % zenColors.length];
  }
  if (skinId === 'solar_flare') {
    const solarColors = [
      { coreColor: '#fffbeb', color: '#f59e0b', ringColor: '#b45309' },
      { coreColor: '#fef3c7', color: '#f97316', ringColor: '#c2410c' },
      { coreColor: '#fef08a', color: '#eab308', ringColor: '#a16207' },
      { coreColor: '#fee2e2', color: '#ef4444', ringColor: '#b91c1c' },
      { coreColor: '#ffe4e6', color: '#f43f5e', ringColor: '#be123c' },
      { coreColor: '#fff7ed', color: '#fb923c', ringColor: '#ea580c' }
    ];
    return solarColors[(tier - 1) % solarColors.length];
  }
  if (skinId === 'quantum_neon') {
    const quantumColors = [
      { coreColor: '#f3e8ff', color: '#9333ea', ringColor: '#6b21a8' },
      { coreColor: '#ede9fe', color: '#8b5cf6', ringColor: '#5b21b6' },
      { coreColor: '#fae8ff', color: '#c026d3', ringColor: '#86198f' },
      { coreColor: '#f5d0fe', color: '#d946ef', ringColor: '#a21caf' },
      { coreColor: '#e0e7ff', color: '#4f46e5', ringColor: '#3730a3' },
      { coreColor: '#e0f2fe', color: '#0284c7', ringColor: '#0369a1' }
    ];
    return quantumColors[(tier - 1) % quantumColors.length];
  }
  if (skinId === 'matrix_code') {
    const matrixColors = [
      { coreColor: '#dcfce7', color: '#22c55e', ringColor: '#15803d' },
      { coreColor: '#f0fdf4', color: '#16a34a', ringColor: '#166534' },
      { coreColor: '#ecfccb', color: '#84cc16', ringColor: '#4d7c0f' },
      { coreColor: '#d1fae5', color: '#10b981', ringColor: '#047857' },
      { coreColor: '#bbf7d0', color: '#4ade80', ringColor: '#15803d' },
      { coreColor: '#bef264', color: '#65a30d', ringColor: '#3f6212' }
    ];
    return matrixColors[(tier - 1) % matrixColors.length];
  }
  return { coreColor: base.coreColor, color: base.color, ringColor: base.ringColor };
}

export class GameEngine {
  constructor(canvas, hud) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.hud = hud;

    this.isCompactLayout = false;
    this.viewW = 960;
    this.viewH = 540;
    this.orbScale = 1.0;

    this.bounds = {
      left: 260,
      right: 700,
      top: 56,
      bottom: 520,
      dangerY: 108
    };

    this.physics = new PhysicsWorld(this.bounds, {
      onFusion: (mergedOrb, newTier) => this._handleFusion(mergedOrb, newTier),
      onOverflowDanger: (ratio, secondsLeft) => this._handleOverflowDanger(ratio, secondsLeft),
      onMeltdown: (reason) => this._handleMeltdown(reason)
    });

    this.currentSectorIndex = 0;
    this.isEndless = false;
    this.gameMode = 'normal'; // 'normal' | 'overdrive' | 'time_attack'
    this.sectorStartTime = performance.now();
    this.score = 0;
    this.highestTierReached = 1;
    this.timeRemaining = 150;
    this.starsNotified = 0;
    this.victoryDelayTimer = 0;

    // Dropper Pod state
    this.dropperX = (this.bounds.left + this.bounds.right) * 0.5;
    this.dropperY = 30;
    this.currentOrbTier = 1;
    this.nextOrbTier = 2;
    this.isCurrentCatalyst = false;
    this.dropCooldown = 0;
    this.dropBufferTimer = 0;

    // Tactical abilities & Power-ups
    this.pulseUses = 2;
    this.ventUses = 2;
    this.catalystUses = 1;
    this.hammerUses = storage.data.hammerCount !== undefined ? storage.data.hammerCount : 2;
    this.undoUses = storage.data.undoCount !== undefined ? storage.data.undoCount : 2;
    this.isHammerActive = false;
    this.hasUsedHammer = false;
    this.hasUsedUndo = false;
    this.glitchIntensity = 0;

    // Combo & Danger & Cascades
    this.comboCount = 0;
    this.comboTimer = 0;
    this.cascadeCount = 0;
    this.lastFusionTime = 0;
    this.shieldTimer = 0;
    this.dangerRatio = 0;
    this.dangerSecondsLeft = 5.0;
    this.alarmCooldown = 0;
    this.reviveUsed = false;

    // Lifecycle
    this.isRunning = false;
    this.isPaused = false;
    this.isAdPaused = false;
    this.isRoundOver = false;

    // Controls
    this.keys = { left: false, right: false };
    this.isPointerDragging = false;

    // Background stars
    this.bgStars = Array.from({ length: 70 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.8 + 0.5,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 1.5 + 0.5
    }));

    this.lastFrameTime = 0;
    this.accumulator = 0;

    this._bindInputs();
    this._recalculateLayout();

    const wrap = this.canvas.parentElement;
    if (typeof ResizeObserver !== 'undefined' && wrap) {
      this.resizeObserver = new ResizeObserver(() => this._recalculateLayout());
      this.resizeObserver.observe(wrap);
    }
    window.addEventListener('resize', () => this._recalculateLayout());
  }

  _recalculateLayout() {
    const wrap = this.canvas.parentElement;
    const rect = wrap ? wrap.getBoundingClientRect() : { width: window.innerWidth, height: window.innerHeight - 120 };

    this.viewW = Math.max(280, Math.round(rect.width || window.innerWidth));
    this.viewH = Math.max(220, Math.round(rect.height || (window.innerHeight - 120)));

    // Use compact single-chamber full-width layout whenever viewport width < 760px or in Portrait
    this.isCompactLayout = this.viewW < 760 || this.viewH >= this.viewW;

    if (this.isCompactLayout) {
      const marginX = Math.max(10, Math.min(24, Math.round(this.viewW * 0.03)));
      const chamberW = Math.min(540, this.viewW - marginX * 2);
      const left = Math.round((this.viewW - chamberW) * 0.5);
      const right = left + chamberW;
      const top = 52;
      const bottom = Math.max(top + 180, this.viewH - 8);
      const dangerY = top + 52;

      this.bounds = { left, right, top, bottom, dangerY };
      this.dropperY = 26;
      this.orbScale = Math.min(1.0, Math.max(0.76, chamberW / 430));
    } else {
      // Wide Desktop Landscape: Side panels + wide central Reactor Vessel
      const chamberW = Math.min(480, Math.max(360, this.viewW - 490));
      const left = Math.round((this.viewW - chamberW) * 0.5);
      const right = left + chamberW;
      const top = 54;
      const bottom = Math.max(top + 200, this.viewH - 10);
      const dangerY = top + 54;

      this.bounds = { left, right, top, bottom, dangerY };
      this.dropperY = 28;
      this.orbScale = Math.min(1.05, Math.max(0.85, (bottom - top) / 430));
    }

    this.physics.setBounds(this.bounds, this.orbScale);
    this._clampDropperX(this.dropperX);

    // Apply high-DPI scaling 1:1 with real CSS pixels
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.floor(this.viewW * dpr);
    this.canvas.height = Math.floor(this.viewH * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  _clientToLogical(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      return { x: this.viewW * 0.5, y: this.viewH * 0.5 };
    }
    return {
      x: ((clientX - rect.left) / rect.width) * this.viewW,
      y: ((clientY - rect.top) / rect.height) * this.viewH
    };
  }

  _bindInputs() {
    window.addEventListener('keydown', (e) => {
      if (this.isPaused || this.isAdPaused || this.isRoundOver) return;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = true;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = true;
      if (e.code === 'Space' || e.code === 'ArrowDown' || e.code === 'KeyS') {
        this.requestDrop();
      }
      if (e.code === 'KeyF') this.useGravitationalPulse();
      if (e.code === 'KeyV') this.usePlasmaVent();
      if (e.code === 'KeyC') this.useCatalyst();
      if (e.code === 'KeyH') this.useHammer();
      if (e.code === 'KeyU') this.useUndo();
      if (e.code === 'KeyM') this.toggleGameMode();
      if (e.code === 'KeyR') this.loadSector(this.currentSectorIndex, this.isEndless, this.gameMode);
      if (e.code === 'KeyP' || e.code === 'Escape') {
        this.hud.openPauseModal();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = false;
    });

    // Touch & Mouse aiming directly on the canvas
    this.canvas.addEventListener('pointerdown', (e) => {
      if (this.isPaused || this.isAdPaused || this.isRoundOver) return;
      const pt = this._clientToLogical(e.clientX, e.clientY);

      if (this.isHammerActive) {
        const clickedOrb = this.physics.orbs.find((o) => {
          return Math.hypot(o.x - pt.x, o.y - pt.y) <= o.radius * 1.35;
        });
        if (clickedOrb) {
          this.physics.removeOrb(clickedOrb);
          this.hammerUses = Math.max(0, this.hammerUses - 1);
          storage.save({ hammerCount: this.hammerUses });
          this.isHammerActive = false;
          this.hasUsedHammer = true;
          playTacticalHammerSound();
          if (this.hasUsedUndo) achievements.unlock('tactical_genius');
          this.hud.updateTacticalButtons(this.pulseUses, this.ventUses, this.catalystUses, this.hammerUses, this.undoUses);
          const isPt = i18n.lang === 'pt';
          this.physics.addFloatingText(isPt ? '🔨 VAPORIZADO!' : '🔨 VAPORIZED!', clickedOrb.x, clickedOrb.y - 12, '#f43f5e', 1.2);
          return;
        }
      }

      this.isPointerDragging = true;
      this._clampDropperX(pt.x);
    });

    window.addEventListener('pointermove', (e) => {
      if (this.isPaused || this.isAdPaused || this.isRoundOver) return;
      const pt = this._clientToLogical(e.clientX, e.clientY);
      if (this.isPointerDragging || (pt.x >= this.bounds.left - 60 && pt.x <= this.bounds.right + 60)) {
        this._clampDropperX(pt.x);
      }
    });

    window.addEventListener('pointerup', (e) => {
      if (!this.isPointerDragging) return;
      this.isPointerDragging = false;
      if (this.isPaused || this.isAdPaused || this.isRoundOver) return;
      if (this.isHammerActive) return;
      const pt = this._clientToLogical(e.clientX, e.clientY);
      this._clampDropperX(pt.x);
      this.requestDrop();
    });

    // Tab-blur safety
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.isRunning && !this.isPaused && !this.isRoundOver && !this.isAdPaused) {
        this.hud.openPauseModal();
      }
    });
  }

  _clampDropperX(targetX) {
    const r = Math.max(12, Math.round(ORB_TIERS[this.currentOrbTier - 1].radius * this.orbScale));
    this.dropperX = Math.max(this.bounds.left + r + 4, Math.min(this.bounds.right - r - 4, targetX));
  }

  start() {
    this.isRunning = true;
    this._recalculateLayout();
    const startIdx = Math.max(0, Math.min(SECTORS.length - 1, (storage.data.maxLevel || 1) - 1));
    this.loadSector(startIdx, false, this.gameMode);
    this.lastFrameTime = performance.now();
    requestAnimationFrame((ts) => this._loop(ts));
  }

  setGameMode(newMode) {
    this.gameMode = newMode;
    this.loadSector(this.currentSectorIndex, this.isEndless, this.gameMode);
  }

  toggleGameMode() {
    const modes = ['normal', 'overdrive', 'time_attack'];
    const nextIdx = (modes.indexOf(this.gameMode) + 1) % modes.length;
    this.setGameMode(modes[nextIdx]);
  }

  loadSector(sectorIndex = 0, endless = false, mode = 'normal') {
    // Guarantee clean state & unmute audio so no prior transition can ever freeze a sector
    this.isAdPaused = false;
    this.isPaused = false;
    this.isRoundOver = false;
    this.victoryDelayTimer = 0;
    sound.setAdMuted(false);

    this.isEndless = Boolean(endless);
    this.gameMode = mode;
    this.sectorStartTime = performance.now();
    this.currentSectorIndex = Math.max(0, Math.min(SECTORS.length - 1, sectorIndex));
    const sec = SECTORS[this.currentSectorIndex];

    this._recalculateLayout();
    this.physics.clear();

    if (this.gameMode === 'overdrive') {
      this.physics.gravity = 1050; // 1.5x accelerated gravity
      this.physics.restitution = 0.4;
      this.timeRemaining = this.isEndless ? 9999 : Math.round(sec.timeLimit * 0.75);
    } else if (this.gameMode === 'time_attack') {
      this.physics.gravity = 750;
      this.physics.restitution = 0.35;
      this.timeRemaining = 90.0; // Frenetic 90 seconds
    } else {
      this.physics.gravity = this.isEndless ? 720 : sec.gravity;
      this.physics.restitution = this.isEndless ? 0.35 : sec.restitution;
      this.timeRemaining = this.isEndless ? 9999 : sec.timeLimit;
    }

    this.score = 0;
    this.highestTierReached = 1;
    this.starsNotified = 0;
    this.comboCount = 0;
    this.comboTimer = 0;
    this.cascadeCount = 0;
    this.lastFusionTime = 0;
    this.shieldTimer = 0;
    this.dangerRatio = 0;
    this.dangerSecondsLeft = 5.0;
    this.reviveUsed = false;
    this.glitchIntensity = 0;

    this.pulseUses = 2;
    this.ventUses = 2;
    this.catalystUses = 1;
    this.hammerUses = storage.data.hammerCount !== undefined ? storage.data.hammerCount : 2;
    this.undoUses = storage.data.undoCount !== undefined ? storage.data.undoCount : 2;
    this.isHammerActive = false;
    this.isCurrentCatalyst = false;

    this.currentOrbTier = 1;
    this.nextOrbTier = 2;
    this.dropperX = (this.bounds.left + this.bounds.right) * 0.5;
    this.dropCooldown = 0.2;
    this.dropBufferTimer = 0;

    // Spawn grounded starter orbs on the chamber floor
    const centerX = (this.bounds.left + this.bounds.right) * 0.5;
    if (!this.isEndless && Array.isArray(sec.initialOrbs)) {
      sec.initialOrbs.forEach((initOrb) => {
        const ox = centerX + initOrb.xOffset * this.orbScale;
        const cfg = ORB_TIERS[initOrb.tier - 1];
        const oy = this.bounds.bottom - Math.round(cfg.radius * this.orbScale) - 2;
        this.physics.spawnOrb(initOrb.tier, ox, oy, false);
        if (initOrb.tier > this.highestTierReached) {
          this.highestTierReached = initOrb.tier;
        }
      });
    }

    this.hud.setDangerVisible(false, false, 5.0);
    this.hud.updateTacticalButtons(this.pulseUses, this.ventUses, this.catalystUses, this.hammerUses, this.undoUses);
    sound.setTheme(sec.theme || 'default');
    sound.startAmbientMusic();
    this._syncHUD();
    crazyGames.gameplayStart();
  }

  completeSectorIfEligible() {
    if (this.isEndless || this.isRoundOver) return;
    const sec = SECTORS[this.currentSectorIndex];
    if (this.score >= sec.star1Score || this.highestTierReached >= sec.targetTier) {
      this._triggerVictory();
    }
  }

  requestDrop() {
    if (this.isPaused || this.isAdPaused || this.isRoundOver || this.victoryDelayTimer > 0) return;
    if (this.dropCooldown <= 0) {
      this._executeDrop();
    } else {
      this.dropBufferTimer = 0.15;
    }
  }

  _executeDrop() {
    this.dropCooldown = 0.38;
    this.dropBufferTimer = 0;

    const spawned = this.physics.spawnOrb(
      this.currentOrbTier,
      this.dropperX,
      this.bounds.top + 14,
      this.isCurrentCatalyst
    );
    spawned.vy = this.gameMode === 'overdrive' ? 140 : 90;
    sound.playDrop(this.currentOrbTier);

    this.isCurrentCatalyst = false;
    this.currentOrbTier = this.nextOrbTier;
    const maxSpawnTier = Math.min(3, Math.max(2, this.highestTierReached - 1));
    this.nextOrbTier = Math.floor(Math.random() * maxSpawnTier) + 1;
    this._clampDropperX(this.dropperX);
    this._syncHUD();
  }

  useGravitationalPulse() {
    if (this.pulseUses <= 0 || this.isPaused || this.isRoundOver) return;
    this.pulseUses--;
    this.physics.triggerGravitationalPulse();
    this.hud.updateTacticalButtons(this.pulseUses, this.ventUses, this.catalystUses, this.hammerUses, this.undoUses);
  }

  usePlasmaVent() {
    if (this.ventUses <= 0 || this.isPaused || this.isRoundOver || this.physics.orbs.length === 0) return;
    const removed = this.physics.triggerPlasmaVent();
    if (removed > 0) {
      this.ventUses--;
      this.hud.updateTacticalButtons(this.pulseUses, this.ventUses, this.catalystUses, this.hammerUses, this.undoUses);
    }
  }

  useCatalyst() {
    if (this.catalystUses <= 0 || this.isCurrentCatalyst || this.isPaused || this.isRoundOver) return;
    this.catalystUses--;
    this.isCurrentCatalyst = true;
    sound.playFluidClebFusion();
    this.hud.updateTacticalButtons(this.pulseUses, this.ventUses, this.catalystUses, this.hammerUses, this.undoUses);
  }

  useHammer() {
    if (this.isPaused || this.isRoundOver) return;
    if (this.hammerUses <= 0) {
      // Prompt rewarded ad to recharge 2 hammers
      crazyGames.requestRewardedAd(
        'double_shards',
        () => {
          this.hammerUses += 2;
          storage.save({ hammerCount: this.hammerUses });
          this.hud.updateTacticalButtons(this.pulseUses, this.ventUses, this.catalystUses, this.hammerUses, this.undoUses);
        },
        () => {}
      );
      return;
    }
    this.isHammerActive = !this.isHammerActive;
    const isPt = i18n.lang === 'pt';
    const msg = this.isHammerActive
      ? (isPt ? '🔨 CLIQUE EM UM ORBE PARA VAPORIZAR' : '🔨 TAP ANY ORB TO VAPORIZE')
      : (isPt ? '🔨 MARTELO CANCELADO' : '🔨 HAMMER CANCELLED');
    this.physics.addFloatingText(msg, (this.bounds.left + this.bounds.right) * 0.5, this.bounds.top + 70, '#f43f5e', 1.05);
  }

  useUndo() {
    if (this.isPaused || this.isRoundOver) return;
    if (this.undoUses <= 0) {
      // Prompt rewarded ad to recharge 2 undos
      crazyGames.requestRewardedAd(
        'double_shards',
        () => {
          this.undoUses += 2;
          storage.save({ undoCount: this.undoUses });
          this.hud.updateTacticalButtons(this.pulseUses, this.ventUses, this.catalystUses, this.hammerUses, this.undoUses);
        },
        () => {}
      );
      return;
    }
    if (this.physics.orbs.length === 0) return;

    const lastOrb = this.physics.orbs[this.physics.orbs.length - 1];
    this.physics.removeOrb(lastOrb);
    this.undoUses = Math.max(0, this.undoUses - 1);
    storage.save({ undoCount: this.undoUses });
    this.hasUsedUndo = true;
    playTacticalUndoSound();
    if (this.hasUsedHammer) achievements.unlock('tactical_genius');
    this.hud.updateTacticalButtons(this.pulseUses, this.ventUses, this.catalystUses, this.hammerUses, this.undoUses);
    const isPt = i18n.lang === 'pt';
    this.physics.addFloatingText(isPt ? '↩️ DESFEITO!' : '↩️ UNDONE!', lastOrb.x, lastOrb.y - 12, '#38bdf8', 1.1);
  }

  reviveWithEmergencyShield() {
    this.reviveUsed = true;
    this.isRoundOver = false;
    this.isPaused = false;
    this.isAdPaused = false;
    this.timeRemaining += 30;
    this.shieldTimer = 3.5;
    this.physics.clearTopOverflowOrbs();
    sound.playVictory();
    this.hud.setDangerVisible(false, true, 5.0);
    this._syncHUD();
    crazyGames.gameplayStart();
  }

  _handleFusion(mergedOrb, newTier) {
    if (this.comboTimer > 0) {
      this.comboCount++;
    } else {
      this.comboCount = 1;
    }
    this.comboTimer = 2.4;

    // Combo Cascade Rapid Trigger Detection (< 0.85s)
    const now = performance.now() / 1000;
    if (now - this.lastFusionTime < 0.85) {
      this.cascadeCount++;
    } else {
      this.cascadeCount = 1;
    }
    this.lastFusionTime = now;

    let cascadeMult = 1;
    if (this.cascadeCount >= 4) {
      cascadeMult = 10;
      achievements.unlock('combo_cascade');
    } else if (this.cascadeCount === 3) {
      cascadeMult = 5;
    } else if (this.cascadeCount === 2) {
      cascadeMult = 2;
    }

    if (this.cascadeCount > 1) {
      playCascadeChime(this.cascadeCount);
      triggerHaptic(30 + this.cascadeCount * 12);
      this.physics.cameraShaker.addTrauma(0.18 * this.cascadeCount);
      this.glitchIntensity = Math.min(1.0, this.glitchIntensity + 0.3 * this.cascadeCount);
    }

    const cfg = ORB_TIERS[newTier - 1];
    const comboMult = 1 + (this.comboCount - 1) * 0.25;
    const permMult = achievements.getPermanentMultiplier();
    const modeMult = this.gameMode === 'overdrive' ? 1.5 : 1.0;
    const pointsAwarded = Math.round(cfg.points * comboMult * cascadeMult * permMult * modeMult);

    this.score += pointsAwarded;
    storage.recordHighScore(this.score, this.gameMode);

    if (newTier > this.highestTierReached) {
      this.highestTierReached = newTier;
    }

    // Check tier synthesis achievements
    achievements.unlock('first_fusion');
    if (newTier >= 5) achievements.unlock('tier5_reach');
    if (newTier >= 8) achievements.unlock('tier8_reach');
    if (newTier >= 11) achievements.unlock('omega_core');

    // Time Attack Bonus (+3.0s per merge)
    if (this.gameMode === 'time_attack') {
      this.timeRemaining = Math.min(300, this.timeRemaining + 3.0);
      this.physics.addFloatingText('+3s TIME!', mergedOrb.x, mergedOrb.y - 28, '#22c55e', 1.05);
    }

    sound.playMerge(newTier, this.comboCount);

    const prevSymbol = ORB_TIERS[newTier - 2] ? ORB_TIERS[newTier - 2].symbol : 'H+';
    const popupText = this.cascadeCount > 1
      ? `💥 CASCATA x${cascadeMult}! ${prevSymbol}+${prevSymbol} = ${cfg.symbol} (+${pointsAwarded} pts)`
      : this.comboCount > 1
        ? `${prevSymbol}+${prevSymbol} = ${cfg.symbol} (+${pointsAwarded} pts, ${this.comboCount}x!)`
        : `${prevSymbol}+${prevSymbol} = ${cfg.symbol} (+${pointsAwarded} pts)`;
    this.physics.addFloatingText(popupText, mergedOrb.x, mergedOrb.y - 12, cfg.color, this.cascadeCount > 1 ? 1.25 : 1.1);

    if (!this.isEndless && !this.isRoundOver && this.victoryDelayTimer <= 0) {
      const sec = SECTORS[this.currentSectorIndex];
      const isPt = i18n.lang === 'pt';

      // 1. Did the player synthesize the Sector's Goal Core (targetTier)?
      if (newTier >= sec.targetTier) {
        const goalBonus = Math.max(100, sec.star3Score - this.score);
        this.score += goalBonus;
        storage.recordHighScore(this.score, this.gameMode);
        this.physics.addFloatingText(
          isPt ? `★ NÚCLEO ALVO (${cfg.symbol}) CRIADO! ★★★` : `★ GOAL CORE (${cfg.symbol}) SYNTHESIZED! ★★★`,
          (this.bounds.left + this.bounds.right) * 0.5,
          mergedOrb.y - 36,
          '#facc15',
          1.25
        );
        this._syncHUD();
        this.victoryDelayTimer = 0.55;
        return;
      }

      // 2. Did the player reach 3-Star Master Score (star3Score)?
      if (this.score >= sec.star3Score) {
        this.physics.addFloatingText(
          isPt ? '★★★ PONTUAÇÃO MÁXIMA ALCANÇADA!' : '★★★ 3-STAR MASTER SCORE REACHED!',
          (this.bounds.left + this.bounds.right) * 0.5,
          mergedOrb.y - 36,
          '#facc15',
          1.25
        );
        this._syncHUD();
        this.victoryDelayTimer = 0.45;
        return;
      }

      // 3. Notify when 2-Star or 1-Star threshold is crossed!
      if (this.score >= sec.star2Score && this.starsNotified < 2) {
        this.starsNotified = 2;
        this.physics.addFloatingText(
          isPt ? '★★ 2 ESTRELAS! CONTINUE PARA ★★★ OU CONCLUA NO TOPO!' : '★★ 2 STARS EARNED! PUSH FOR ★★★ OR FINISH AT TOP!',
          (this.bounds.left + this.bounds.right) * 0.5,
          this.bounds.top + 80,
          '#fde047',
          1.05
        );
      } else if (this.score >= sec.star1Score && this.starsNotified < 1) {
        this.starsNotified = 1;
        this.physics.addFloatingText(
          isPt ? '★ 1 ESTRELA! BOTÃO CONCLUIR LIBERADO NO TOPO!' : '★ 1 STAR! FINISH BUTTON UNLOCKED IN TOP BAR!',
          (this.bounds.left + this.bounds.right) * 0.5,
          this.bounds.top + 80,
          '#4ade80',
          1.05
        );
      }
    }

    this._syncHUD();
  }

  _handleOverflowDanger(ratio, secondsLeft) {
    this.dangerRatio = ratio;
    this.dangerSecondsLeft = secondsLeft;
    if (this.shieldTimer > 0) {
      this.hud.setDangerVisible(false, true, secondsLeft);
    } else {
      this.hud.setDangerVisible(ratio > 0.1, false, secondsLeft);
    }
  }

  _handleMeltdown(reason) {
    if (this.isRoundOver) return;

    // If the player already earned at least 1★ when timeout happens, they pass the sector!
    if (!this.isEndless && reason === 'timeout') {
      const sec = SECTORS[this.currentSectorIndex];
      if (this.score >= sec.star1Score || this.highestTierReached >= sec.targetTier) {
        this._triggerVictory();
        return;
      }
    }

    this.isRoundOver = true;
    crazyGames.gameplayStop();
    sound.playGameOver();

    storage.recordHighScore(this.score, this.gameMode);
    if (this.gameMode === 'overdrive' && this.score >= 2000) {
      achievements.unlock('overdrive_survivor');
    }
    if (this.gameMode === 'time_attack' && this.score >= 3000) {
      achievements.unlock('time_attack_master');
    }

    this.hud.openGameOverModal({
      reason,
      score: this.score,
      canRevive: !this.reviveUsed
    });
  }

  _triggerVictory() {
    if (this.isRoundOver) return;
    this.isRoundOver = true;
    this.victoryDelayTimer = 0;
    crazyGames.gameplayStop();
    crazyGames.happyTime();
    crazyGames.notifyLevelCompleted();
    sound.playVictory();

    const sec = SECTORS[this.currentSectorIndex];
    let stars = 1;
    if (this.score >= sec.star2Score) stars = 2;
    if (this.score >= sec.star3Score || this.highestTierReached >= sec.targetTier) stars = 3;

    // Achievements check: speed runner (<45s)
    const elapsedSec = (performance.now() - this.sectorStartTime) / 1000;
    if (elapsedSec <= 45) {
      achievements.unlock('speed_runner');
    }

    // Achievements check: 3 stars in at least 5 sectors
    let threeStarCount = 0;
    Object.values(storage.data.stars || {}).forEach((s) => {
      if (Number(s) >= 3) threeStarCount++;
    });
    if (stars === 3 && (Number(storage.data.stars[sec.id]) || 0) < 3) {
      threeStarCount++;
    }
    if (threeStarCount >= 5) {
      achievements.unlock('three_stars_5');
    }

    let shards = sec.shardReward * stars;
    if (this.gameMode === 'overdrive') {
      shards *= 3; // 3x shards in Overdrive mode
    }

    storage.recordSectorWin(sec.id, this.score, stars, shards);
    storage.recordHighScore(this.score, this.gameMode);

    if (this.gameMode === 'overdrive' && this.score >= 2000) {
      achievements.unlock('overdrive_survivor');
    }
    if (this.gameMode === 'time_attack' && this.score >= 3000) {
      achievements.unlock('time_attack_master');
    }

    this.hud.openVictoryModal({
      sectorId: sec.id,
      score: this.score,
      starsEarned: stars,
      shardsEarned: shards
    });
  }

  _syncHUD() {
    const sec = SECTORS[this.currentSectorIndex];
    this.hud.updateStatus({
      sectorId: sec.id,
      isEndless: this.isEndless,
      score: this.score,
      targetScore: sec.targetScore,
      star1Score: sec.star1Score,
      star2Score: sec.star2Score,
      star3Score: sec.star3Score,
      timeRemaining: this.timeRemaining,
      nextTier: this.nextOrbTier,
      targetTier: sec.targetTier
    });
  }

  _loop(timestamp) {
    if (!this.isRunning) return;

    const rawDt = Math.min(0.1, Math.max(0, (timestamp - this.lastFrameTime) / 1000));
    this.lastFrameTime = timestamp;

    if (!this.isPaused && !this.isAdPaused && !this.isRoundOver) {
      this.accumulator += rawDt;
      while (this.accumulator >= FIXED_DT) {
        this._fixedUpdate(FIXED_DT);
        this.accumulator -= FIXED_DT;
      }
    }

    this._render(timestamp / 1000);
    requestAnimationFrame((ts) => this._loop(ts));
  }

  _fixedUpdate(dt) {
    if (this.victoryDelayTimer > 0) {
      this.victoryDelayTimer -= dt;
      this.physics.step(dt, true);
      if (this.victoryDelayTimer <= 0) {
        this._triggerVictory();
      }
      return;
    }

    const moveSpeed = 380;
    if (this.keys.left) this._clampDropperX(this.dropperX - moveSpeed * dt);
    if (this.keys.right) this._clampDropperX(this.dropperX + moveSpeed * dt);

    if (this.dropCooldown > 0) {
      this.dropCooldown = Math.max(0, this.dropCooldown - dt);
    }
    if (this.dropBufferTimer > 0) {
      this.dropBufferTimer = Math.max(0, this.dropBufferTimer - dt);
      if (this.dropCooldown <= 0) {
        this._executeDrop();
      }
    }

    if (this.comboTimer > 0) {
      this.comboTimer = Math.max(0, this.comboTimer - dt);
      if (this.comboTimer <= 0) this.comboCount = 0;
    }

    if (this.shieldTimer > 0) {
      this.shieldTimer = Math.max(0, this.shieldTimer - dt);
      if (this.shieldTimer <= 0) {
        this.hud.setDangerVisible(this.dangerRatio > 0.1, false, this.dangerSecondsLeft);
      }
    }

    if (this.dangerRatio > 0.3 && this.shieldTimer <= 0) {
      this.alarmCooldown -= dt;
      if (this.alarmCooldown <= 0) {
        sound.playDangerAlarm();
        this.alarmCooldown = 0.7;
      }
    }

    if (!this.isEndless) {
      this.timeRemaining -= dt;
      if (this.timeRemaining <= 0) {
        this.timeRemaining = 0;
        this._syncHUD();
        this._handleMeltdown('timeout');
        return;
      }
    }

    this.physics.step(dt, this.shieldTimer > 0);
    this._syncHUD();
  }

  _render(timeSec) {
    const ctx = this.ctx;
    ctx.save();

    const w = this.viewW;
    const h = this.viewH;

    // Deep orbital background
    const bgGrad = ctx.createRadialGradient(w * 0.5, h * 0.5, 40, w * 0.5, h * 0.5, Math.max(w, h) * 0.75);
    bgGrad.addColorStop(0, '#091836');
    bgGrad.addColorStop(0.6, '#040b1a');
    bgGrad.addColorStop(1, '#02050e');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Cosmic stars
    for (const st of this.bgStars) {
      const alpha = 0.2 + 0.45 * Math.sin(timeSec * st.speed + st.phase);
      ctx.fillStyle = `rgba(186, 230, 253, ${alpha})`;
      ctx.beginPath();
      ctx.arc(st.x * w, st.y * h, st.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Apply Camera Shake (Trauma² offset & roll)
    const shaker = this.physics.cameraShaker;
    ctx.translate(w * 0.5 + shaker.offsetX, h * 0.5 + shaker.offsetY);
    ctx.rotate(shaker.angle);
    ctx.translate(-w * 0.5, -h * 0.5);

    // Render side panels ONLY on wide Desktop Landscape
    if (!this.isCompactLayout) {
      this._renderEvolutionPanel(ctx, timeSec);
      this._renderTelemetryPanel(ctx, timeSec);
    }

    // Central Containment Vessel & Trajectory Line
    this._renderContainmentVessel(ctx, timeSec);

    // Active Orbs
    for (const orb of this.physics.orbs) {
      this._renderOrb(ctx, orb, timeSec);
    }

    // Effects & Popups
    this._renderEffects(ctx);

    ctx.restore();
  }

  _renderContainmentVessel(ctx, timeSec) {
    const { left, right, top, bottom, dangerY } = this.bounds;
    const width = right - left;
    const height = bottom - top;
    const sec = SECTORS[this.currentSectorIndex];
    const isCyber = sec.theme === 'cyber_void';
    const isZen = sec.theme === 'zen_crystal';

    // Vessel interior glass
    const glassGrad = ctx.createLinearGradient(left, top, left, bottom);
    if (isCyber) {
      glassGrad.addColorStop(0, 'rgba(24, 7, 36, 0.7)');
      glassGrad.addColorStop(1, 'rgba(8, 2, 18, 0.92)');
    } else if (isZen) {
      glassGrad.addColorStop(0, 'rgba(6, 28, 36, 0.65)');
      glassGrad.addColorStop(1, 'rgba(2, 16, 22, 0.9)');
    } else {
      glassGrad.addColorStop(0, 'rgba(8, 22, 48, 0.6)');
      glassGrad.addColorStop(1, 'rgba(3, 10, 24, 0.88)');
    }
    ctx.fillStyle = glassGrad;
    ctx.fillRect(left, top, width, height);

    // Subtle magnetic grid
    ctx.strokeStyle = isCyber
      ? 'rgba(236, 72, 153, 0.12)'
      : isZen
        ? 'rgba(45, 212, 191, 0.1)'
        : 'rgba(56, 189, 248, 0.08)';
    ctx.lineWidth = 1;
    const step = 42;
    for (let gx = left + step; gx < right; gx += step) {
      ctx.beginPath();
      ctx.moveTo(gx, top);
      ctx.lineTo(gx, bottom);
      ctx.stroke();
    }
    for (let gy = top + step; gy < bottom; gy += step) {
      ctx.beginPath();
      ctx.moveTo(left, gy);
      ctx.lineTo(right, gy);
      ctx.stroke();
    }

    // Clear subtle fusion chain watermark at the top of the chamber glass
    this._renderChamberWatermarkGuide(ctx, left, right, top);

    // Trajectory Line & Dropper Pod
    if (!this.isRoundOver) {
      const currentCfg = ORB_TIERS[this.currentOrbTier - 1];
      const previewR = Math.max(12, Math.round(currentCfg.radius * this.orbScale));
      const skinColors = getSkinOrbColors(this.currentOrbTier, shopManager.getEquippedSkinId());
      ctx.save();
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = this.isCurrentCatalyst ? '#facc15' : `${skinColors.color}88`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(this.dropperX, this.dropperY + previewR);
      ctx.lineTo(this.dropperX, bottom - 4);
      ctx.stroke();
      ctx.restore();

      // Dropper Pod Claw
      ctx.save();
      ctx.strokeStyle = isCyber ? '#ec4899' : isZen ? '#2dd4bf' : '#00f5ff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(this.dropperX - 18, this.dropperY - 10);
      ctx.lineTo(this.dropperX, this.dropperY - 18);
      ctx.lineTo(this.dropperX + 18, this.dropperY - 10);
      ctx.stroke();
      ctx.restore();

      // Preview Orb
      if (this.dropCooldown <= 0.15) {
        this._renderPreviewOrb(ctx, this.dropperX, this.dropperY, this.currentOrbTier, this.isCurrentCatalyst, timeSec);
      }
    }

    // Danger Laser Line
    ctx.save();
    const isDanger = this.dangerRatio > 0.1;
    ctx.setLineDash([10, 6]);
    ctx.strokeStyle = this.shieldTimer > 0
      ? '#00f5ff'
      : isDanger
        ? `rgba(239, 68, 68, ${0.7 + 0.3 * Math.sin(timeSec * 16)})`
        : 'rgba(239, 68, 68, 0.45)';
    ctx.lineWidth = isDanger ? 3 : 2;
    ctx.beginPath();
    ctx.moveTo(left + 2, dangerY);
    ctx.lineTo(right - 2, dangerY);
    ctx.stroke();
    ctx.restore();

    // Glowing Containment Walls
    ctx.save();
    const wallColor = this.shieldTimer > 0
      ? '#00f5ff'
      : isCyber
        ? '#ec4899'
        : isZen
          ? '#2dd4bf'
          : '#38bdf8';
    ctx.shadowColor = wallColor;
    ctx.shadowBlur = 12;
    ctx.strokeStyle = wallColor;
    ctx.lineWidth = 4;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(left, top - 16);
    ctx.lineTo(left, bottom);
    ctx.lineTo(right, bottom);
    ctx.lineTo(right, top - 16);
    ctx.stroke();
    ctx.restore();
  }

  _renderChamberWatermarkGuide(ctx, left, right, top) {
    const sec = SECTORS[this.currentSectorIndex];
    const centerX = (left + right) * 0.5;
    const y = top + 24;

    ctx.save();
    ctx.font = "800 10.5px 'Montserrat', sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const maxShow = Math.min(ORB_TIERS.length, Math.max(5, sec.targetTier));
    const chainStr = ORB_TIERS.slice(0, maxShow)
      .map((t) => (t.tier === sec.targetTier && !this.isEndless ? `[★${t.symbol}]` : t.symbol))
      .join(' ➔ ');

    ctx.fillStyle = 'rgba(148, 163, 184, 0.55)';
    ctx.fillText(chainStr, centerX, y);
    ctx.restore();
  }

  _renderPreviewOrb(ctx, x, y, tier, isCatalyst, timeSec, customScale = null) {
    const cfg = ORB_TIERS[tier - 1];
    const skinColors = getSkinOrbColors(tier, shopManager.getEquippedSkinId());
    ctx.save();
    ctx.translate(x, y);
    const scale = customScale !== null ? customScale : this.orbScale;
    const r = Math.max(12, Math.round(cfg.radius * scale));

    const grad = ctx.createRadialGradient(-r * 0.25, -r * 0.25, r * 0.1, 0, 0, r);
    if (isCatalyst) {
      const hue = (timeSec * 140) % 360;
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.5, `hsl(${hue}, 95%, 60%)`);
      grad.addColorStop(1, '#facc15');
    } else {
      grad.addColorStop(0, skinColors.coreColor);
      grad.addColorStop(0.55, skinColors.color);
      grad.addColorStop(1, skinColors.ringColor);
    }

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    ctx.fillStyle = '#020617';
    ctx.font = `900 ${Math.max(10, Math.round(r * 0.52))}px 'Montserrat', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(isCatalyst ? '★' : cfg.symbol, 0, 1);
    ctx.restore();
  }

  _renderOrb(ctx, orb, timeSec) {
    ctx.save();
    let drawX = orb.x;
    let drawY = orb.y;

    // Apply Cyber Void Glitch Distortion if active
    if (this.glitchIntensity > 0) {
      drawX += (Math.random() - 0.5) * 8 * this.glitchIntensity;
      this.glitchIntensity = Math.max(0, this.glitchIntensity - 0.02);
    }

    ctx.translate(drawX, drawY);
    ctx.scale(orb.scaleX, orb.scaleY);
    ctx.rotate(orb.rotation);

    const r = orb.radius;
    const skinColors = getSkinOrbColors(orb.tier, shopManager.getEquippedSkinId());

    const grad = ctx.createRadialGradient(-r * 0.28, -r * 0.28, r * 0.12, 0, 0, r);
    if (orb.isCatalyst) {
      const hue = (timeSec * 160) % 360;
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.5, `hsl(${hue}, 95%, 60%)`);
      grad.addColorStop(1, '#ca8a04');
    } else {
      grad.addColorStop(0, skinColors.coreColor);
      grad.addColorStop(0.6, skinColors.color);
      grad.addColorStop(1, skinColors.ringColor);
    }

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = orb.overflowTime > 0.2 ? '#ef4444' : 'rgba(255, 255, 255, 0.75)';
    ctx.lineWidth = orb.overflowTime > 0.2 ? 3 : 2;
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.38)';
    ctx.beginPath();
    ctx.ellipse(-r * 0.32, -r * 0.34, r * 0.26, r * 0.14, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#020617';
    ctx.font = `900 ${Math.max(10, Math.round(r * 0.48))}px 'Montserrat', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(orb.symbol, 0, 1);

    ctx.restore();
  }

  _renderEvolutionPanel(ctx, timeSec) {
    const panelW = Math.min(230, Math.max(180, this.bounds.left - 24));
    const panelX = Math.max(12, Math.round((this.bounds.left - panelW) * 0.5));
    const panelY = this.bounds.top;
    const panelH = this.bounds.bottom - this.bounds.top;

    ctx.save();
    ctx.fillStyle = 'rgba(7, 15, 32, 0.84)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.28)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(panelX, panelY, panelW, panelH, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = "800 10.5px 'Montserrat', sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText(i18n.t('evolutionChain'), panelX + panelW * 0.5, panelY + 20);

    const sec = SECTORS[this.currentSectorIndex];
    const rowSpacing = Math.max(22, Math.min(34, (panelH - 36) / ORB_TIERS.length));

    ORB_TIERS.forEach((t, idx) => {
      const rowY = panelY + 38 + idx * rowSpacing;
      const isTarget = !this.isEndless && t.tier === sec.targetTier;
      const isReached = t.tier <= this.highestTierReached;

      if (isTarget) {
        ctx.fillStyle = 'rgba(250, 204, 21, 0.16)';
        ctx.fillRect(panelX + 6, rowY - rowSpacing * 0.42, panelW - 12, rowSpacing * 0.84);
      }

      ctx.fillStyle = isReached ? t.color : 'rgba(148, 163, 184, 0.3)';
      ctx.beginPath();
      ctx.arc(panelX + 22, rowY, 8.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#020617';
      ctx.font = "900 7.5px 'Montserrat', sans-serif";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(t.symbol, panelX + 22, rowY + 0.5);

      ctx.textAlign = 'left';
      ctx.fillStyle = isTarget ? '#facc15' : isReached ? '#f8fafc' : '#64748b';
      ctx.font = "700 10px 'Montserrat', sans-serif";
      const name = i18n.getTierName(t.tier);
      ctx.fillText(`T${t.tier} ${name.slice(0, 14)}`, panelX + 38, rowY);

      ctx.textAlign = 'right';
      ctx.fillStyle = isTarget ? '#facc15' : '#38bdf8';
      ctx.font = "800 9.5px 'Montserrat', sans-serif";
      ctx.fillText(isTarget ? '★ ALVO' : `+${t.points}`, panelX + panelW - 10, rowY);
    });

    ctx.restore();
  }

  _renderTelemetryPanel(ctx, timeSec) {
    const rightSpace = this.viewW - this.bounds.right;
    const panelW = Math.min(230, Math.max(180, rightSpace - 24));
    const panelX = this.bounds.right + Math.max(12, Math.round((rightSpace - panelW) * 0.5));
    const panelY = this.bounds.top;
    const panelH = this.bounds.bottom - this.bounds.top;

    ctx.save();
    ctx.fillStyle = 'rgba(7, 15, 32, 0.84)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.28)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(panelX, panelY, panelW, panelH, 12);
    ctx.fill();
    ctx.stroke();

    const sec = SECTORS[this.currentSectorIndex];
    const centerX = panelX + panelW * 0.5;
    const isPt = i18n.lang === 'pt';

    ctx.fillStyle = '#00f5ff';
    ctx.font = "900 12px 'Montserrat', sans-serif";
    ctx.textAlign = 'center';
    const secName = this.isEndless
      ? i18n.t('endlessMode')
      : (isPt ? sec.namePt : sec.nameEn).toUpperCase();
    ctx.fillText(secName, centerX, panelY + 24);

    // Star Rating Breakdown inside right panel
    ctx.fillStyle = '#facc15';
    ctx.font = "800 10.5px 'Montserrat', sans-serif";
    ctx.fillText(isPt ? 'METAS DE ESTRELAS:' : 'STAR THRESHOLDS:', centerX, panelY + 48);

    const starRows = [
      { label: '★ 1 Estrela', labelEn: '★ 1 Star', pts: sec.star1Score, earned: this.score >= sec.star1Score },
      { label: '★★ 2 Estrelas', labelEn: '★★ 2 Stars', pts: sec.star2Score, earned: this.score >= sec.star2Score },
      { label: '★★★ 3 Estrelas', labelEn: '★★★ 3 Stars', pts: sec.star3Score, earned: this.score >= sec.star3Score }
    ];

    starRows.forEach((sr, idx) => {
      const sy = panelY + 68 + idx * 22;
      ctx.fillStyle = sr.earned ? 'rgba(250, 204, 21, 0.2)' : 'rgba(15, 23, 42, 0.7)';
      ctx.beginPath();
      ctx.roundRect(panelX + 12, sy - 10, panelW - 24, 19, 5);
      ctx.fill();

      ctx.fillStyle = sr.earned ? '#facc15' : '#94a3b8';
      ctx.font = "800 10px 'Montserrat', sans-serif";
      ctx.textAlign = 'left';
      ctx.fillText(isPt ? sr.label : sr.labelEn, panelX + 20, sy + 2);

      ctx.textAlign = 'right';
      ctx.fillText(`${sr.pts} pts`, panelX + panelW - 20, sy + 2);
    });

    const targetCfg = ORB_TIERS[sec.targetTier - 1];
    ctx.textAlign = 'center';
    ctx.fillStyle = '#e2e8f0';
    ctx.font = "800 10.5px 'Montserrat', sans-serif";
    ctx.fillText(`${i18n.t('targetTier')}: T${targetCfg.tier} (${targetCfg.symbol})`, centerX, panelY + 148);

    this._renderPreviewOrb(ctx, centerX, panelY + 190, sec.targetTier, false, timeSec, 0.75);

    if (this.comboCount > 1) {
      ctx.fillStyle = '#facc15';
      ctx.font = "900 15px 'Montserrat', sans-serif";
      ctx.fillText(`${this.comboCount}X ${i18n.t('combo')}!`, centerX, panelY + 245);
    } else {
      ctx.fillStyle = '#38bdf8';
      ctx.font = "800 11.5px 'Montserrat', sans-serif";
      ctx.fillText(`♦ ${storage.data.plasmaShards || 0} SHARDS`, centerX, panelY + 245);
    }

    if (panelH >= 340) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.beginPath();
      ctx.roundRect(panelX + 12, panelY + panelH - 96, panelW - 24, 84, 8);
      ctx.fill();

      ctx.fillStyle = '#94a3b8';
      ctx.font = "700 9.5px 'Montserrat', sans-serif";
      const lines = isPt
        ? ['MOUSE / TOQUE: Mirar e Soltar', 'Junte 2 orbes iguais p/ evoluir!', '★1 libera concluir fase no topo', 'Fundir Núcleo Alvo = ★★★!']
        : ['MOUSE / TOUCH: Aim & Drop', 'Match 2 identical orbs to evolve!', '★1 unlocks Finish button at top', 'Fuse Goal Core = Instant ★★★!'];
      lines.forEach((ln, idx) => {
        ctx.fillText(ln, centerX, panelY + panelH - 78 + idx * 17);
      });
    }

    ctx.restore();
  }

  _renderEffects(ctx) {
    for (const sw of this.physics.shockwaves) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, sw.alpha);
      ctx.strokeStyle = sw.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    for (const p of this.physics.particles) {
      const lifeRatio = 1 - p.age / p.life;
      const alpha = lifeRatio * lifeRatio;
      ctx.save();
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * lifeRatio, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    for (const ft of this.physics.floatingTexts) {
      const alpha = Math.max(0, 1 - ft.age / ft.life);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = ft.color;
      ctx.font = `900 ${Math.round(13.5 * ft.scale)}px 'Montserrat', sans-serif`;
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 6;
      const clampedX = Math.max(110, Math.min(this.viewW - 110, ft.x));
      ctx.fillText(ft.text, clampedX, ft.y);
      ctx.restore();
    }
  }
}
