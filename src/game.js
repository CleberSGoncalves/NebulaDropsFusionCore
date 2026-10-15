/**
 * @fileoverview Main Game Engine & Renderer for Nebula Drops: Fusion Core
 * Implements:
 * - Fixed Timestep Physics Accumulator (FIXED_DT = 1/60s) for identical behavior on 60Hz, 144Hz, and 165Hz
 * - Interactive Magnetic Dropper Pod with holographic trajectory line & drop buffering
 * - 11-Tier Liquid Plasma Core rendering with inner glow, specular highlights, and Squash & Stretch
 * - Side diagnostic panels (Fusion Evolution Chain & Reactor Telemetry)
 * - Full CrazyGames SDK v3 lifecycle & Ad-Pause / Tab-Blur safety
 */

import { FIXED_DT, PhysicsWorld } from './physics.js';
import { ORB_TIERS, SECTORS } from './levels.js';
import { sound } from './audio.js';
import { storage } from './storage.js';
import { i18n } from './i18n.js';
import { crazyGames } from './crazygames.js';

const LOGICAL_WIDTH = 960;
const LOGICAL_HEIGHT = 540;

export class GameEngine {
  constructor(canvas, hud) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.hud = hud;

    this.bounds = {
      left: 290,
      right: 670,
      top: 102,
      bottom: 482,
      dangerY: 146
    };

    this.physics = new PhysicsWorld(this.bounds, {
      onFusion: (mergedOrb, newTier) => this._handleFusion(mergedOrb, newTier),
      onOverflowDanger: (ratio) => this._handleOverflowDanger(ratio),
      onMeltdown: (reason) => this._handleMeltdown(reason)
    });

    this.currentSectorIndex = 0; // 0-based (Sector 1..12)
    this.isEndless = false;
    this.score = 0;
    this.highestTierReached = 1;
    this.timeRemaining = 120;

    // Dropper Pod state
    this.dropperX = (this.bounds.left + this.bounds.right) * 0.5;
    this.dropperY = 92;
    this.currentOrbTier = 1;
    this.nextOrbTier = 2;
    this.isCurrentCatalyst = false;
    this.dropCooldown = 0;
    this.dropBufferTimer = 0;

    // Tactical abilities per sector
    this.pulseUses = 2;
    this.ventUses = 2;
    this.catalystUses = 1;

    // Combo & Shield state
    this.comboCount = 0;
    this.comboTimer = 0;
    this.shieldTimer = 0;
    this.dangerRatio = 0;
    this.alarmCooldown = 0;
    this.reviveUsed = false;

    // Lifecycle flags
    this.isRunning = false;
    this.isPaused = false;
    this.isAdPaused = false;
    this.isRoundOver = false;

    // Input state
    this.keys = { left: false, right: false };
    this.isPointerDragging = false;

    // Background stars
    this.bgStars = Array.from({ length: 65 }, () => ({
      x: Math.random() * LOGICAL_WIDTH,
      y: Math.random() * LOGICAL_HEIGHT,
      r: Math.random() * 1.8 + 0.5,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 1.5 + 0.5
    }));

    this.lastFrameTime = 0;
    this.accumulator = 0;

