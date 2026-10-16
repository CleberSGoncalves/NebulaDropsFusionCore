/**
 * @fileoverview Main Game Engine & Dual-Mode Adaptive Renderer for Nebula Drops: Fusion Core
 * - Automatically adapts between Portrait (540x960) and Landscape (960x540)
 * - Fixed Timestep Physics Accumulator (FIXED_DT = 1/60s) for 60Hz, 144Hz, and 165Hz
 * - Clear On-Screen Drop & Merge visual guidance
 * - Settled-only Danger countdown timer to prevent unexpected meltdowns
 */

import { FIXED_DT, PhysicsWorld } from './physics.js';
import { ORB_TIERS, SECTORS } from './levels.js';
import { sound } from './audio.js';
import { storage } from './storage.js';
import { i18n } from './i18n.js';
import { crazyGames } from './crazygames.js';

export class GameEngine {
  constructor(canvas, hud) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.hud = hud;

    this.isPortrait = false;
    this.viewW = 960;
    this.viewH = 540;

    this.bounds = {
      left: 280,
      right: 680,
      top: 85,
      bottom: 485,
      dangerY: 135
    };

    this.physics = new PhysicsWorld(this.bounds, {
      onFusion: (mergedOrb, newTier) => this._handleFusion(mergedOrb, newTier),
      onOverflowDanger: (ratio, secondsLeft) => this._handleOverflowDanger(ratio, secondsLeft),
      onMeltdown: (reason) => this._handleMeltdown(reason)
    });

    this.currentSectorIndex = 0;
    this.isEndless = false;
    this.score = 0;
    this.highestTierReached = 1;
    this.timeRemaining = 140;

    // Dropper Pod state
    this.dropperX = (this.bounds.left + this.bounds.right) * 0.5;
    this.dropperY = 75;
    this.currentOrbTier = 1;
    this.nextOrbTier = 2;
    this.isCurrentCatalyst = false;
    this.dropCooldown = 0;
    this.dropBufferTimer = 0;

    // Tactical abilities
    this.pulseUses = 2;
    this.ventUses = 2;
    this.catalystUses = 1;

