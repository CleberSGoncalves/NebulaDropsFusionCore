/**
 * @fileoverview Responsive Decoupled HUD & Modal System for Nebula Drops: Fusion Core
 * - Top Bar: Compact, clean status (Sector, Score Quota, Timer, Evolution Chain button, Level Select, Lang, Mute, Pause)
 * - Next & Target Bar: Next Orb and Goal Core indicator
 * - Bottom Tactical Bar: Docked at the bottom (Pulso, Purgar, Catalisador) — NEVER covers the chamber
 * - Evolution Modal: On-demand visual inspection of all 11 tiers
 * - Level Select Modal: 3-column visual cards with 3 stars (Rule 10)
 * - Victory & Meltdown Modals: With CrazyGames SDK v3 Rewarded Ads
 */

import { i18n } from './i18n.js';
import { sound } from './audio.js';
import { storage } from './storage.js';
import { ORB_TIERS, SECTORS } from './levels.js';
import { crazyGames } from './crazygames.js';

export class GameHUD {
  constructor(stageElement, callbacks = {}) {
    this.stage = stageElement;
    this.callbacks = callbacks;

    this.pulseUses = 2;
    this.ventUses = 2;
    this.catalystUses = 1;
    this.doubleClaimed = false;

    this._buildDOM();
    i18n.onChange(() => this.refreshTexts());
  }