    this._bindInputs();
    this._resize();
    window.addEventListener('resize', () => this._resize());
  }

  _resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = LOGICAL_WIDTH * dpr;
    this.canvas.height = LOGICAL_HEIGHT * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  _clientToLogical(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return { x: LOGICAL_WIDTH * 0.5, y: LOGICAL_HEIGHT * 0.5 };

    const scaleX = LOGICAL_WIDTH / rect.width;
    const scaleY = LOGICAL_HEIGHT / rect.height;
    const scale = Math.max(scaleX, scaleY);

    const renderedW = LOGICAL_WIDTH / scale;
    const renderedH = LOGICAL_HEIGHT / scale;
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

    this.canvas.addEventListener('pointerdown', (e) => {
      if (this.isPaused || this.isAdPaused || this.isRoundOver) return;
      this.isPointerDragging = true;
      const pt = this._clientToLogical(e.clientX, e.clientY);
      this._clampDropperX(pt.x);
    });

    window.addEventListener('pointermove', (e) => {
      if (this.isPaused || this.isAdPaused || this.isRoundOver) return;
      const pt = this._clientToLogical(e.clientX, e.clientY);
      if (pt.x >= this.bounds.left - 40 && pt.x <= this.bounds.right + 40) {
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

    // Tab switch / window blur protection (prevents delta spikes)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.isRunning && !this.isPaused && !this.isRoundOver && !this.isAdPaused) {
        this.hud.openPauseModal();
      }
    });
  }

  _clampDropperX(targetX) {
    const r = ORB_TIERS[this.currentOrbTier - 1].radius;
    this.dropperX = Math.max(this.bounds.left + r + 3, Math.min(this.bounds.right - r - 3, targetX));
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
    this.physics.restitution = this.isEndless ? 0.38 : sec.restitution;

    this.score = 0;
    this.highestTierReached = 1;
    this.timeRemaining = this.isEndless ? 9999 : sec.timeLimit;
    this.comboCount = 0;
    this.comboTimer = 0;
    this.shieldTimer = 0;
    this.dangerRatio = 0;
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

    // Spawn initial pre-seeded orbs in the reactor chamber
    const centerX = (this.bounds.left + this.bounds.right) * 0.5;
    if (!this.isEndless && Array.isArray(sec.initialOrbs)) {
      sec.initialOrbs.forEach((initOrb, idx) => {
        const ox = centerX + initOrb.xOffset;
        const oy = this.bounds.bottom - 50 - idx * 35;
        this.physics.spawnOrb(initOrb.tier, ox, oy, false);
        if (initOrb.tier > this.highestTierReached) {
          this.highestTierReached = initOrb.tier;
        }
      });
    }

    this.hud.setDangerVisible(false, false);
    this.hud.updateTacticalButtons(this.pulseUses, this.ventUses, this.catalystUses);
    this._syncHUD();
    crazyGames.gameplayStart();
  }

  requestDrop() {
    if (this.isPaused || this.isAdPaused || this.isRoundOver) return;
    if (this.dropCooldown <= 0) {
      this._executeDrop();
    } else {
      // Jump/Drop buffering (0.15s tolerance)
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
    spawned.vy = 95;
    sound.playDrop(this.currentOrbTier);

    this.isCurrentCatalyst = false;
    this.currentOrbTier = this.nextOrbTier;
    const maxSpawnTier = Math.min(4, Math.max(3, this.highestTierReached - 1));
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
    this.shieldTimer = 3.5; // 3.5s invulnerability shield
    this.physics.clearTopOverflowOrbs();
    sound.playVictory();
    this.hud.setDangerVisible(false, true);
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

    const popupLabel = this.comboCount > 1
      ? `+${pointsAwarded} (${this.comboCount}x!)`
      : `+${pointsAwarded}`;
    this.physics.addFloatingText(popupLabel, mergedOrb.x, mergedOrb.y - 12, cfg.color, 1.15);

    this._syncHUD();

    // Check Sector Victory condition
    if (!this.isEndless && !this.isRoundOver) {
      const sec = SECTORS[this.currentSectorIndex];
      if (this.score >= sec.targetScore && this.highestTierReached >= sec.targetTier) {
        this._triggerVictory();
      }
    }
  }

  _handleOverflowDanger(ratio) {
    this.dangerRatio = ratio;
    if (this.shieldTimer > 0) {
      this.hud.setDangerVisible(false, true);
    } else {
      this.hud.setDangerVisible(ratio > 0.15, false);
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

      // Fixed Timestep loop (guarantees identical physics on 60Hz, 144Hz, and 165Hz)
      while (this.accumulator >= FIXED_DT) {
        this._fixedUpdate(FIXED_DT);
        this.accumulator -= FIXED_DT;
      }
    }

    this._render(timestamp / 1000);
    requestAnimationFrame((ts) => this._loop(ts));
  }

  _fixedUpdate(dt) {
    // Move dropper via keyboard if active
    const moveSpeed = 360;
    if (this.keys.left) this._clampDropperX(this.dropperX - moveSpeed * dt);
    if (this.keys.right) this._clampDropperX(this.dropperX + moveSpeed * dt);

    // Drop cooldown & buffering
    if (this.dropCooldown > 0) {
      this.dropCooldown = Math.max(0, this.dropCooldown - dt);
    }
    if (this.dropBufferTimer > 0) {
      this.dropBufferTimer = Math.max(0, this.dropBufferTimer - dt);
      if (this.dropCooldown <= 0) {
        this._executeDrop();
      }
    }

    // Combo decay
    if (this.comboTimer > 0) {
      this.comboTimer = Math.max(0, this.comboTimer - dt);
      if (this.comboTimer <= 0) this.comboCount = 0;
    }

    // Invulnerability Shield decay
    if (this.shieldTimer > 0) {
      this.shieldTimer = Math.max(0, this.shieldTimer - dt);
      if (this.shieldTimer <= 0) {
        this.hud.setDangerVisible(this.dangerRatio > 0.15, false);
      }
    }

    // Danger alarm beep
    if (this.dangerRatio > 0.35 && this.shieldTimer <= 0) {
      this.alarmCooldown -= dt;
      if (this.alarmCooldown <= 0) {
        sound.playDangerAlarm();
        this.alarmCooldown = 0.65;
      }
    }

    // Sector countdown timer
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

    // Deep orbital station background
    const bgGrad = ctx.createRadialGradient(480, 270, 40, 480, 270, 560);
    bgGrad.addColorStop(0, '#0a1936');
    bgGrad.addColorStop(0.6, '#050c1d');
    bgGrad.addColorStop(1, '#02050d');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

    // Twinkling cosmic stars
    for (const st of this.bgStars) {
      const alpha = 0.25 + 0.45 * Math.sin(timeSec * st.speed + st.phase);
      ctx.fillStyle = `rgba(186, 230, 253, ${alpha})`;
      ctx.beginPath();
      ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Apply Camera Shake (Trauma² offset & roll)
    const shaker = this.physics.cameraShaker;
    ctx.translate(LOGICAL_WIDTH * 0.5 + shaker.offsetX, LOGICAL_HEIGHT * 0.5 + shaker.offsetY);
    ctx.rotate(shaker.angle);
    ctx.translate(-LOGICAL_WIDTH * 0.5, -LOGICAL_HEIGHT * 0.5);

    // 1. Render Left Side Panel: Fusion Evolution Chain
    this._renderEvolutionPanel(ctx, timeSec);

    // 2. Render Right Side Panel: Reactor Telemetry & Progress
    this._renderTelemetryPanel(ctx, timeSec);

    // 3. Render Central Containment Vessel & Trajectory Line
    this._renderContainmentVessel(ctx, timeSec);

    // 4. Render Active Orbs with Squash & Stretch
    for (const orb of this.physics.orbs) {
      this._renderOrb(ctx, orb, timeSec);
    }

    // 5. Render Shockwaves, Particles, and Floating Score Popups
    this._renderEffects(ctx);

    ctx.restore();
  }

  _renderContainmentVessel(ctx, timeSec) {
    const { left, right, top, bottom, dangerY } = this.bounds;
    const width = right - left;
    const height = bottom - top;

    // Vessel interior glass backdrop
    const glassGrad = ctx.createLinearGradient(left, top, left, bottom);
    glassGrad.addColorStop(0, 'rgba(8, 22, 48, 0.55)');
    glassGrad.addColorStop(1, 'rgba(3, 10, 24, 0.85)');
    ctx.fillStyle = glassGrad;
    ctx.fillRect(left, top, width, height);

    // Subtle interior magnetic grid lines
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.07)';
    ctx.lineWidth = 1;
    for (let gx = left + 38; gx < right; gx += 38) {
      ctx.beginPath();
      ctx.moveTo(gx, top);
      ctx.lineTo(gx, bottom);
      ctx.stroke();
    }
    for (let gy = top + 38; gy < bottom; gy += 38) {
      ctx.beginPath();
      ctx.moveTo(left, gy);
      ctx.lineTo(right, gy);
      ctx.stroke();
    }

    // Holographic Drop Guide Line & Dropper Pod
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

      // Magnetic Emitter Pod Claw
      ctx.save();
      ctx.strokeStyle = '#00f5ff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(this.dropperX - 24, this.dropperY - 14);
      ctx.lineTo(this.dropperX, this.dropperY - 24);
      ctx.lineTo(this.dropperX + 24, this.dropperY - 14);
      ctx.stroke();
      ctx.restore();

      // Preview Orb held in Dropper Pod
      if (this.dropCooldown <= 0.15) {
        this._renderPreviewOrb(ctx, this.dropperX, this.dropperY, this.currentOrbTier, this.isCurrentCatalyst, timeSec);
      }
    }

    // Danger Threshold Laser Line
    ctx.save();
    const isDanger = this.dangerRatio > 0.1;
    ctx.setLineDash([10, 6]);
    ctx.strokeStyle = this.shieldTimer > 0
      ? '#00f5ff'
      : isDanger
        ? `rgba(239, 68, 68, ${0.65 + 0.35 * Math.sin(timeSec * 14)})`
        : 'rgba(239, 68, 68, 0.42)';
    ctx.lineWidth = isDanger ? 2.8 : 1.8;
    ctx.beginPath();
    ctx.moveTo(left + 4, dangerY);
    ctx.lineTo(right - 4, dangerY);
    ctx.stroke();
    ctx.restore();

    // Glowing Metallic Containment Walls (Left, Bottom, Right)
    ctx.save();
    ctx.shadowColor = this.shieldTimer > 0 ? '#00f5ff' : '#38bdf8';
    ctx.shadowBlur = 14;
    ctx.strokeStyle = this.shieldTimer > 0 ? '#00f5ff' : '#38bdf8';
    ctx.lineWidth = 4.5;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(left, top - 8);
    ctx.lineTo(left, bottom);
    ctx.lineTo(right, bottom);
    ctx.lineTo(right, top - 8);
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

    // Outer plasma glow
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

    // Rim highlight
    ctx.strokeStyle = orb.overflowTime > 0.2 ? '#ef4444' : 'rgba(255, 255, 255, 0.75)';
    ctx.lineWidth = orb.overflowTime > 0.2 ? 3 : 2;
    ctx.stroke();

    // Specular liquid droplet shine
    ctx.fillStyle = 'rgba(255, 255, 255, 0.38)';
    ctx.beginPath();
    ctx.ellipse(-r * 0.32, -r * 0.34, r * 0.26, r * 0.14, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    // Element Symbol & Tier badge
    ctx.fillStyle = '#020617';
    ctx.font = `900 ${Math.max(11, Math.round(r * 0.48))}px 'Montserrat', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(orb.symbol, 0, 1);

    ctx.restore();
  }

  _renderEvolutionPanel(ctx, timeSec) {
    const panelX = 22;
    const panelY = 74;
    const panelW = 246;
    const panelH = 408;

    ctx.save();
    ctx.fillStyle = 'rgba(7, 15, 32, 0.78)';
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
      const rowY = panelY + 44 + idx * 32.5;
      const isTarget = !this.isEndless && t.tier === sec.targetTier;
      const isReached = t.tier <= this.highestTierReached;

      if (isTarget) {
        ctx.fillStyle = 'rgba(250, 204, 21, 0.14)';
        ctx.fillRect(panelX + 8, rowY - 13, panelW - 16, 26);
      }

      // Mini orb icon
      ctx.fillStyle = isReached ? t.color : 'rgba(148, 163, 184, 0.3)';
      ctx.beginPath();
      ctx.arc(panelX + 26, rowY, 9 + idx * 0.35, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#020617';
      ctx.font = "900 8px 'Montserrat', sans-serif";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(t.symbol, panelX + 26, rowY + 0.5);

      // Tier Name & Points
      ctx.textAlign = 'left';
      ctx.fillStyle = isTarget ? '#facc15' : isReached ? '#f8fafc' : '#64748b';
      ctx.font = "700 10.5px 'Montserrat', sans-serif";
      const name = i18n.getTierName(t.tier);
      ctx.fillText(`T${t.tier} ${name.slice(0, 17)}`, panelX + 46, rowY);

      ctx.textAlign = 'right';
      ctx.fillStyle = isTarget ? '#facc15' : '#38bdf8';
      ctx.font = "800 10px 'Montserrat', sans-serif";
      ctx.fillText(isTarget ? '★ GOAL' : `+${t.points}`, panelX + panelW - 14, rowY);
    });

    ctx.restore();
  }

  _renderTelemetryPanel(ctx, timeSec) {
    const panelX = 692;
    const panelY = 74;
    const panelW = 246;
    const panelH = 408;

    ctx.save();
    ctx.fillStyle = 'rgba(7, 15, 32, 0.78)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.28)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(panelX, panelY, panelW, panelH, 14);
    ctx.fill();
    ctx.stroke();

    const sec = SECTORS[this.currentSectorIndex];
    const centerX = panelX + panelW * 0.5;

    // Sector Title
    ctx.fillStyle = '#00f5ff';
    ctx.font = "900 13px 'Montserrat', sans-serif";
    ctx.textAlign = 'center';
    const secName = this.isEndless
      ? i18n.t('endlessMode')
      : (i18n.lang === 'pt' ? sec.namePt : sec.nameEn).toUpperCase();
    ctx.fillText(secName, centerX, panelY + 28);

    // Score Quota Progress Bar
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

    // Target Core Spotlight
    const targetCfg = ORB_TIERS[sec.targetTier - 1];
    ctx.fillStyle = '#e2e8f0';
    ctx.font = "800 11px 'Montserrat', sans-serif";
    ctx.fillText(`${i18n.t('targetTier')}: T${targetCfg.tier} (${targetCfg.symbol})`, centerX, panelY + 108);

    this._renderPreviewOrb(ctx, centerX, panelY + 158, sec.targetTier, false, timeSec);

    // Active Combo Indicator
    if (this.comboCount > 1) {
      ctx.fillStyle = '#facc15';
      ctx.font = "900 18px 'Montserrat', sans-serif";
      ctx.fillText(`${this.comboCount}X ${i18n.t('combo')}!`, centerX, panelY + 235);
    } else {
      ctx.fillStyle = '#64748b';
      ctx.font = "700 12px 'Montserrat', sans-serif";
      ctx.fillText(`${i18n.t('best')}: ${storage.data.highScore}`, centerX, panelY + 235);
    }

    // Plasma Shards balance
    ctx.fillStyle = '#38bdf8';
    ctx.font = "800 13px 'Montserrat', sans-serif";
    ctx.fillText(`♦ ${storage.data.plasmaShards || 0} SHARDS`, centerX, panelY + 272);

    // Controls summary box
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
    // Shockwave rings
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

    // Particles with quadratic fade
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

    // Floating score texts
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
