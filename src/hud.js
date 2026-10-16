/**
 * @fileoverview Responsive Decoupled 3-Row Flex HUD & Modal System for Nebula Drops: Fusion Core
 * Architectural Guarantee (Zero Overlap / Zero Small Screen):
 * - Row 1 (#hud-top-bar): Solid flex header with Sector, Timer, Next Orb, Utility Buttons,
 *   Live 3-Star Progress Bar (★1 / ★★2 / ★★★3 thresholds), Goal Core badge, and "FINISH SECTOR" button
 * - Row 2 (#canvas-wrap): Flex-grow 100% full-bleed interactive gameplay canvas container
 * - Row 3 (#hud-bottom-bar): Solid flex footer with Tactical Abilities (Pulse, Vent, Catalyst)
 * - Modals attached to document.body with z-index 99999
 */

import { i18n } from './i18n.js';
import { sound } from './audio.js';
import { storage } from './storage.js';
import { ORB_TIERS, SECTORS } from './levels.js';
import { crazyGames } from './crazygames.js';
import { dailyRewards } from './daily_rewards.js';
import { shopManager, SKINS_DEF } from './shop.js';
import { achievements, ACHIEVEMENTS_DEF } from './achievements.js';

export class GameHUD {
  constructor(stageElement, callbacks = {}) {
    this.stage = stageElement;
    this.callbacks = callbacks;

    this.pulseUses = 2;
    this.ventUses = 2;
    this.catalystUses = 1;
    this.hammerUses = storage.data.hammerCount !== undefined ? storage.data.hammerCount : 2;
    this.undoUses = storage.data.undoCount !== undefined ? storage.data.undoCount : 2;
    this.currentGameMode = 'normal';
    this.doubleClaimed = false;
    this.lastStatus = null;

    this._buildDOM();
    i18n.onChange(() => this.refreshTexts());
  }