  _buildDOM() {
    this.root = document.createElement('div');
    this.root.id = 'hud-overlay';

    // ── 1. TOP HUD BAR ──────────────────────────────────────────────────────
    this.topBar = document.createElement('div');
    this.topBar.className = 'hud-top-bar';

    // Top Row: Sector, Score, Timer, Chain button, Levels, Lang, Mute, Pause
    this.topRow = document.createElement('div');
    this.topRow.className = 'hud-top-row';

    this.sectorBadge = document.createElement('div');
    this.sectorBadge.className = 'hud-pill hud-pill-cyan';
    this.sectorBadge.id = 'hud-sector-label';
    this.sectorBadge.textContent = 'SETOR 01';

    this.scoreBox = document.createElement('div');
    this.scoreBox.className = 'hud-pill';
    this.scoreValue = document.createElement('span');
    this.scoreValue.id = 'hud-score-value';
    this.scoreValue.textContent = '0 / 250';
    this.scoreBox.appendChild(this.scoreValue);

    this.timerBox = document.createElement('div');
    this.timerBox.className = 'hud-pill';
    this.timerValue = document.createElement('span');
    this.timerValue.id = 'hud-timer-value';
    this.timerValue.textContent = '02:00';
    this.timerBox.appendChild(this.timerValue);

    // Utility button cluster
    const btnCluster = document.createElement('div');
    btnCluster.className = 'hud-btn-cluster';

    this.btnEvo = document.createElement('button');
    this.btnEvo.className = 'hud-icon-btn hud-btn-accent';
    this.btnEvo.title = 'Evolution Chain';
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
    this.btnMute.textContent = sound.isMuted ? '[X]' : '[>]';
    this.btnMute.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      const muted = sound.toggleMute();
      this.btnMute.textContent = muted ? '[X]' : '[>]';
    });

    this.btnPause = document.createElement('button');
    this.btnPause.className = 'hud-icon-btn';
    this.btnPause.textContent = 'II';
    this.btnPause.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      this.openPauseModal();
    });

    btnCluster.appendChild(this.btnEvo);
    btnCluster.appendChild(this.btnLevels);
    btnCluster.appendChild(this.btnLang);
    btnCluster.appendChild(this.btnMute);
    btnCluster.appendChild(this.btnPause);

    this.topRow.appendChild(this.sectorBadge);
    this.topRow.appendChild(this.scoreBox);
    this.topRow.appendChild(this.timerBox);
    this.topRow.appendChild(btnCluster);
    this.topBar.appendChild(this.topRow);

    // Sub Row: Next Orb & Target Core
    this.subRow = document.createElement('div');
    this.subRow.className = 'hud-sub-row';

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

    this.targetPill = document.createElement('div');
    this.targetPill.className = 'hud-pill hud-pill-compact hud-target-pill';
    this.targetLabel = document.createElement('span');
    this.targetLabel.textContent = i18n.t('targetTier') + ':';
    this.targetDot = document.createElement('span');
    this.targetDot.className = 'hud-orb-dot';
    this.targetSymbol = document.createElement('strong');
    this.targetSymbol.textContent = 'Be (T4)';
    this.targetPill.appendChild(this.targetLabel);
    this.targetPill.appendChild(this.targetDot);
    this.targetPill.appendChild(this.targetSymbol);

    this.subRow.appendChild(this.nextOrbPill);
    this.subRow.appendChild(this.targetPill);
    this.topBar.appendChild(this.subRow);

    this.root.appendChild(this.topBar);

    // ── 2. DANGER BANNER WITH COUNTDOWN ─────────────────────────────────────
    this.dangerBanner = document.createElement('div');
    this.dangerBanner.id = 'hud-danger-banner';
    this.dangerBanner.className = 'hud-danger-banner hidden';
    this.root.appendChild(this.dangerBanner);

    // ── 3. BOTTOM DOCKED TACTICAL TOOLBAR ───────────────────────────────────
    this.bottomBar = document.createElement('div');
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

    this.bottomBar.appendChild(this.btnPulse);
    this.bottomBar.appendChild(this.btnVent);
    this.bottomBar.appendChild(this.btnCatalyst);
    this.root.appendChild(this.bottomBar);

    // ── 4. MODAL BACKDROP (ATTACHED TO BODY TO PREVENT ANY CLIPPING) ────────
    this.modalBackdrop = document.createElement('div');
    this.modalBackdrop.id = 'hud-modal-backdrop';
    this.modalBackdrop.className = 'hud-modal-backdrop hidden';
    this.modalBackdrop.addEventListener('pointerdown', (e) => e.stopPropagation());
    document.body.appendChild(this.modalBackdrop);

    this.stage.appendChild(this.root);
    this.updateTacticalButtons(this.pulseUses, this.ventUses, this.catalystUses);
  }

  refreshTexts() {
    this.nextOrbLabel.textContent = i18n.t('nextOrb') + ':';
    this.targetLabel.textContent = i18n.t('targetTier') + ':';
    this.btnEvo.textContent = i18n.t('btnEvoGuide');
    this.btnLang.textContent = i18n.lang.toUpperCase();
    this.updateTacticalButtons(this.pulseUses, this.ventUses, this.catalystUses);
  }

  updateStatus({ sectorId, isEndless, score, targetScore, timeRemaining, nextTier, targetTier }) {
    if (isEndless) {
      this.sectorBadge.textContent = i18n.t('endlessMode');
      this.scoreValue.textContent = `${i18n.t('score')}: ${score}`;
      this.timerValue.textContent = `★ ${storage.data.highScore}`;
    } else {
      this.sectorBadge.textContent = `${i18n.t('sector')} ${String(sectorId).padStart(2, '0')}`;
      this.scoreValue.textContent = `${score} / ${targetScore}`;
      const mins = Math.floor(Math.max(0, timeRemaining) / 60);
      const secs = Math.floor(Math.max(0, timeRemaining) % 60);
      this.timerValue.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      this.timerBox.style.borderColor = timeRemaining < 20 ? '#ef4444' : 'rgba(0, 245, 255, 0.3)';
    }

    const nextCfg = ORB_TIERS[Math.max(0, Math.min(ORB_TIERS.length - 1, (nextTier || 1) - 1))];
    this.nextOrbDot.style.background = nextCfg.color;
    this.nextOrbDot.style.boxShadow = `0 0 8px ${nextCfg.color}`;
    this.nextOrbSymbol.textContent = nextCfg.symbol;

    const targetCfg = ORB_TIERS[Math.max(0, Math.min(ORB_TIERS.length - 1, (targetTier || 4) - 1))];
    this.targetDot.style.background = targetCfg.color;
    this.targetDot.style.boxShadow = `0 0 8px ${targetCfg.color}`;
    this.targetSymbol.textContent = `${targetCfg.symbol} (T${targetCfg.tier})`;
  }

  updateTacticalButtons(pulseCount, ventCount, catalystCount) {
    this.pulseUses = pulseCount;
    this.ventUses = ventCount;
    this.catalystUses = catalystCount;

    this.btnPulse.textContent = `⚡ ${i18n.t('btnPulse')} (${pulseCount})`;
    this.btnPulse.disabled = pulseCount <= 0;

    this.btnVent.textContent = `🔥 ${i18n.t('btnVent')} (${ventCount})`;
    this.btnVent.disabled = ventCount <= 0;

    this.btnCatalyst.textContent = `★ ${i18n.t('btnCatalyst')} (${catalystCount})`;
    this.btnCatalyst.disabled = catalystCount <= 0;
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

  // ── EVOLUTION CHAIN MODAL ────────────────────────────────────────────────
  openEvolutionModal() {
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
    closeBtn.addEventListener('pointerdown', () => this.closeModal());

    header.appendChild(title);
    header.appendChild(closeBtn);
    card.appendChild(header);

    const sub = document.createElement('p');
    sub.className = 'hud-modal-sub';
    sub.textContent = i18n.t('evolutionModalSub');
    card.appendChild(sub);

    const scrollWrap = document.createElement('div');
    scrollWrap.className = 'hud-level-scroll';

    const list = document.createElement('div');
    list.style.cssText = 'display: flex; flex-direction: column; gap: 8px;';

    ORB_TIERS.forEach((t, idx) => {
      const row = document.createElement('div');
      row.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 14px;
        background: rgba(15, 23, 42, 0.75);
        border: 1px solid rgba(56, 189, 248, 0.25);
        border-radius: 8px;
      `;

      const left = document.createElement('div');
      left.style.cssText = 'display: flex; align-items: center; gap: 12px;';

      const orbIcon = document.createElement('div');
      orbIcon.style.cssText = `
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: ${t.color};
        box-shadow: 0 0 10px ${t.color};
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 900;
        font-size: 13px;
        color: #020617;
      `;
      orbIcon.textContent = t.symbol;

      const info = document.createElement('div');
      info.style.cssText = 'display: flex; flex-direction: column; text-align: left;';
      const name = document.createElement('span');
      name.style.cssText = 'font-weight: 800; font-size: 13px; color: #f8fafc;';
      name.textContent = `T${t.tier}. ${i18n.getTierName(t.tier)}`;
      const formula = document.createElement('span');
      formula.style.cssText = 'font-size: 11px; color: #94a3b8;';
      const prev = idx > 0 ? ORB_TIERS[idx - 1].symbol : '—';
      formula.textContent = idx > 0 ? `${prev} + ${prev} ➔ ${t.symbol}` : 'Starter Particle';

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
      secMeta.textContent = `${i18n.t('goalScore')}: ${sec.targetScore} • ${targetOrb.symbol} (T${sec.targetTier})`;
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

  // ── VICTORY MODAL ────────────────────────────────────────────────────────
  openVictoryModal({ sectorId, score, starsEarned, shardsEarned }) {
    this.doubleClaimed = false;
    this.modalBackdrop.innerHTML = '';
    this.modalBackdrop.className = 'hud-modal-backdrop';

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
    sub.textContent = `${i18n.t('score')}: ${score}`;
    card.appendChild(sub);

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
        if (this.callbacks.onNextLevel) this.callbacks.onNextLevel(sectorId + 1);
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
}
