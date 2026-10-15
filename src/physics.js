/**
 * @fileoverview Deterministic 2D Physics & Fusion Engine for Nebula Drops: Fusion Core
 * Implements:
 * - Fixed Timestep (FIXED_DT = 1/60s) with accumulator for identical physics on 60Hz, 144Hz, and 165Hz
 * - Multi-iteration Impulse + Positional Correction Circle Solver (prevents tunneling and jitter)
 * - Squash & Stretch spring-damped oscillator per orb (SquashStretch2D equivalent)
 * - Camera Shake with Trauma² exponential decay (JuiceCamera2D equivalent)
 * - Hit-Stop impact freeze manager (HitStopManager equivalent)
 */

import { ORB_TIERS } from './levels.js';
import { sound } from './audio.js';

export const FIXED_DT = 1 / 60;
const SUB_STEPS = 4; // 240Hz internal solver precision per 60Hz frame

export class CameraShaker {
  constructor() {
    this.trauma = 0;
    this.decay = 1.55;
    this.maxOffset = 15;
    this.maxAngle = 0.045;
    this.offsetX = 0;
    this.offsetY = 0;
    this.angle = 0;
    this.seed = 0;
  }

  addTrauma(amount) {
    this.trauma = Math.min(1.0, this.trauma + amount);
  }

  update(dt) {
    if (this.trauma > 0) {
      this.trauma = Math.max(0, this.trauma - this.decay * dt);
      const shake = this.trauma * this.trauma; // Exponential Trauma² formula
      this.seed += dt * 48;
      this.offsetX = Math.sin(this.seed * 1.9) * this.maxOffset * shake;
      this.offsetY = Math.cos(this.seed * 2.5) * this.maxOffset * shake;
      this.angle = Math.sin(this.seed * 1.3) * this.maxAngle * shake;
    } else {
      this.offsetX = 0;
      this.offsetY = 0;
      this.angle = 0;
    }
  }
}

export class PlasmaOrb {
  constructor(id, tier, x, y, isCatalyst = false) {
    this.id = id;
    this.tier = Math.max(1, Math.min(ORB_TIERS.length, tier));
    this.isCatalyst = Boolean(isCatalyst);

    const cfg = ORB_TIERS[this.tier - 1];
    this.radius = cfg.radius;
    this.mass = cfg.mass;
    this.invMass = 1 / cfg.mass;
    this.color = cfg.color;
    this.coreColor = cfg.coreColor;
    this.glowColor = cfg.glowColor;
    this.ringColor = cfg.ringColor;
    this.symbol = this.isCatalyst ? '★' : cfg.symbol;

    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.rotation = 0;
    this.angularVel = 0;

    // Squash & Stretch spring state
    this.scaleX = 0.76;
    this.scaleY = 1.28;
    this.scaleVelX = 0;
    this.scaleVelY = 0;

    this.age = 0;
    this.overflowTime = 0;
    this.merged = false;
    this.impactCooldown = 0;
  }

  triggerSquash(intensity = 1.0) {
    const k = Math.min(1.35, Math.max(0.25, intensity));
    this.scaleX = 1.0 + 0.28 * k;
    this.scaleY = 1.0 - 0.24 * k;
  }

  triggerFusionPop() {
    this.scaleX = 1.42;
    this.scaleY = 0.65;
  }

  updateSpring(dt) {
    const stiffness = 24.0;
    const damping = 9.5;

    const forceX = (1.0 - this.scaleX) * stiffness - this.scaleVelX * damping;
    const forceY = (1.0 - this.scaleY) * stiffness - this.scaleVelY * damping;

    this.scaleVelX += forceX * dt;
    this.scaleVelY += forceY * dt;

    this.scaleX += this.scaleVelX * dt;
    this.scaleY += this.scaleVelY * dt;
  }
}