  _buildDOM() {
    const existingCanvas = this.stage.querySelector('#game-canvas');

    // ── ROW 1: SOLID FLEX HEADER (#hud-top-bar) ─────────────────────────────
    this.topBar = document.createElement('header');
    this.topBar.id = 'hud-top-bar';
    this.topBar.className = 'hud-top-bar';

    // Top Row: Sector Badge, Timer, Next Orb, Utility Buttons
    this.topRow = document.createElement('div');
    this.topRow.className = 'hud-top-row';

    const leftCluster = document.createElement('div');
    leftCluster.className = 'hud-left-cluster';

    this.sectorBadge = document.createElement('div');
    this.sectorBadge.className = 'hud-pill hud-pill-cyan';
    this.sectorBadge.id = 'hud-sector-label';
    this.sectorBadge.textContent = 'SETOR 01';

    this.timerBox = document.createElement('div');
    this.timerBox.className = 'hud-pill';
    this.timerValue = document.createElement('span');
    this.timerValue.id = 'hud-timer-value';
    this.timerValue.textContent = '02:30';
    this.timerBox.appendChild(this.timerValue);

    this.nextOrbPill = document.createElement('div');
    this.nextOrbPill.className = 'hud-pill hud-pill-compact';
    this.nextOrbLabel = document.createElement('span');
    this.nextOrbLabel.textContent = i18n.t('nextOrb') + ':';
    this.nextOrbDot = document.createElement('span');
    this.nextOrbDot.className = 'hud-orb-dot';
    this.nextOrbSymbol = document.createElement('strong');
    this.nextOrbSymbol.textContent = 'H+';
    this.nextOrbPill.appendChild(this.nextOrbLabel);
    this.nextOrbPill.appendChild(this.nextOrbDot);
    this.nextOrbPill.appendChild(this.nextOrbSymbol);

    leftCluster.appendChild(this.sectorBadge);
    leftCluster.appendChild(this.timerBox);
    leftCluster.appendChild(this.nextOrbPill);

    // Utility button cluster
    const btnCluster = document.createElement('div');
    btnCluster.className = 'hud-btn-cluster';

    this.btnMode = document.createElement('button');
    this.btnMode.className = 'hud-mode-btn';
    this.btnMode.title = 'Switch Mode';
    this.btnMode.textContent = i18n.t('modeNormal');
    this.btnMode.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      const modes = ['normal', 'overdrive', 'time_attack'];
      const nextIdx = (modes.indexOf(this.currentGameMode) + 1) % modes.length;
      this.currentGameMode = modes[nextIdx];
      this._updateModeBtnText();
      if (this.callbacks.onSetGameMode) this.callbacks.onSetGameMode(this.currentGameMode);
    });

    this.btnDaily = document.createElement('button');
    this.btnDaily.className = 'hud-icon-btn hud-btn-amber';
    this.btnDaily.title = 'Daily Login Rewards';
    this.btnDaily.textContent = '🎁';
    this.btnDaily.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      this.openDailyRewardsModal();
    });

    this.btnShop = document.createElement('button');
    this.btnShop.className = 'hud-icon-btn hud-btn-purple';
    this.btnShop.title = 'Cosmetic Skins Shop';
    this.btnShop.textContent = '🎨';
    this.btnShop.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      this.openShopModal();
    });

    this.btnAchievements = document.createElement('button');
    this.btnAchievements.className = 'hud-icon-btn hud-btn-emerald';
    this.btnAchievements.title = 'Achievements Vault';
    this.btnAchievements.textContent = '🏆';
    this.btnAchievements.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      this.openAchievementsModal();
    });

    this.btnEvo = document.createElement('button');
    this.btnEvo.className = 'hud-icon-btn hud-btn-accent';
    this.btnEvo.title = 'Evolution & Star Guide';
    this.btnEvo.textContent = i18n.t('btnEvoGuide');
    this.btnEvo.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      this.openEvolutionModal();
    });

    this.btnLevels = document.createElement('button');
    this.btnLevels.className = 'hud-icon-btn';
    this.btnLevels.title = 'Sector Select';
    this.btnLevels.textContent = '[::]';
    this.btnLevels.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      this.openLevelSelectModal();
    });

    this.btnLang = document.createElement('button');
    this.btnLang.className = 'hud-icon-btn';
    this.btnLang.textContent = i18n.lang.toUpperCase();
    this.btnLang.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      const next = i18n.toggleLang();
      this.btnLang.textContent = next.toUpperCase();
    });

    this.btnMute = document.createElement('button');
    this.btnMute.className = 'hud-icon-btn';
    this.btnMute.title = sound.isMuted ? 'Unmute Audio' : 'Mute Audio';
    this.btnMute.textContent = sound.isMuted ? '🔇' : '🔊';
    this.btnMute.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      const muted = sound.toggleMute();
      this.btnMute.textContent = muted ? '🔇' : '🔊';
      this.btnMute.title = muted ? 'Unmute Audio' : 'Mute Audio';
    });

    this.btnPause = document.createElement('button');
    this.btnPause.className = 'hud-icon-btn';
    this.btnPause.textContent = 'II';
    this.btnPause.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      this.openPauseModal();
    });

    btnCluster.appendChild(this.btnMode);
    btnCluster.appendChild(this.btnDaily);
    btnCluster.appendChild(this.btnShop);
    btnCluster.appendChild(this.btnAchievements);
    btnCluster.appendChild(this.btnEvo);
    btnCluster.appendChild(this.btnLevels);
    btnCluster.appendChild(this.btnLang);
    btnCluster.appendChild(this.btnMute);
    btnCluster.appendChild(this.btnPause);

    this.topRow.appendChild(leftCluster);
    this.topRow.appendChild(btnCluster);
    this.topBar.appendChild(this.topRow);

    // ── Second Header Row: Visual 3-Star Progress Bar & Clear Objective ─────
    this.missionRow = document.createElement('div');
    this.missionRow.className = 'hud-mission-row';

    // Left/Center: 3-Star Progress Track with ★1, ★★2, ★★★3 markers
    this.starBarContainer = document.createElement('div');
    this.starBarContainer.className = 'hud-star-bar-container';

    this.starHeaderLine = document.createElement('div');
    this.starHeaderLine.className = 'hud-star-header-line';

    this.scoreValue = document.createElement('span');
    this.scoreValue.id = 'hud-score-value';
    this.scoreValue.className = 'hud-score-text';
    this.scoreValue.textContent = 'PONTOS: 0';

    this.starMilestonesRow = document.createElement('div');
    this.starMilestonesRow.className = 'hud-star-milestones';

    this.star1Badge = document.createElement('span');
    this.star1Badge.className = 'hud-star-badge';
    this.star1Badge.textContent = '★ 150';

    this.star2Badge = document.createElement('span');
    this.star2Badge.className = 'hud-star-badge';
    this.star2Badge.textContent = '★★ 260';

    this.star3Badge = document.createElement('span');
    this.star3Badge.className = 'hud-star-badge';
    this.star3Badge.textContent = '★★★ 400';

    this.starMilestonesRow.appendChild(this.star1Badge);
    this.starMilestonesRow.appendChild(this.star2Badge);
    this.starMilestonesRow.appendChild(this.star3Badge);

    this.starHeaderLine.appendChild(this.scoreValue);
    this.starHeaderLine.appendChild(this.starMilestonesRow);

    this.starTrack = document.createElement('div');
    this.starTrack.className = 'hud-star-track';
    this.starFill = document.createElement('div');
    this.starFill.className = 'hud-star-fill';
    this.starTrack.appendChild(this.starFill);

    this.starBarContainer.appendChild(this.starHeaderLine);
    this.starBarContainer.appendChild(this.starTrack);

    // Right: Target Core Pill + Complete Sector Button (when >= 1★ reached)
    this.goalRightGroup = document.createElement('div');
    this.goalRightGroup.className = 'hud-goal-right-group';

    this.targetPill = document.createElement('div');
    this.targetPill.className = 'hud-pill hud-pill-compact hud-target-pill';
    this.targetLabel = document.createElement('span');
    this.targetLabel.textContent = i18n.t('targetTier') + ':';
    this.targetDot = document.createElement('span');
    this.targetDot.className = 'hud-orb-dot';
    this.targetSymbol = document.createElement('strong');
    this.targetSymbol.textContent = 'Li (T3)';
    this.targetPill.appendChild(this.targetLabel);
    this.targetPill.appendChild(this.targetDot);
    this.targetPill.appendChild(this.targetSymbol);

    this.btnCompleteSector = document.createElement('button');
    this.btnCompleteSector.id = 'btn-complete-sector-early';
    this.btnCompleteSector.className = 'hud-complete-sector-btn hidden';
    this.btnCompleteSector.textContent = `${i18n.t('completeSectorNow')} (★1) ➔`;
    this.btnCompleteSector.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      if (this.callbacks.onCompleteSectorEarly) {
        this.callbacks.onCompleteSectorEarly();
      }
    });

    this.goalRightGroup.appendChild(this.targetPill);
    this.goalRightGroup.appendChild(this.btnCompleteSector);

    this.missionRow.appendChild(this.starBarContainer);
    this.missionRow.appendChild(this.goalRightGroup);
    this.topBar.appendChild(this.missionRow);

    // ── ROW 2: MIDDLE CANVAS WRAPPER (#canvas-wrap) ─────────────────────────
    this.canvasWrap = document.createElement('main');
    this.canvasWrap.id = 'canvas-wrap';
    this.canvasWrap.className = 'canvas-wrap';

    if (existingCanvas) {
      this.canvasWrap.appendChild(existingCanvas);
    }

    // Danger Countdown Banner (inside canvas-wrap top center)
    this.dangerBanner = document.createElement('div');
    this.dangerBanner.id = 'hud-danger-banner';
    this.dangerBanner.className = 'hud-danger-banner hidden';
    this.canvasWrap.appendChild(this.dangerBanner);

    // ── ROW 3: SOLID FLEX FOOTER (#hud-bottom-bar) ──────────────────────────
    this.bottomBar = document.createElement('footer');
    this.bottomBar.id = 'hud-bottom-bar';
    this.bottomBar.className = 'hud-bottom-bar';

    this.btnPulse = document.createElement('button');
    this.btnPulse.id = 'btn-tactical-pulse';
    this.btnPulse.className = 'hud-action-btn';
    this.btnPulse.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      if (this.callbacks.onTriggerPulse) this.callbacks.onTriggerPulse();
    });

    this.btnVent = document.createElement('button');
    this.btnVent.id = 'btn-tactical-vent';
    this.btnVent.className = 'hud-action-btn';
    this.btnVent.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      if (this.callbacks.onTriggerVent) this.callbacks.onTriggerVent();
    });

    this.btnCatalyst = document.createElement('button');
    this.btnCatalyst.id = 'btn-tactical-catalyst';
    this.btnCatalyst.className = 'hud-action-btn hud-btn-gold';
    this.btnCatalyst.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      if (this.callbacks.onTriggerCatalyst) this.callbacks.onTriggerCatalyst();
    });

    this.btnHammer = document.createElement('button');
    this.btnHammer.id = 'btn-tactical-hammer';
    this.btnHammer.className = 'hud-action-btn hud-btn-rose';
    this.btnHammer.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      if (this.callbacks.onTriggerHammer) this.callbacks.onTriggerHammer();
    });

    this.btnUndo = document.createElement('button');
    this.btnUndo.id = 'btn-tactical-undo';
    this.btnUndo.className = 'hud-action-btn hud-btn-teal';
    this.btnUndo.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      if (this.callbacks.onTriggerUndo) this.callbacks.onTriggerUndo();
    });

    this.bottomBar.appendChild(this.btnPulse);
    this.bottomBar.appendChild(this.btnVent);
    this.bottomBar.appendChild(this.btnCatalyst);
    this.bottomBar.appendChild(this.btnHammer);
    this.bottomBar.appendChild(this.btnUndo);

    // Assemble 3-Row Flex Hierarchy inside #game-stage
    this.stage.innerHTML = '';
    this.stage.appendChild(this.topBar);
    this.stage.appendChild(this.canvasWrap);
    this.stage.appendChild(this.bottomBar);

    // ── 4. MODAL BACKDROP (ATTACHED TO BODY TO PREVENT ANY CLIPPING) ────────
    this.modalBackdrop = document.createElement('div');
    this.modalBackdrop.id = 'hud-modal-backdrop';
    this.modalBackdrop.className = 'hud-modal-backdrop hidden';
    this.modalBackdrop.addEventListener('pointerdown', (e) => e.stopPropagation());
    document.body.appendChild(this.modalBackdrop);

    this.updateTacticalButtons(this.pulseUses, this.ventUses, this.catalystUses, this.hammerUses, this.undoUses);
  }

  _updateModeBtnText() {
    if (!this.btnMode) return;
    if (this.currentGameMode === 'overdrive') {
      this.btnMode.textContent = i18n.t('modeOverdrive');
      this.btnMode.className = 'hud-mode-btn hud-mode-overdrive';
    } else if (this.currentGameMode === 'time_attack') {
      this.btnMode.textContent = i18n.t('modeTimeAttack');
      this.btnMode.className = 'hud-mode-btn hud-mode-timeattack';
    } else {
      this.btnMode.textContent = i18n.t('modeNormal');
      this.btnMode.className = 'hud-mode-btn';
    }
  }

  refreshTexts() {
    this.nextOrbLabel.textContent = i18n.t('nextOrb') + ':';
    this.targetLabel.textContent = i18n.t('targetTier') + ':';
    this.btnEvo.textContent = i18n.t('btnEvoGuide');
    this.btnLang.textContent = i18n.lang.toUpperCase();
    this.btnMute.textContent = sound.isMuted ? '🔇' : '🔊';
    this.btnMute.title = sound.isMuted ? 'Unmute Audio' : 'Mute Audio';
    this._updateModeBtnText();
    this.updateTacticalButtons(this.pulseUses, this.ventUses, this.catalystUses, this.hammerUses, this.undoUses);
    if (this.lastStatus) {
      this.updateStatus(this.lastStatus);
    }
  }

  updateStatus(status) {
    this.lastStatus = status;
    const {
      sectorId,
      isEndless,
      score,
      targetScore,
      star1Score,
      star2Score,
      star3Score,
      timeRemaining,
      nextTier,
      targetTier
    } = status;

    const s1 = star1Score || targetScore || 150;
    const s2 = star2Score || Math.round(s1 * 1.6);
    const s3 = star3Score || Math.round(s1 * 2.4);

    if (isEndless) {
      this.sectorBadge.textContent = i18n.t('endlessMode');
      this.scoreValue.textContent = `${i18n.t('score')}: ${score}`;
      this.timerValue.textContent = `★ ${storage.data.highScore}`;
      this.starMilestonesRow.style.display = 'none';
      this.starFill.style.width = '100%';
      this.btnCompleteSector.className = 'hud-complete-sector-btn hidden';
    } else {
      this.sectorBadge.textContent = `${i18n.t('sector')} ${String(sectorId).padStart(2, '0')}`;
      this.scoreValue.textContent = `${i18n.t('score')}: ${score}`;

      const mins = Math.floor(Math.max(0, timeRemaining) / 60);
      const secs = Math.floor(Math.max(0, timeRemaining) % 60);
      this.timerValue.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      this.timerBox.style.borderColor = timeRemaining < 20 ? '#ef4444' : 'rgba(0, 245, 255, 0.35)';

      this.starMilestonesRow.style.display = 'flex';
      this.star1Badge.textContent = `★ ${s1}`;
      this.star2Badge.textContent = `★★ ${s2}`;
      this.star3Badge.textContent = `★★★ ${s3}`;

      const has1 = score >= s1;
      const has2 = score >= s2;
      const has3 = score >= s3;

      this.star1Badge.className = `hud-star-badge ${has1 ? 'earned' : ''}`;
      this.star2Badge.className = `hud-star-badge ${has2 ? 'earned' : ''}`;
      this.star3Badge.className = `hud-star-badge ${has3 ? 'earned' : ''}`;

      const pct = Math.min(100, (score / Math.max(1, s3)) * 100);
      this.starFill.style.width = `${pct}%`;

      if (has1) {
        const currentStars = has3 ? 3 : has2 ? 2 : 1;
        const starsStr = '★'.repeat(currentStars);
        this.btnCompleteSector.className = 'hud-complete-sector-btn';
        this.btnCompleteSector.textContent = `${i18n.t('completeSectorNow')} (${starsStr}) ➔`;
      } else {
        this.btnCompleteSector.className = 'hud-complete-sector-btn hidden';
      }
    }

    const nextCfg = ORB_TIERS[Math.max(0, Math.min(ORB_TIERS.length - 1, (nextTier || 1) - 1))];
    this.nextOrbDot.style.background = nextCfg.color;
    this.nextOrbDot.style.boxShadow = `0 0 8px ${nextCfg.color}`;
    this.nextOrbSymbol.textContent = nextCfg.symbol;

    const targetCfg = ORB_TIERS[Math.max(0, Math.min(ORB_TIERS.length - 1, (targetTier || 3) - 1))];
    this.targetDot.style.background = targetCfg.color;
    this.targetDot.style.boxShadow = `0 0 8px ${targetCfg.color}`;
    this.targetSymbol.textContent = `${targetCfg.symbol} (T${targetCfg.tier})`;
  }

  updateTacticalButtons(pulseCount, ventCount, catalystCount, hammerCount = 2, undoCount = 2) {
    this.pulseUses = pulseCount;
    this.ventUses = ventCount;
    this.catalystUses = catalystCount;
    this.hammerUses = hammerCount;
    this.undoUses = undoCount;

    this.btnPulse.textContent = `⚡ ${i18n.t('btnPulse')} (${pulseCount})`;
    this.btnPulse.disabled = pulseCount <= 0;

    this.btnVent.textContent = `🔥 ${i18n.t('btnVent')} (${ventCount})`;
    this.btnVent.disabled = ventCount <= 0;

    this.btnCatalyst.textContent = `★ ${i18n.t('btnCatalyst')} (${catalystCount})`;
    this.btnCatalyst.disabled = catalystCount <= 0;

    const hammerLabel = hammerCount > 0 ? `(${hammerCount})` : `[+2 Ad]`;
    this.btnHammer.textContent = `🔨 ${i18n.t('hammer')} ${hammerLabel}`;

    const undoLabel = undoCount > 0 ? `(${undoCount})` : `[+2 Ad]`;
    this.btnUndo.textContent = `↩️ ${i18n.t('undo')} ${undoLabel}`;
  }

  setDangerVisible(visible, isShielded = false, secondsLeft = 5.0) {
    if (isShielded) {
      this.dangerBanner.className = 'hud-danger-banner hud-shield-banner';
      this.dangerBanner.textContent = i18n.t('shieldActive');
    } else if (visible) {
      this.dangerBanner.className = 'hud-danger-banner';
      const secStr = secondsLeft.toFixed(1);
      this.dangerBanner.textContent = `${i18n.t('dangerWarning')} ${i18n.t('meltdownIn')} ${secStr}s!`;
    } else {
      this.dangerBanner.className = 'hud-danger-banner hidden';
    }
  }

  closeModal() {
    this.modalBackdrop.className = 'hud-modal-backdrop hidden';
    this.modalBackdrop.innerHTML = '';
  }

  // ── EVOLUTION CHAIN & STAR RULES MODAL ───────────────────────────────────
  openEvolutionModal() {
    if (this.callbacks.onPause) this.callbacks.onPause();
    crazyGames.gameplayStop();

    this.modalBackdrop.innerHTML = '';
    this.modalBackdrop.className = 'hud-modal-backdrop';

    const card = document.createElement('div');
    card.className = 'hud-modal-card hud-modal-wide';

    const header = document.createElement('div');
    header.className = 'hud-modal-header';

    const title = document.createElement('h2');
    title.className = 'hud-modal-title';
    title.textContent = i18n.t('evolutionModalTitle');

    const closeBtn = document.createElement('button');
    closeBtn.className = 'hud-icon-btn';
    closeBtn.textContent = 'X';
    closeBtn.addEventListener('pointerdown', () => {
      this.closeModal();
      if (this.callbacks.onResume) this.callbacks.onResume();
    });

    header.appendChild(title);
    header.appendChild(closeBtn);
    card.appendChild(header);

    // Clear Star Rating Explanation Box
    const starGuideBox = document.createElement('div');
    starGuideBox.className = 'hud-star-guide-box';
    const isPt = i18n.lang === 'pt';
    starGuideBox.innerHTML = isPt
      ? `<div><strong>COMO PASSAR DE FASE E GANHAR ESTRELAS:</strong></div>
         <div>★ <strong>1 Estrela:</strong> Atingir a pontuação mínima (libera o botão <em>"✅ CONCLUIR FASE"</em>).</div>
         <div>★★ <strong>2 Estrelas:</strong> Atingir a pontuação intermediária da fase.</div>
         <div>★★★ <strong>3 Estrelas:</strong> Atingir a pontuação máxima OU fundir o <strong>Núcleo Alvo</strong> da fase!</div>`
      : `<div><strong>HOW TO PASS SECTORS & EARN STARS:</strong></div>
         <div>★ <strong>1 Star:</strong> Reach the base score quota (unlocks the <em>"✅ FINISH SECTOR"</em> button).</div>
         <div>★★ <strong>2 Stars:</strong> Reach the high score threshold for the sector.</div>
         <div>★★★ <strong>3 Stars:</strong> Reach the master score threshold OR synthesize the sector's <strong>Goal Core</strong>!</div>`;
    card.appendChild(starGuideBox);

    const sub = document.createElement('p');
    sub.className = 'hud-modal-sub';
    sub.textContent = i18n.t('evolutionModalSub');
    card.appendChild(sub);

    const scrollWrap = document.createElement('div');
    scrollWrap.className = 'hud-level-scroll';

    const list = document.createElement('div');
    list.style.cssText = 'display: flex; flex-direction: column; gap: 6px;';

    ORB_TIERS.forEach((t, idx) => {
      const row = document.createElement('div');
      row.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 7px 12px;
        background: rgba(15, 23, 42, 0.78);
        border: 1px solid rgba(56, 189, 248, 0.25);
        border-radius: 8px;
      `;

      const left = document.createElement('div');
      left.style.cssText = 'display: flex; align-items: center; gap: 10px;';

      const orbIcon = document.createElement('div');
      orbIcon.style.cssText = `
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background: ${t.color};
        box-shadow: 0 0 10px ${t.color};
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 900;
        font-size: 12px;
        color: #020617;
      `;
      orbIcon.textContent = t.symbol;

      const info = document.createElement('div');
      info.style.cssText = 'display: flex; flex-direction: column; text-align: left;';
      const name = document.createElement('span');
      name.style.cssText = 'font-weight: 800; font-size: 12.5px; color: #f8fafc;';
      name.textContent = `T${t.tier}. ${i18n.getTierName(t.tier)}`;
      const formula = document.createElement('span');
      formula.style.cssText = 'font-size: 11px; color: #94a3b8;';
      const prev = idx > 0 ? ORB_TIERS[idx - 1].symbol : '—';
      formula.textContent = idx > 0 ? `${prev} + ${prev} ➔ ${t.symbol}` : (isPt ? 'Núcleo Inicial' : 'Starter Particle');

      info.appendChild(name);
      info.appendChild(formula);
      left.appendChild(orbIcon);
      left.appendChild(info);

      const pts = document.createElement('div');
      pts.style.cssText = 'font-weight: 800; font-size: 12px; color: #38bdf8;';
      pts.textContent = `+${t.points} pts`;

      row.appendChild(left);
      row.appendChild(pts);
      list.appendChild(row);
    });

    scrollWrap.appendChild(list);
    card.appendChild(scrollWrap);
    this.modalBackdrop.appendChild(card);
  }

  // ── PAUSE MODAL ───────────────────────────────────────────────────────────
  openPauseModal() {
    if (this.callbacks.onPause) this.callbacks.onPause();
    crazyGames.gameplayStop();

    this.modalBackdrop.innerHTML = '';
    this.modalBackdrop.className = 'hud-modal-backdrop';

    const card = document.createElement('div');
    card.className = 'hud-modal-card';

    const title = document.createElement('h2');
    title.className = 'hud-modal-title';
    title.textContent = i18n.t('pausedTitle');
    card.appendChild(title);

    const btnResume = this._createModalBtn(i18n.t('resumeBtn'), 'primary', () => {
      this.closeModal();
      if (this.callbacks.onResume) this.callbacks.onResume();
    });

    const btnRestart = this._createModalBtn(i18n.t('restartBtn'), 'secondary', () => {
      this.closeModal();
      if (this.callbacks.onRestart) this.callbacks.onRestart();
    });

    const btnSelect = this._createModalBtn(i18n.t('levelSelectBtn'), 'secondary', () => {
      this.openLevelSelectModal();
    });

    const btnEndless = this._createModalBtn(i18n.t('endlessBtn'), 'gold', () => {
      this.closeModal();
      if (this.callbacks.onStartEndless) this.callbacks.onStartEndless();
    });

    card.appendChild(btnResume);
    card.appendChild(btnRestart);
    card.appendChild(btnSelect);
    card.appendChild(btnEndless);
    this.modalBackdrop.appendChild(card);
  }

  // ── VISUAL LEVEL SELECT MODAL (RULE 10: 3-COLUMN CARDS & 3 STARS) ────────
  openLevelSelectModal() {
    if (this.callbacks.onPause) this.callbacks.onPause();
    crazyGames.gameplayStop();

    this.modalBackdrop.innerHTML = '';
    this.modalBackdrop.className = 'hud-modal-backdrop';

    const card = document.createElement('div');
    card.className = 'hud-modal-card hud-modal-wide';

    const headerRow = document.createElement('div');
    headerRow.className = 'hud-modal-header';

    const title = document.createElement('h2');
    title.className = 'hud-modal-title';
    title.textContent = i18n.t('selectSectorTitle');

    const closeBtn = document.createElement('button');
    closeBtn.className = 'hud-icon-btn';
    closeBtn.textContent = 'X';
    closeBtn.addEventListener('pointerdown', () => {
      this.closeModal();
      if (this.callbacks.onResume) this.callbacks.onResume();
    });

    headerRow.appendChild(title);
    headerRow.appendChild(closeBtn);
    card.appendChild(headerRow);

    const sub = document.createElement('p');
    sub.className = 'hud-modal-sub';
    sub.textContent = i18n.t('selectSectorSub');
    card.appendChild(sub);

    const scrollWrap = document.createElement('div');
    scrollWrap.className = 'hud-level-scroll';

    const grid = document.createElement('div');
    grid.className = 'hud-level-grid';

    const maxUnlocked = storage.data.maxLevel || 1;
    const savedStars = storage.data.stars || {};

    SECTORS.forEach((sec) => {
      const unlocked = sec.id <= maxUnlocked;
      const starCount = Number(savedStars[sec.id]) || 0;
      const targetOrb = ORB_TIERS[sec.targetTier - 1];

      const item = document.createElement('div');
      item.className = `hud-sector-card ${unlocked ? '' : 'locked'}`;

      const thumb = document.createElement('div');
      thumb.className = 'hud-sector-thumb';
      thumb.style.background = `radial-gradient(circle at 50% 45%, ${targetOrb.color}44, #070e20 85%)`;
      thumb.style.borderColor = unlocked ? targetOrb.color : '#334155';

      const orbPreview = document.createElement('div');
      orbPreview.className = 'hud-sector-orb-preview';
      orbPreview.style.background = targetOrb.color;
      orbPreview.style.boxShadow = `0 0 16px ${targetOrb.color}`;
      orbPreview.textContent = targetOrb.symbol;
      thumb.appendChild(orbPreview);
      item.appendChild(thumb);

      const secTitle = document.createElement('div');
      secTitle.className = 'hud-sector-name';
      const localizedName = i18n.lang === 'pt' ? sec.namePt : sec.nameEn;
      secTitle.textContent = `${sec.id}. ${localizedName}`;
      item.appendChild(secTitle);

      const secMeta = document.createElement('div');
      secMeta.className = 'hud-sector-meta';
      secMeta.innerHTML = `★ ${sec.star1Score} • ★★ ${sec.star2Score} • ★★★ ${sec.star3Score}<br/>${i18n.t('goalTier')}: <strong>${targetOrb.symbol} (T${sec.targetTier})</strong>`;
      item.appendChild(secMeta);

      const starsRow = document.createElement('div');
      starsRow.className = 'hud-sector-stars';
      starsRow.textContent = [1, 2, 3].map((s) => (s <= starCount ? '★' : '☆')).join(' ');
      item.appendChild(starsRow);

      const actionBtn = document.createElement('button');
      actionBtn.className = `hud-sector-btn ${unlocked ? 'unlocked' : ''}`;
      actionBtn.disabled = !unlocked;
      actionBtn.textContent = unlocked ? i18n.t('launchSector') : i18n.t('lockedSector');
      if (unlocked) {
        actionBtn.addEventListener('pointerdown', () => {
          this.closeModal();
          if (this.callbacks.onSelectLevel) this.callbacks.onSelectLevel(sec.id);
        });
      }
      item.appendChild(actionBtn);

      grid.appendChild(item);
    });

    scrollWrap.appendChild(grid);
    card.appendChild(scrollWrap);
    this.modalBackdrop.appendChild(card);
  }

  // ── VICTORY MODAL (WITH CLEAR 1★, 2★, 3★ BREAKDOWN) ──────────────────────
  openVictoryModal({ sectorId, score, starsEarned, shardsEarned }) {
    this.doubleClaimed = false;
    this.modalBackdrop.innerHTML = '';
    this.modalBackdrop.className = 'hud-modal-backdrop';

    const sec = SECTORS[Math.max(0, Math.min(SECTORS.length - 1, (sectorId || 1) - 1))];

    const card = document.createElement('div');
    card.className = 'hud-modal-card';

    const title = document.createElement('h2');
    title.className = 'hud-modal-title hud-title-gold';
    title.textContent = i18n.t('victoryTitle');
    card.appendChild(title);

    const starsEl = document.createElement('div');
    starsEl.className = 'hud-victory-stars';
    starsEl.textContent = [1, 2, 3].map((s) => (s <= starsEarned ? '★' : '☆')).join(' ');
    card.appendChild(starsEl);

    const sub = document.createElement('p');
    sub.className = 'hud-modal-sub';
    sub.textContent = `${i18n.t('score')}: ${score} pts`;
    card.appendChild(sub);

    // 1★, 2★, 3★ Breakdown Table so the player always sees why they got 1, 2, or 3 stars
    const breakdown = document.createElement('div');
    breakdown.className = 'hud-star-guide-box';
    breakdown.innerHTML = `
      <div style="font-size:11px; color:#94a3b8; margin-bottom:4px;">${i18n.t('starBreakdownTitle')}</div>
      <div style="display:flex; justify-content:space-around; font-weight:800; font-size:12px;">
        <span style="color:${starsEarned >= 1 ? '#facc15' : '#64748b'}">★ ${sec.star1Score}</span>
        <span style="color:${starsEarned >= 2 ? '#facc15' : '#64748b'}">★★ ${sec.star2Score}</span>
        <span style="color:${starsEarned >= 3 ? '#facc15' : '#64748b'}">★★★ ${sec.star3Score}</span>
      </div>
    `;
    card.appendChild(breakdown);

    const shardText = document.createElement('div');
    shardText.className = 'hud-shard-reward';
    shardText.textContent = `${i18n.t('shardsEarned')}: +${shardsEarned} ♦`;
    card.appendChild(shardText);

    const statusMsg = document.createElement('div');
    statusMsg.className = 'hud-ad-status';
    card.appendChild(statusMsg);

    // Rewarded Ad 2: Double Plasma Shards
    const btnDouble = this._createModalBtn(i18n.t('doubleRewardBtn'), 'gold', () => {
      if (this.doubleClaimed) return;
      crazyGames.requestRewardedAd(
        'double_shards',
        () => {
          this.doubleClaimed = true;
          storage.addShards(shardsEarned);
          shardText.textContent = `${i18n.t('shardsEarned')}: +${shardsEarned * 2} ♦ (2X!)`;
          btnDouble.textContent = i18n.t('rewardClaimed');
          btnDouble.disabled = true;
          sound.playVictory();
        },
        () => {
          statusMsg.textContent = i18n.t('adErrorMsg');
        }
      );
    });
    card.appendChild(btnDouble);

    const btnNext = this._createModalBtn(i18n.t('nextSectorBtn'), 'primary', () => {
      crazyGames.requestMidgameAd(() => {
        this.closeModal();
        const nextId = sectorId < SECTORS.length ? sectorId + 1 : 1;
        if (this.callbacks.onNextLevel) this.callbacks.onNextLevel(nextId);
      });
    });
    card.appendChild(btnNext);

    const btnSelect = this._createModalBtn(i18n.t('levelSelectBtn'), 'secondary', () => {
      this.openLevelSelectModal();
    });
    card.appendChild(btnSelect);

    this.modalBackdrop.appendChild(card);
  }

  // ── GAME OVER / MELTDOWN MODAL ───────────────────────────────────────────
  openGameOverModal({ reason, score, canRevive }) {
    this.modalBackdrop.innerHTML = '';
    this.modalBackdrop.className = 'hud-modal-backdrop';

    const card = document.createElement('div');
    card.className = 'hud-modal-card';

    const title = document.createElement('h2');
    title.className = 'hud-modal-title hud-title-danger';
    title.textContent = i18n.t('meltdownTitle');
    card.appendChild(title);

    const sub = document.createElement('p');
    sub.className = 'hud-modal-sub';
    sub.textContent = reason === 'timeout' ? i18n.t('meltdownTimeout') : i18n.t('meltdownOverflow');
    card.appendChild(sub);

    const scoreInfo = document.createElement('div');
    scoreInfo.className = 'hud-shard-reward';
    scoreInfo.textContent = `${i18n.t('score')}: ${score}`;
    card.appendChild(scoreInfo);

    const statusMsg = document.createElement('div');
    statusMsg.className = 'hud-ad-status';
    card.appendChild(statusMsg);

    if (canRevive) {
      const btnRevive = this._createModalBtn(i18n.t('reviveBtn'), 'gold', () => {
        crazyGames.requestRewardedAd(
          'revive',
          () => {
            this.closeModal();
            if (this.callbacks.onRevive) this.callbacks.onRevive();
          },
          () => {
            statusMsg.textContent = i18n.t('adErrorMsg');
          }
        );
      });
      card.appendChild(btnRevive);
    }

    const btnRetry = this._createModalBtn(i18n.t('retryBtn'), 'primary', () => {
      crazyGames.requestMidgameAd(() => {
        this.closeModal();
        if (this.callbacks.onRestart) this.callbacks.onRestart();
      });
    });
    card.appendChild(btnRetry);

    const btnSelect = this._createModalBtn(i18n.t('levelSelectBtn'), 'secondary', () => {
      this.openLevelSelectModal();
    });
    card.appendChild(btnSelect);

    this.modalBackdrop.appendChild(card);
  }

  _createModalBtn(label, variant, onClick) {
    const btn = document.createElement('button');
    btn.className = `hud-modal-btn hud-modal-btn-${variant}`;
    btn.textContent = label;
    btn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      onClick();
    });
    return btn;
  }

  openDailyRewardsModal() {
    if (this.callbacks.onPause) this.callbacks.onPause();
    crazyGames.gameplayStop();

    this.modalBackdrop.innerHTML = '';
    this.modalBackdrop.className = 'hud-modal-backdrop';

    const card = document.createElement('div');
    card.className = 'hud-modal-card hud-modal-wide';

    const header = document.createElement('div');
    header.className = 'hud-modal-header';

    const title = document.createElement('h2');
    title.className = 'hud-modal-title';
    title.textContent = `🎁 ${i18n.t('dailyRewards')}`;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'hud-icon-btn';
    closeBtn.textContent = 'X';
    closeBtn.addEventListener('pointerdown', () => {
      this.closeModal();
      if (this.callbacks.onResume) this.callbacks.onResume();
    });

    header.appendChild(title);
    header.appendChild(closeBtn);
    card.appendChild(header);

    const isPt = i18n.lang === 'pt';
    const sub = document.createElement('p');
    sub.className = 'hud-modal-sub';
    sub.textContent = isPt
      ? `Faça login diário para receber prêmios crescentes de Shards, Power-ups e Skins exclusivas!`
      : `Log in every day to claim escalating Plasma Shards, Power-ups, and exclusive Skins!`;
    card.appendChild(sub);

    const daysState = dailyRewards.getCalendarState();
    const grid = document.createElement('div');
    grid.className = 'hud-daily-grid';

    daysState.forEach((d) => {
      const dayCard = document.createElement('div');
      dayCard.className = `hud-daily-card ${d.status}`;

      const dTitle = document.createElement('div');
      dTitle.className = 'hud-daily-day';
      dTitle.textContent = isPt ? d.title : d.titleEn;

      const dIcon = document.createElement('div');
      dIcon.className = 'hud-daily-icon';
      dIcon.textContent = d.bonus === 'skin_zen_crystal' ? '💎' : d.bonus.startsWith('hammer') ? '🔨' : d.bonus.startsWith('undo') ? '↩️' : '♦';

      const dReward = document.createElement('div');
      dReward.className = 'hud-daily-reward';
      dReward.textContent = d.reward;

      const dBadge = document.createElement('div');
      dBadge.className = 'hud-daily-badge';
      if (d.status === 'claimed' || d.status === 'claimed_today') {
        dBadge.textContent = '✓ ' + (isPt ? 'COLETADO' : 'CLAIMED');
      } else if (d.status === 'available') {
        dBadge.textContent = '★ ' + (isPt ? 'DISPONÍVEL' : 'AVAILABLE');
      } else {
        dBadge.textContent = '🔒 ' + (isPt ? 'BLOQUEADO' : 'LOCKED');
      }

      dayCard.appendChild(dTitle);
      dayCard.appendChild(dIcon);
      dayCard.appendChild(dReward);
      dayCard.appendChild(dBadge);
      grid.appendChild(dayCard);
    });

    card.appendChild(grid);

    if (dailyRewards.canClaim) {
      const claimBtn = this._createModalBtn(`🎁 ${i18n.t('claimReward')} ➔`, 'gold', () => {
        const reward = dailyRewards.claimToday();
        if (reward) {
          sound.playVictory();
          this.hammerUses = storage.data.hammerCount || 2;
          this.undoUses = storage.data.undoCount || 2;
          this.updateTacticalButtons(this.pulseUses, this.ventUses, this.catalystUses, this.hammerUses, this.undoUses);
          this.openDailyRewardsModal();
        }
      });
      card.appendChild(claimBtn);
    } else {
      const waitNotice = document.createElement('div');
      waitNotice.className = 'hud-daily-notice';
      waitNotice.textContent = isPt
        ? '✓ Você já resgatou a recompensa de hoje! Volte amanhã para o próximo dia.'
        : "✓ You have already claimed today's reward! Return tomorrow for the next day.";
      card.appendChild(waitNotice);
    }

    this.modalBackdrop.appendChild(card);
  }

  openShopModal() {
    if (this.callbacks.onPause) this.callbacks.onPause();
    crazyGames.gameplayStop();

    this.modalBackdrop.innerHTML = '';
    this.modalBackdrop.className = 'hud-modal-backdrop';

    const card = document.createElement('div');
    card.className = 'hud-modal-card hud-modal-wide';

    const header = document.createElement('div');
    header.className = 'hud-modal-header';

    const title = document.createElement('h2');
    title.className = 'hud-modal-title';
    title.textContent = `🎨 ${i18n.t('shopTitle')}`;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'hud-icon-btn';
    closeBtn.textContent = 'X';
    closeBtn.addEventListener('pointerdown', () => {
      this.closeModal();
      if (this.callbacks.onResume) this.callbacks.onResume();
    });

    header.appendChild(title);
    header.appendChild(closeBtn);
    card.appendChild(header);

    const isPt = i18n.lang === 'pt';
    const shardsCount = storage.data.plasmaShards || 0;
    const shardsHeader = document.createElement('div');
    shardsHeader.className = 'hud-shop-balance';
    shardsHeader.textContent = `♦ ${isPt ? 'PLASMA SHARDS DISPONÍVEIS' : 'AVAILABLE PLASMA SHARDS'}: ${shardsCount}`;
    card.appendChild(shardsHeader);

    const scrollWrap = document.createElement('div');
    scrollWrap.className = 'hud-level-scroll';

    const grid = document.createElement('div');
    grid.className = 'hud-shop-grid';

    SKINS_DEF.forEach((s) => {
      const isEquipped = shopManager.getEquippedSkinId() === s.id;
      const isUnlocked = shopManager.isUnlocked(s.id);

      const skinCard = document.createElement('div');
      skinCard.className = `hud-shop-card ${isEquipped ? 'equipped' : ''}`;

      const swatch = document.createElement('div');
      swatch.className = 'hud-shop-swatch';
      swatch.style.background = `linear-gradient(135deg, ${s.accent}, #020617)`;
      swatch.style.boxShadow = `0 0 12px ${s.accent}88`;

      const info = document.createElement('div');
      info.className = 'hud-shop-info';

      const name = document.createElement('div');
      name.className = 'hud-shop-name';
      name.textContent = isPt ? s.namePt : s.nameEn;

      const desc = document.createElement('div');
      desc.className = 'hud-shop-desc';
      desc.textContent = isPt ? s.descPt : s.descEn;

      info.appendChild(name);
      info.appendChild(desc);

      const actionArea = document.createElement('div');
      actionArea.className = 'hud-shop-actions';

      if (isEquipped) {
        const eqBadge = document.createElement('span');
        eqBadge.className = 'hud-shop-equipped-badge';
        eqBadge.textContent = isPt ? '✓ EQUIPADA' : '✓ EQUIPPED';
        actionArea.appendChild(eqBadge);
      } else if (isUnlocked) {
        const btnEquip = document.createElement('button');
        btnEquip.className = 'hud-shop-btn hud-shop-btn-equip';
        btnEquip.textContent = i18n.t('equipSkin');
        btnEquip.addEventListener('pointerdown', (e) => {
          e.stopPropagation();
          shopManager.equip(s.id);
          this.openShopModal();
        });
        actionArea.appendChild(btnEquip);
      } else {
        const btnBuy = document.createElement('button');
        btnBuy.className = 'hud-shop-btn hud-shop-btn-buy';
        btnBuy.textContent = `♦ ${s.cost} ${i18n.t('buyShards')}`;
        btnBuy.addEventListener('pointerdown', (e) => {
          e.stopPropagation();
          const res = shopManager.buyWithShards(s.id);
          if (res.success) {
            sound.playVictory();
            this.openShopModal();
          } else {
            alert(isPt ? `Shards insuficientes! Faltam ${res.needed} shards.` : `Not enough shards! Need ${res.needed} more.`);
          }
        });

        const btnAd = document.createElement('button');
        btnAd.className = 'hud-shop-btn hud-shop-btn-ad';
        btnAd.textContent = `[🎬] ${i18n.t('unlockAd')}`;
        btnAd.addEventListener('pointerdown', async (e) => {
          e.stopPropagation();
          const ok = await shopManager.unlockWithAd(s.id);
          if (ok) {
            sound.playVictory();
            this.openShopModal();
          }
        });

        actionArea.appendChild(btnBuy);
        actionArea.appendChild(btnAd);
      }

      skinCard.appendChild(swatch);
      skinCard.appendChild(info);
      skinCard.appendChild(actionArea);
      grid.appendChild(skinCard);
    });

    scrollWrap.appendChild(grid);
    card.appendChild(scrollWrap);
    this.modalBackdrop.appendChild(card);
  }

  openAchievementsModal() {
    if (this.callbacks.onPause) this.callbacks.onPause();
    crazyGames.gameplayStop();

    this.modalBackdrop.innerHTML = '';
    this.modalBackdrop.className = 'hud-modal-backdrop';

    const card = document.createElement('div');
    card.className = 'hud-modal-card hud-modal-wide';

    const header = document.createElement('div');
    header.className = 'hud-modal-header';

    const title = document.createElement('h2');
    title.className = 'hud-modal-title';
    title.textContent = `🏆 ${i18n.t('achievementsTitle')}`;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'hud-icon-btn';
    closeBtn.textContent = 'X';
    closeBtn.addEventListener('pointerdown', () => {
      this.closeModal();
      if (this.callbacks.onResume) this.callbacks.onResume();
    });

    header.appendChild(title);
    header.appendChild(closeBtn);
    card.appendChild(header);

    const isPt = i18n.lang === 'pt';
    const multPct = Math.round((achievements.getPermanentMultiplier() - 1.0) * 100);

    const multBanner = document.createElement('div');
    multBanner.className = 'hud-achievements-banner';
    multBanner.textContent = isPt
      ? `⚡ MULTIPLICADOR PASSIVO ATIVO: +${multPct}% DE PONTOS EM TODAS AS FUSÕES!`
      : `⚡ PASSIVE MULTIPLIER ACTIVE: +${multPct}% SCORE BONUS ON ALL FUSIONS!`;
    card.appendChild(multBanner);

    const scrollWrap = document.createElement('div');
    scrollWrap.className = 'hud-level-scroll';

    const list = document.createElement('div');
    list.className = 'hud-achievements-list';

    ACHIEVEMENTS_DEF.forEach((a) => {
      const isDone = achievements.isUnlocked(a.id);

      const aRow = document.createElement('div');
      aRow.className = `hud-achievement-row ${isDone ? 'unlocked' : ''}`;

      const aIcon = document.createElement('div');
      aIcon.className = 'hud-achievement-icon';
      aIcon.textContent = a.icon;

      const aDetails = document.createElement('div');
      aDetails.className = 'hud-achievement-details';

      const aTitle = document.createElement('div');
      aTitle.className = 'hud-achievement-title';
      aTitle.textContent = isPt ? a.titlePt : a.titleEn;

      const aDesc = document.createElement('div');
      aDesc.className = 'hud-achievement-desc';
      aDesc.textContent = isPt ? a.descPt : a.descEn;

      aDetails.appendChild(aTitle);
      aDetails.appendChild(aDesc);

      const aReward = document.createElement('div');
      aReward.className = 'hud-achievement-reward';
      aReward.textContent = `+${Math.round(a.multiplierBonus * 100)}% Mult`;

      const aStatus = document.createElement('div');
      aStatus.className = `hud-achievement-status ${isDone ? 'done' : 'locked'}`;
      aStatus.textContent = isDone ? (isPt ? '✓ CONQUISTADO' : '✓ UNLOCKED') : (isPt ? 'BLOQUEADO' : 'LOCKED');

      aRow.appendChild(aIcon);
      aRow.appendChild(aDetails);
      aRow.appendChild(aReward);
      aRow.appendChild(aStatus);
      list.appendChild(aRow);
    });

    scrollWrap.appendChild(list);
    card.appendChild(scrollWrap);
    this.modalBackdrop.appendChild(card);
  }
}
