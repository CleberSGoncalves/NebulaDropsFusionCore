/**
 * @fileoverview Responsive Decoupled HUD & Modal System for Nebula Drops: Fusion Core
 * Implements:
 * - Top status bar (Sector, Score/Quota, Timer, Next Orb preview, Pause, Audio, Language, Level Select)
 * - Bottom Tactical Bar (Drop Button for Mobile, Gravitational Pulse [F], Plasma Vent [V], Catalyst [C])
 * - Visual Level Select Modal with 3-Column Card Grid & 3 Stars (Rule 10)
 * - Victory & Meltdown Modals with CrazyGames SDK v3 Rewarded Ads (Revive 1x + Double Shards)
 * - Strictly NO custom fullscreen button (CrazyGames rule)
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

    // Left Cluster: Sector & Score
    const leftCluster = document.createElement('div');
    leftCluster.className = 'hud-cluster';

    this.sectorBadge = document.createElement('div');
    this.sectorBadge.className = 'hud-pill hud-pill-cyan';
    this.sectorBadge.id = 'hud-sector-label';
    this.sectorBadge.textContent = 'SECTOR 01';

    this.scoreBox = document.createElement('div');
    this.scoreBox.className = 'hud-pill';
    this.scoreValue = document.createElement('span');
    this.scoreValue.id = 'hud-score-value';
    this.scoreValue.textContent = '0 / 300';
    this.scoreBox.appendChild(this.scoreValue);

    this.timerBox = document.createElement('div');
    this.timerBox.className = 'hud-pill';
    this.timerValue = document.createElement('span');
    this.timerValue.id = 'hud-timer-value';
    this.timerValue.textContent = '02:00';
    this.timerBox.appendChild(this.timerValue);

    leftCluster.appendChild(this.sectorBadge);
    leftCluster.appendChild(this.scoreBox);
    leftCluster.appendChild(this.timerBox);

    // Center Cluster: Next Orb & Target Core
    const centerCluster = document.createElement('div');
    centerCluster.className = 'hud-cluster';

    this.nextOrbPill = document.createElement('div');
    this.nextOrbPill.className = 'hud-pill hud-next-pill';
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
    this.targetPill.className = 'hud-pill hud-target-pill';
    this.targetLabel = document.createElement('span');
    this.targetLabel.textContent = i18n.t('targetTier') + ':';
    this.targetDot = document.createElement('span');
    this.targetDot.className = 'hud-orb-dot';
    this.targetSymbol = document.createElement('strong');
    this.targetSymbol.textContent = 'Be';
    this.targetPill.appendChild(this.targetLabel);
    this.targetPill.appendChild(this.targetDot);
    this.targetPill.appendChild(this.targetSymbol);

    centerCluster.appendChild(this.nextOrbPill);
    centerCluster.appendChild(this.targetPill);

    // Right Cluster: Utility Buttons (Levels, Lang, Mute, Pause — >= 48x48px)
    const rightCluster = document.createElement('div');
    rightCluster.className = 'hud-cluster';

    this.btnLevels = document.createElement('button');
    this.btnLevels.id = 'btn-hud-levels';
    this.btnLevels.className = 'hud-icon-btn';
    this.btnLevels.title = 'Sector Select';
    this.btnLevels.textContent = '[::]';
    this.btnLevels.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      this.openLevelSelectModal();
    });

    this.btnLang = document.createElement('button');
    this.btnLang.id = 'btn-hud-lang';
    this.btnLang.className = 'hud-icon-btn';
    this.btnLang.textContent = i18n.lang.toUpperCase();
    this.btnLang.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      const next = i18n.toggleLang();
      this.btnLang.textContent = next.toUpperCase();
    });

    this.btnMute = document.createElement('button');
    this.btnMute.id = 'btn-hud-mute';
    this.btnMute.className = 'hud-icon-btn';
    this.btnMute.textContent = sound.isMuted ? '[X]' : '[>]';
    this.btnMute.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      const muted = sound.toggleMute();
      this.btnMute.textContent = muted ? '[X]' : '[>]';
    });

    this.btnPause = document.createElement('button');
    this.btnPause.id = 'btn-hud-pause';
    this.btnPause.className = 'hud-icon-btn';
    this.btnPause.textContent = 'II';
    this.btnPause.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      this.openPauseModal();
    });

    rightCluster.appendChild(this.btnLevels);
    rightCluster.appendChild(this.btnLang);
    rightCluster.appendChild(this.btnMute);
    rightCluster.appendChild(this.btnPause);

    this.topBar.appendChild(leftCluster);
    this.topBar.appendChild(centerCluster);
    this.topBar.appendChild(rightCluster);
    this.root.appendChild(this.topBar);

    // ── 2. DANGER BANNER ────────────────────────────────────────────────────
    this.dangerBanner = document.createElement('div');
    this.dangerBanner.id = 'hud-danger-banner';
    this.dangerBanner.className = 'hud-danger-banner hidden';
    this.dangerBanner.textContent = i18n.t('dangerWarning');
    this.root.appendChild(this.dangerBanner);

    // ── 3. BOTTOM TACTICAL BAR ──────────────────────────────────────────────
    this.bottomBar = document.createElement('div');
    this.bottomBar.className = 'hud-bottom-bar';

    this.btnDropMobile = document.createElement('button');
    this.btnDropMobile.id = 'btn-tactical-drop';
    this.btnDropMobile.className = 'hud-action-btn hud-btn-primary';
    this.btnDropMobile.textContent = i18n.t('btnDrop');
    this.btnDropMobile.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      if (this.callbacks.onDropOrb) this.callbacks.onDropOrb();
    });

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

    this.bottomBar.appendChild(this.btnDropMobile);
    this.bottomBar.appendChild(this.btnPulse);
    this.bottomBar.appendChild(this.btnVent);
    this.bottomBar.appendChild(this.btnCatalyst);
    this.root.appendChild(this.bottomBar);

    // ── 4. MODAL CONTAINER ──────────────────────────────────────────────────
    this.modalBackdrop = document.createElement('div');
    this.modalBackdrop.id = 'hud-modal-backdrop';
    this.modalBackdrop.className = 'hud-modal-backdrop hidden';
    this.modalBackdrop.addEventListener('pointerdown', (e) => e.stopPropagation());
    this.root.appendChild(this.modalBackdrop);

    this.stage.appendChild(this.root);
    this.updateTacticalButtons(this.pulseUses, this.ventUses, this.catalystUses);
  }

  refreshTexts() {
    this.nextOrbLabel.textContent = i18n.t('nextOrb') + ':';
    this.targetLabel.textContent = i18n.t('targetTier') + ':';
    this.dangerBanner.textContent = i18n.t('dangerWarning');
    this.btnDropMobile.textContent = i18n.t('btnDrop');
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

    this.btnPulse.textContent = `${i18n.t('btnPulse')} (${pulseCount})`;
    this.btnPulse.disabled = pulseCount <= 0;

    this.btnVent.textContent = `${i18n.t('btnVent')} (${ventCount})`;
    this.btnVent.disabled = ventCount <= 0;

    this.btnCatalyst.textContent = `${i18n.t('btnCatalyst')} (${catalystCount})`;
    this.btnCatalyst.disabled = catalystCount <= 0;
  }

  setDangerVisible(visible, isShielded = false) {
    if (isShielded) {
      this.dangerBanner.className = 'hud-danger-banner hud-shield-banner';
      this.dangerBanner.textContent = i18n.t('shieldActive');
    } else if (visible) {
      this.dangerBanner.className = 'hud-danger-banner';
      this.dangerBanner.textContent = i18n.t('dangerWarning');
    } else {
      this.dangerBanner.className = 'hud-danger-banner hidden';
    }
  }

  closeModal() {
    this.modalBackdrop.className = 'hud-modal-backdrop hidden';
    this.modalBackdrop.innerHTML = '';
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

    // 3-Column Visual Grid inside Scroll Container (Rule 10)
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

      // Visual Orb Thumbnail
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

      // Sector Name
      const secTitle = document.createElement('div');
      secTitle.className = 'hud-sector-name';
      const localizedName = i18n.lang === 'pt' ? sec.namePt : sec.nameEn;
      secTitle.textContent = `${sec.id}. ${localizedName}`;
      item.appendChild(secTitle);

      // Target Info
      const secMeta = document.createElement('div');
      secMeta.className = 'hud-sector-meta';
      secMeta.textContent = `${i18n.t('goalScore')}: ${sec.targetScore} • ${targetOrb.symbol} (T${sec.targetTier})`;
      item.appendChild(secMeta);

      // 3 ASCII Stars (★ / ☆)
      const starsRow = document.createElement('div');
      starsRow.className = 'hud-sector-stars';
      starsRow.textContent = [1, 2, 3].map((s) => (s <= starCount ? '★' : '☆')).join(' ');
      item.appendChild(starsRow);

      // Action Button
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

  // ── VICTORY MODAL (WITH REWARDED AD 2: DOUBLE SHARDS) ────────────────────
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

    // Rewarded Ad 2: Double Plasma Shards & Bonus
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

  // ── GAME OVER / MELTDOWN MODAL (WITH REWARDED AD 1: REVIVE + SHIELD) ──────
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