export class PhysicsWorld {
  constructor(bounds, callbacks = {}) {
    // Reactor Vessel Bounds (logical 960x540 canvas coordinates)
    this.bounds = bounds || {
      left: 290,
      right: 670,
      top: 105,
      bottom: 495,
      dangerY: 145
    };
    this.gravity = 700;
    this.restitution = 0.36;
    this.wallFriction = 0.985;

    this.orbs = [];
    this.particles = [];
    this.shockwaves = [];
    this.floatingTexts = [];

    this.nextOrbId = 1;
    this.hitStopTimer = 0;
    this.cameraShaker = new CameraShaker();

    this.onFusion = callbacks.onFusion || null;
    this.onOverflowDanger = callbacks.onOverflowDanger || null;
    this.onMeltdown = callbacks.onMeltdown || null;
  }

  clear() {
    this.orbs = [];
    this.particles = [];
    this.shockwaves = [];
    this.floatingTexts = [];
    this.hitStopTimer = 0;
    this.cameraShaker.trauma = 0;
  }

  spawnOrb(tier, x, y, isCatalyst = false) {
    const cfg = ORB_TIERS[Math.max(0, Math.min(ORB_TIERS.length - 1, tier - 1))];
    const clampedX = Math.max(
      this.bounds.left + cfg.radius + 2,
      Math.min(this.bounds.right - cfg.radius - 2, x)
    );
    const orb = new PlasmaOrb(this.nextOrbId++, tier, clampedX, y, isCatalyst);
    this.orbs.push(orb);
    return orb;
  }

  triggerHitStop(durationSec = 0.05) {
    this.hitStopTimer = Math.max(this.hitStopTimer, durationSec);
  }