    // Combo & Danger
    this.comboCount = 0;
    this.comboTimer = 0;
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
      x: Math.random() * 960,
      y: Math.random() * 960,
      r: Math.random() * 1.8 + 0.5,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 1.5 + 0.5
    }));

    this.lastFrameTime = 0;
    this.accumulator = 0;

    this._bindInputs();
    this._recalculateLayout();
    window.addEventListener('resize', () => this._recalculateLayout());
  }

  _recalculateLayout() {
    this.isPortrait = window.innerHeight > window.innerWidth;

    if (this.isPortrait) {
      this.viewW = 540;
      this.viewH = 960;
      this.bounds = {
        left: 36,
        right: 504,
        top: 130,
        bottom: 810,
        dangerY: 200
      };
      this.dropperY = 110;
    } else {
      this.viewW = 960;
      this.viewH = 540;
      this.bounds = {
        left: 280,
        right: 680,
        top: 85,
        bottom: 485,
        dangerY: 135
      };
      this.dropperY = 72;
    }

    this.physics.setBounds(this.bounds);
    this._clampDropperX(this.dropperX);

    // Apply high-DPI scaling
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

    const scaleX = this.viewW / rect.width;
    const scaleY = this.viewH / rect.height;
    const scale = Math.max(scaleX, scaleY);

    const renderedW = this.viewW / scale;
    const renderedH = this.viewH / scale;
    const offsetX = rect.left + (rect.width - renderedW) * 0.5;
    const offsetY = rect.top + (rect.height - renderedH) * 0.5;

    return {
      x: (clientX - offsetX) * scale,
      y: (clientY - offsetY) * scale
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
      if (e.code === 'KeyR') this.loadSector(this.currentSectorIndex, this.isEndless);
      if (e.code === 'KeyP' || e.code === 'Escape') {
        this.hud.openPauseModal();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = false;
    });

    // Touch & Mouse aiming
    this.canvas.addEventListener('pointerdown', (e) => {
      if (this.isPaused || this.isAdPaused || this.isRoundOver) return;
      this.isPointerDragging = true;
      const pt = this._clientToLogical(e.clientX, e.clientY);
      this._clampDropperX(pt.x);
    });

    window.addEventListener('pointermove', (e) => {
      if (this.isPaused || this.isAdPaused || this.isRoundOver) return;
      const pt = this._clientToLogical(e.clientX, e.clientY);
      if (pt.x >= this.bounds.left - 50 && pt.x <= this.bounds.right + 50) {
        this._clampDropperX(pt.x);
      }
    });

    window.addEventListener('pointerup', (e) => {
      if (!this.isPointerDragging) return;
      this.isPointerDragging = false;
      if (this.isPaused || this.isAdPaused || this.isRoundOver) return;
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
    const r = ORB_TIERS[this.currentOrbTier - 1].radius;
    this.dropperX = Math.max(this.bounds.left + r + 4, Math.min(this.bounds.right - r - 4, targetX));
  }

  start() {
    this.isRunning = true;
    const startIdx = Math.max(0, Math.min(SECTORS.length - 1, (storage.data.maxLevel || 1) - 1));
    this.loadSector(startIdx, false);
    this.lastFrameTime = performance.now();
    requestAnimationFrame((ts) => this._loop(ts));
  }

  loadSector(sectorIndex = 0, endless = false) {
    this.isEndless = Boolean(endless);
    this.currentSectorIndex = Math.max(0, Math.min(SECTORS.length - 1, sectorIndex));
    const sec = SECTORS[this.currentSectorIndex];

    this.physics.clear();
    this.physics.gravity = this.isEndless ? 720 : sec.gravity;
    this.physics.restitution = this.isEndless ? 0.35 : sec.restitution;

    this.score = 0;
    this.highestTierReached = 1;
    this.timeRemaining = this.isEndless ? 9999 : sec.timeLimit;
    this.comboCount = 0;
    this.comboTimer = 0;
    this.shieldTimer = 0;
    this.dangerRatio = 0;
    this.dangerSecondsLeft = 5.0;
    this.reviveUsed = false;
    this.isRoundOver = false;
    this.isPaused = false;

    this.pulseUses = 2;
    this.ventUses = 2;
    this.catalystUses = 1;
    this.isCurrentCatalyst = false;

    this.currentOrbTier = 1;
    this.nextOrbTier = 2;
    this.dropperX = (this.bounds.left + this.bounds.right) * 0.5;
    this.dropCooldown = 0.25;
    this.dropBufferTimer = 0;

    // Spawn gentle, grounded starter orbs on the chamber floor
    const centerX = (this.bounds.left + this.bounds.right) * 0.5;
    if (!this.isEndless && Array.isArray(sec.initialOrbs)) {
      sec.initialOrbs.forEach((initOrb) => {
        const ox = centerX + initOrb.xOffset;
        const cfg = ORB_TIERS[initOrb.tier - 1];
        const oy = this.bounds.bottom - cfg.radius - 2;
        this.physics.spawnOrb(initOrb.tier, ox, oy, false);
        if (initOrb.tier > this.highestTierReached) {
          this.highestTierReached = initOrb.tier;
        }
      });
    }

    this.hud.setDangerVisible(false, false, 5.0);
    this.hud.updateTacticalButtons(this.pulseUses, this.ventUses, this.catalystUses);
    this._syncHUD();
    crazyGames.gameplayStart();
  }

  requestDrop() {
    if (this.isPaused || this.isAdPaused || this.isRoundOver) return;
    if (this.dropCooldown <= 0) {
      this._executeDrop();
    } else {
      this.dropBufferTimer = 0.15;
    }
  }

  _executeDrop() {
    this.dropCooldown = 0.42;
    this.dropBufferTimer = 0;

    const spawned = this.physics.spawnOrb(
      this.currentOrbTier,
      this.dropperX,
      this.bounds.top + 18,
      this.isCurrentCatalyst
    );
    spawned.vy = 85;
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
    this.hud.updateTacticalButtons(this.pulseUses, this.ventUses, this.catalystUses);
  }

  usePlasmaVent() {
    if (this.ventUses <= 0 || this.isPaused || this.isRoundOver || this.physics.orbs.length === 0) return;
    const removed = this.physics.triggerPlasmaVent();
    if (removed > 0) {
      this.ventUses--;
      this.hud.updateTacticalButtons(this.pulseUses, this.ventUses, this.catalystUses);
    }
  }

  useCatalyst() {
    if (this.catalystUses <= 0 || this.isCurrentCatalyst || this.isPaused || this.isRoundOver) return;
    this.catalystUses--;
    this.isCurrentCatalyst = true;
    sound.playFluidClebFusion();
    this.hud.updateTacticalButtons(this.pulseUses, this.ventUses, this.catalystUses);
  }

  reviveWithEmergencyShield() {
    this.reviveUsed = true;
    this.isRoundOver = false;
    this.isPaused = false;
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

    const cfg = ORB_TIERS[newTier - 1];
    const comboMult = 1 + (this.comboCount - 1) * 0.25;
    const pointsAwarded = Math.round(cfg.points * comboMult);

    this.score += pointsAwarded;
    storage.recordHighScore(this.score);

    if (newTier > this.highestTierReached) {
      this.highestTierReached = newTier;
    }

    sound.playMerge(newTier, this.comboCount);

    const prevSymbol = ORB_TIERS[newTier - 2] ? ORB_TIERS[newTier - 2].symbol : 'H+';
    const popupText = this.comboCount > 1
      ? `${prevSymbol}+${prevSymbol} = ${cfg.symbol} (+${pointsAwarded} pts, ${this.comboCount}x!)`
      : `${prevSymbol}+${prevSymbol} = ${cfg.symbol} (+${pointsAwarded} pts)`;
    this.physics.addFloatingText(popupText, mergedOrb.x, mergedOrb.y - 12, cfg.color, 1.15);

    this._syncHUD();

    if (!this.isEndless && !this.isRoundOver) {
      const sec = SECTORS[this.currentSectorIndex];
      if (this.score >= sec.targetScore && this.highestTierReached >= sec.targetTier) {
        this._triggerVictory();
      }
    }
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
    this.isRoundOver = true;
    crazyGames.gameplayStop();
    sound.playGameOver();

    this.hud.openGameOverModal({
      reason,
      score: this.score,
      canRevive: !this.reviveUsed
    });
  }

  _triggerVictory() {
    if (this.isRoundOver) return;
    this.isRoundOver = true;
    crazyGames.gameplayStop();
    crazyGames.happyTime();
    crazyGames.notifyLevelCompleted();
    sound.playVictory();

    const sec = SECTORS[this.currentSectorIndex];
    let stars = 1;
    if (this.score >= sec.star2Score || this.timeRemaining >= sec.timeLimit * 0.35) stars = 2;
    if (this.score >= sec.star3Score || this.timeRemaining >= sec.timeLimit * 0.55) stars = 3;

    const shards = sec.shardReward * stars;
    storage.recordSectorWin(sec.id, this.score, stars, shards);

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
      ctx.arc((st.x * (w / 960)) % w, (st.y * (h / 540)) % h, st.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Apply Camera Shake (Trauma² offset & roll)
    const shaker = this.physics.cameraShaker;
    ctx.translate(w * 0.5 + shaker.offsetX, h * 0.5 + shaker.offsetY);
    ctx.rotate(shaker.angle);
    ctx.translate(-w * 0.5, -h * 0.5);

    // Only render side panels on Landscape desktop!
    if (!this.isPortrait) {
      this._renderEvolutionPanel(ctx, timeSec);
      this._renderTelemetryPanel(ctx, timeSec);
    } else {
      // In Portrait, render a sleek tutorial / status banner at the top of the chamber
      this._renderPortraitChamberBanner(ctx, timeSec);
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

  _renderPortraitChamberBanner(ctx, timeSec) {
    const { left, right, top } = this.bounds;
    const sec = SECTORS[this.currentSectorIndex];
    const targetOrb = ORB_TIERS[sec.targetTier - 1];

    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(left, top - 48, right - left, 36, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f8fafc';
    ctx.font = "800 11.5px 'Montserrat', sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (this.comboCount > 1) {
      ctx.fillStyle = '#facc15';
      ctx.fillText(`⚡ ${this.comboCount}X COMBO!  •  META: ${targetOrb.symbol} (T${sec.targetTier})`, (left + right) * 0.5, top - 30);
    } else {
      const hint = i18n.lang === 'pt'
        ? `🎯 COMBINE ORBES IGUAIS! ALVO: ${targetOrb.symbol} (T${sec.targetTier})`
        : `🎯 MERGE MATCHING ORBS! GOAL: ${targetOrb.symbol} (T${sec.targetTier})`;
      ctx.fillText(hint, (left + right) * 0.5, top - 30);
    }
    ctx.restore();
  }

  _renderContainmentVessel(ctx, timeSec) {
    const { left, right, top, bottom, dangerY } = this.bounds;
    const width = right - left;
    const height = bottom - top;

    // Vessel interior glass
    const glassGrad = ctx.createLinearGradient(left, top, left, bottom);
    glassGrad.addColorStop(0, 'rgba(8, 22, 48, 0.55)');
    glassGrad.addColorStop(1, 'rgba(3, 10, 24, 0.85)');
    ctx.fillStyle = glassGrad;
    ctx.fillRect(left, top, width, height);

    // Subtle magnetic grid
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
    ctx.lineWidth = 1;
    const step = this.isPortrait ? 48 : 38;
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

    // Trajectory Line & Dropper Pod
    if (!this.isRoundOver) {
      const currentCfg = ORB_TIERS[this.currentOrbTier - 1];
      ctx.save();
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = this.isCurrentCatalyst ? '#facc15' : `${currentCfg.color}88`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(this.dropperX, this.dropperY + currentCfg.radius);
      ctx.lineTo(this.dropperX, bottom - 4);
      ctx.stroke();
      ctx.restore();

      // Dropper Pod Claw
      ctx.save();
      ctx.strokeStyle = '#00f5ff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(this.dropperX - 22, this.dropperY - 14);
      ctx.lineTo(this.dropperX, this.dropperY - 22);
      ctx.lineTo(this.dropperX + 22, this.dropperY - 14);
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
    ctx.shadowColor = this.shieldTimer > 0 ? '#00f5ff' : '#38bdf8';
    ctx.shadowBlur = 14;
    ctx.strokeStyle = this.shieldTimer > 0 ? '#00f5ff' : '#38bdf8';
    ctx.lineWidth = 4.5;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(left, top - 24);
    ctx.lineTo(left, bottom);
    ctx.lineTo(right, bottom);
    ctx.lineTo(right, top - 24);
    ctx.stroke();
    ctx.restore();
  }

  _renderPreviewOrb(ctx, x, y, tier, isCatalyst, timeSec) {
    const cfg = ORB_TIERS[tier - 1];
    ctx.save();
    ctx.translate(x, y);
    const r = cfg.radius;

    const grad = ctx.createRadialGradient(-r * 0.25, -r * 0.25, r * 0.1, 0, 0, r);
    if (isCatalyst) {
      const hue = (timeSec * 140) % 360;
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.5, `hsl(${hue}, 95%, 60%)`);
      grad.addColorStop(1, '#facc15');
    } else {
      grad.addColorStop(0, cfg.coreColor);
      grad.addColorStop(0.55, cfg.color);
      grad.addColorStop(1, cfg.ringColor);
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
    ctx.translate(orb.x, orb.y);
    ctx.scale(orb.scaleX, orb.scaleY);
    ctx.rotate(orb.rotation);

    const r = orb.radius;

    const grad = ctx.createRadialGradient(-r * 0.28, -r * 0.28, r * 0.12, 0, 0, r);
    if (orb.isCatalyst) {
      const hue = (timeSec * 160) % 360;
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.5, `hsl(${hue}, 95%, 60%)`);
      grad.addColorStop(1, '#ca8a04');
    } else {
      grad.addColorStop(0, orb.coreColor);
      grad.addColorStop(0.6, orb.color);
      grad.addColorStop(1, orb.ringColor);
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
    ctx.font = `900 ${Math.max(11, Math.round(r * 0.48))}px 'Montserrat', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(orb.symbol, 0, 1);

    ctx.restore();
  }

  _renderEvolutionPanel(ctx, timeSec) {
    const panelX = 22;
    const panelY = 66;
    const panelW = 246;
    const panelH = 416;

    ctx.save();
    ctx.fillStyle = 'rgba(7, 15, 32, 0.82)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.28)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(panelX, panelY, panelW, panelH, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = "800 11px 'Montserrat', sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText(i18n.t('evolutionChain'), panelX + panelW * 0.5, panelY + 22);

    const sec = SECTORS[this.currentSectorIndex];

    ORB_TIERS.forEach((t, idx) => {
      const rowY = panelY + 44 + idx * 33;
      const isTarget = !this.isEndless && t.tier === sec.targetTier;
      const isReached = t.tier <= this.highestTierReached;

      if (isTarget) {
        ctx.fillStyle = 'rgba(250, 204, 21, 0.14)';
        ctx.fillRect(panelX + 8, rowY - 13, panelW - 16, 26);
      }

      ctx.fillStyle = isReached ? t.color : 'rgba(148, 163, 184, 0.3)';
      ctx.beginPath();
      ctx.arc(panelX + 26, rowY, 9 + idx * 0.35, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#020617';
      ctx.font = "900 8px 'Montserrat', sans-serif";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(t.symbol, panelX + 26, rowY + 0.5);

      ctx.textAlign = 'left';
      ctx.fillStyle = isTarget ? '#facc15' : isReached ? '#f8fafc' : '#64748b';
      ctx.font = "700 10.5px 'Montserrat', sans-serif";
      const name = i18n.getTierName(t.tier);
      ctx.fillText(`T${t.tier} ${name.slice(0, 16)}`, panelX + 46, rowY);

      ctx.textAlign = 'right';
      ctx.fillStyle = isTarget ? '#facc15' : '#38bdf8';
      ctx.font = "800 10px 'Montserrat', sans-serif";
      ctx.fillText(isTarget ? '★ GOAL' : `+${t.points}`, panelX + panelW - 14, rowY);
    });

    ctx.restore();
  }

  _renderTelemetryPanel(ctx, timeSec) {
    const panelX = 692;
    const panelY = 66;
    const panelW = 246;
    const panelH = 416;

    ctx.save();
    ctx.fillStyle = 'rgba(7, 15, 32, 0.82)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.28)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(panelX, panelY, panelW, panelH, 14);
    ctx.fill();
    ctx.stroke();

    const sec = SECTORS[this.currentSectorIndex];
    const centerX = panelX + panelW * 0.5;

    ctx.fillStyle = '#00f5ff';
    ctx.font = "900 13px 'Montserrat', sans-serif";
    ctx.textAlign = 'center';
    const secName = this.isEndless
      ? i18n.t('endlessMode')
      : (i18n.lang === 'pt' ? sec.namePt : sec.nameEn).toUpperCase();
    ctx.fillText(secName, centerX, panelY + 28);

    const quotaPct = this.isEndless ? 1 : Math.min(1, this.score / Math.max(1, sec.targetScore));
    ctx.fillStyle = '#94a3b8';
    ctx.font = "700 11px 'Montserrat', sans-serif";
    ctx.fillText(`${i18n.t('score')}: ${this.score} / ${this.isEndless ? '∞' : sec.targetScore}`, centerX, panelY + 56);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.roundRect(panelX + 20, panelY + 66, panelW - 40, 12, 6);
    ctx.fill();

    const barGrad = ctx.createLinearGradient(panelX + 20, 0, panelX + panelW - 20, 0);
    barGrad.addColorStop(0, '#0284c7');
    barGrad.addColorStop(1, '#00f5ff');
    ctx.fillStyle = barGrad;
    ctx.beginPath();
    ctx.roundRect(panelX + 20, panelY + 66, Math.max(8, (panelW - 40) * quotaPct), 12, 6);
    ctx.fill();

    const targetCfg = ORB_TIERS[sec.targetTier - 1];
    ctx.fillStyle = '#e2e8f0';
    ctx.font = "800 11px 'Montserrat', sans-serif";
    ctx.fillText(`${i18n.t('targetTier')}: T${targetCfg.tier} (${targetCfg.symbol})`, centerX, panelY + 108);

    this._renderPreviewOrb(ctx, centerX, panelY + 158, sec.targetTier, false, timeSec);

    if (this.comboCount > 1) {
      ctx.fillStyle = '#facc15';
      ctx.font = "900 18px 'Montserrat', sans-serif";
      ctx.fillText(`${this.comboCount}X ${i18n.t('combo')}!`, centerX, panelY + 235);
    } else {
      ctx.fillStyle = '#64748b';
      ctx.font = "700 12px 'Montserrat', sans-serif";
      ctx.fillText(`${i18n.t('best')}: ${storage.data.highScore}`, centerX, panelY + 235);
    }

    ctx.fillStyle = '#38bdf8';
    ctx.font = "800 13px 'Montserrat', sans-serif";
    ctx.fillText(`♦ ${storage.data.plasmaShards || 0} SHARDS`, centerX, panelY + 272);

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.roundRect(panelX + 16, panelY + 298, panelW - 32, 92, 10);
    ctx.fill();

    ctx.fillStyle = '#94a3b8';
    ctx.font = "700 10px 'Montserrat', sans-serif";
    const lines = i18n.lang === 'pt'
      ? ['MOUSE / TOQUE: Mirar', 'CLIQUE / ESPAÇO: Soltar', '[F] Pulso Gravitacional', '[V] Purgar Menores', '[C] Orbe Catalisador']
      : ['MOUSE / TOUCH: Aim Drop', 'CLICK / SPACE: Release Orb', '[F] Gravitational Pulse', '[V] Vent Smallest Orbs', '[C] Universal Catalyst'];
    lines.forEach((ln, idx) => {
      ctx.fillText(ln, centerX, panelY + 316 + idx * 15);
    });

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
      ctx.font = `900 ${Math.round(15 * ft.scale)}px 'Montserrat', sans-serif`;
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 6;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }
  }
}