  /**
   * Advances physics by exactly one fixed timestep (FIXED_DT = 1/60s).
   * @param {number} dt
   * @param {boolean} shieldActive - If true, prevents overflow meltdown
   */
  step(dt = FIXED_DT, shieldActive = false) {
    this.cameraShaker.update(dt);

    // Update visual particles, shockwaves, and floating texts even during Hit-Stop
    this._updateEffects(dt);

    if (this.hitStopTimer > 0) {
      this.hitStopTimer = Math.max(0, this.hitStopTimer - dt);
      return;
    }

    const subDt = dt / SUB_STEPS;
    const pendingFusions = [];

    for (let s = 0; s < SUB_STEPS; s++) {
      // 1. Integrate forces & velocities
      for (let i = 0; i < this.orbs.length; i++) {
        const o = this.orbs[i];
        if (o.merged) continue;

        o.vy += this.gravity * subDt;
        o.vx *= 0.999;
        o.vy *= 0.999;

        o.x += o.vx * subDt;
        o.y += o.vy * subDt;
        o.rotation += (o.vx / Math.max(18, o.radius)) * subDt;

        // Container wall collisions
        if (o.x - o.radius < this.bounds.left) {
          o.x = this.bounds.left + o.radius;
          if (o.vx < -40 && o.impactCooldown <= 0) {
            o.triggerSquash(Math.min(0.8, Math.abs(o.vx) / 350));
            o.impactCooldown = 0.12;
          }
          o.vx = Math.abs(o.vx) * this.restitution;
        } else if (o.x + o.radius > this.bounds.right) {
          o.x = this.bounds.right - o.radius;
          if (o.vx > 40 && o.impactCooldown <= 0) {
            o.triggerSquash(Math.min(0.8, Math.abs(o.vx) / 350));
            o.impactCooldown = 0.12;
          }
          o.vx = -Math.abs(o.vx) * this.restitution;
        }

        // Bottom reactor floor collision
        if (o.y + o.radius > this.bounds.bottom) {
          o.y = this.bounds.bottom - o.radius;
          if (o.vy > 75 && o.impactCooldown <= 0) {
            const impactStrength = Math.min(1.0, o.vy / 420);
            o.triggerSquash(impactStrength);
            sound.playBounce(impactStrength);
            o.impactCooldown = 0.14;
          }
          o.vy = -Math.abs(o.vy) * this.restitution;
          o.vx *= this.wallFriction;
          if (Math.abs(o.vy) < 12) o.vy = 0;
        }
      }

      // 2. Circle-to-Circle Collisions & Identical Tier Fusion Detection
      for (let i = 0; i < this.orbs.length; i++) {
        const a = this.orbs[i];
        if (a.merged) continue;

        for (let j = i + 1; j < this.orbs.length; j++) {
          const b = this.orbs[j];
          if (b.merged) continue;

          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const distSq = dx * dx + dy * dy;
          const minDist = a.radius + b.radius;

          if (distSq < minDist * minDist) {
            const dist = Math.sqrt(distSq) || 0.001;

            // Check if eligible for Fusion!
            const sameTier = a.tier === b.tier && a.tier < ORB_TIERS.length;
            const catalystMatch = (a.isCatalyst || b.isCatalyst) && Math.max(a.tier, b.tier) < ORB_TIERS.length;

            if (sameTier || catalystMatch) {
              a.merged = true;
              b.merged = true;
              const targetTier = Math.max(a.tier, b.tier) + 1;
              pendingFusions.push({
                orbA: a,
                orbB: b,
                newTier: targetTier,
                x: (a.x + b.x) * 0.5,
                y: (a.y + b.y) * 0.5,
                vx: (a.vx + b.vx) * 0.4,
                vy: Math.min(-45, (a.vy + b.vy) * 0.35)
              });
              break;
            }

            // Standard elastic collision resolution + positional correction
            const nx = dx / dist;
            const ny = dy / dist;
            const overlap = minDist - dist;

            const totalInvMass = a.invMass + b.invMass;
            const corr = (overlap / totalInvMass) * 0.82;
            a.x -= nx * corr * a.invMass;
            a.y -= ny * corr * a.invMass;
            b.x += nx * corr * b.invMass;
            b.y += ny * corr * b.invMass;

            // Relative velocity along normal
            const rvx = b.vx - a.vx;
            const rvy = b.vy - a.vy;
            const velAlongNormal = rvx * nx + rvy * ny;

            if (velAlongNormal < 0) {
              const e = this.restitution;
              const jImpulse = (-(1 + e) * velAlongNormal) / totalInvMass;
              const impulseX = jImpulse * nx;
              const impulseY = jImpulse * ny;

              a.vx -= impulseX * a.invMass;
              a.vy -= impulseY * a.invMass;
              b.vx += impulseX * b.invMass;
              b.vy += impulseY * b.invMass;

              const impactSpeed = Math.abs(velAlongNormal);
              if (impactSpeed > 95 && a.impactCooldown <= 0 && b.impactCooldown <= 0) {
                const sq = Math.min(0.75, impactSpeed / 480);
                a.triggerSquash(sq);
                b.triggerSquash(sq);
                a.impactCooldown = 0.12;
                b.impactCooldown = 0.12;
              }
            }
          }
        }
      }
    }

    // 3. Process pending Fusions
    if (pendingFusions.length > 0) {
      this.orbs = this.orbs.filter((o) => !o.merged);
      for (const f of pendingFusions) {
        const mergedOrb = this.spawnOrb(f.newTier, f.x, f.y, false);
        mergedOrb.vx = f.vx;
        mergedOrb.vy = f.vy;
        mergedOrb.triggerFusionPop();

        // Spawn shockwave & particle burst
        const cfg = ORB_TIERS[f.newTier - 1];
        this.spawnFusionParticles(mergedOrb.x, mergedOrb.y, cfg.color, f.newTier);

        // Trauma² Screen Shake & Hit-Stop on high tiers
        const traumaAmount = Math.min(0.85, 0.16 + f.newTier * 0.055);
        this.cameraShaker.addTrauma(traumaAmount);
        if (f.newTier >= 5) {
          this.triggerHitStop(0.05);
        }

        if (this.onFusion) {
          this.onFusion(mergedOrb, f.newTier);
        }
      }
    }

    // 4. Update Orb springs, ages, and Danger Line overflow check
    let maxDangerRatio = 0;
    for (let i = 0; i < this.orbs.length; i++) {
      const o = this.orbs[i];
      o.age += dt;
      if (o.impactCooldown > 0) o.impactCooldown -= dt;
      o.updateSpring(dt);

      // Only settled orbs (age > 1.1s) trigger the danger line timer
      if (o.age > 1.1 && o.y - o.radius < this.bounds.dangerY) {
        if (!shieldActive) {
          o.overflowTime += dt;
        } else {
          o.overflowTime = Math.max(0, o.overflowTime - dt * 2);
        }
        const ratio = Math.min(1, o.overflowTime / 3.0);
        if (ratio > maxDangerRatio) maxDangerRatio = ratio;

        if (o.overflowTime >= 3.0 && !shieldActive) {
          if (this.onMeltdown) this.onMeltdown('overflow');
          return;
        }
      } else {
        o.overflowTime = Math.max(0, o.overflowTime - dt * 1.8);
      }
    }

    if (this.onOverflowDanger) {
      this.onOverflowDanger(maxDangerRatio);
    }
  }

  /**
   * Gravitational Pulse (EMP): Applies an upward magnetic wave to unstick and rearrange orbs.
   */
  triggerGravitationalPulse() {
    sound.playPulseEMP();
    this.cameraShaker.addTrauma(0.55);
    const centerX = (this.bounds.left + this.bounds.right) * 0.5;
    this.shockwaves.push({
      x: centerX,
      y: this.bounds.bottom - 20,
      radius: 15,
      maxRadius: 340,
      color: '#00f5ff',
      alpha: 1.0
    });

    for (const o of this.orbs) {
      o.vy = -Math.random() * 260 - 220;
      o.vx += (Math.random() - 0.5) * 280;
      o.triggerSquash(0.9);
    }
  }

  /**
   * Emergency Plasma Vent: Vaporizes up to 2 smallest orbs to relieve overflow pressure.
   * @returns {number} Number of orbs vaporized
   */
  triggerPlasmaVent() {
    if (this.orbs.length === 0) return 0;
    const sorted = [...this.orbs].sort((a, b) => a.tier - b.tier || a.y - b.y);
    const toRemove = sorted.slice(0, Math.min(2, sorted.length));
    const removeIds = new Set(toRemove.map((o) => o.id));

    toRemove.forEach((o) => {
      this.spawnFusionParticles(o.x, o.y, o.color, 3);
    });

    this.orbs = this.orbs.filter((o) => !removeIds.has(o.id));
    sound.playVent();
    this.cameraShaker.addTrauma(0.35);
    return toRemove.length;
  }

  /**
   * Clears top overflowing orbs when reviving via Rewarded Ad Emergency Shield.
   */
  clearTopOverflowOrbs() {
    const thresholdY = this.bounds.dangerY + 95;
    const kept = [];
    for (const o of this.orbs) {
      if (o.y - o.radius < thresholdY && this.orbs.length > 3) {
        this.spawnFusionParticles(o.x, o.y, '#00f5ff', 4);
      } else {
        o.overflowTime = 0;
        kept.push(o);
      }
    }
    this.orbs = kept;
    this.cameraShaker.addTrauma(0.5);
  }

  spawnFusionParticles(x, y, color, tier = 2) {
    this.shockwaves.push({
      x,
      y,
      radius: 12,
      maxRadius: 45 + tier * 14,
      color,
      alpha: 1.0
    });

    const count = Math.min(36, 12 + tier * 3);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const speed = 70 + Math.random() * (90 + tier * 18);
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: 2.5 + Math.random() * 3.5,
        color: i % 3 === 0 ? '#ffffff' : color,
        age: 0,
        life: 0.4 + Math.random() * 0.35
      });
    }
  }

  addFloatingText(text, x, y, color = '#00f5ff', scale = 1.0) {
    this.floatingTexts.push({
      text,
      x,
      y,
      vy: -55,
      color,
      scale,
      age: 0,
      life: 0.95
    });
  }

  _updateEffects(dt) {
    // Non-linear cubic fade particles: alpha = (1 - age/life)^2
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.age += dt;
      if (p.age >= p.life) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.94;
      p.vy *= 0.94;
    }

    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += (sw.maxRadius - sw.radius) * 10 * dt;
      sw.alpha -= 2.4 * dt;
      if (sw.alpha <= 0) {
        this.shockwaves.splice(i, 1);
      }
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.age += dt;
      ft.y += ft.vy * dt;
      if (ft.age >= ft.life) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }
}
