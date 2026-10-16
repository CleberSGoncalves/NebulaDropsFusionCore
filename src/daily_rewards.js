/**
 * @fileoverview Daily Rewards System (7-Day Calendar) for Web Playtest
 * Matches Godot 4.7.2 DailyRewardsManager 1:1.
 */

import { storage } from './storage.js';

export const DAILY_DAYS_DEF = [
  { day: 1, title: 'Dia 1', titleEn: 'Day 1', reward: '50 Shards', shards: 50, bonus: '' },
  { day: 2, title: 'Dia 2', titleEn: 'Day 2', reward: '100 Shards', shards: 100, bonus: 'score_boost' },
  { day: 3, title: 'Dia 3', titleEn: 'Day 3', reward: '150 Shards + 2 Martelos', shards: 150, bonus: 'hammer_2' },
  { day: 4, title: 'Dia 4', titleEn: 'Day 4', reward: '200 Shards + 2 Desfazer', shards: 200, bonus: 'undo_2' },
  { day: 5, title: 'Dia 5', titleEn: 'Day 5', reward: '300 Shards + Catalisador', shards: 300, bonus: 'catalyst_1' },
  { day: 6, title: 'Dia 6', titleEn: 'Day 6', reward: '450 Shards (2X)', shards: 450, bonus: 'double_shards' },
  { day: 7, title: 'Dia 7', titleEn: 'Day 7', reward: '1000 Shards + Skin Zen', shards: 1000, bonus: 'skin_zen_crystal' }
];

export class DailyRewardsManager {
  constructor() {
    this.refresh();
  }

  refresh() {
    const data = storage.data;
    this.currentStreak = data.dailyStreak || 1;
    this.lastClaimDayEpoch = data.lastClaimDayEpoch || 0;
    this.canClaim = storage.canClaimDaily();
  }

  getCalendarState() {
    this.refresh();
    const todayIndex = Math.min(Math.max(1, this.currentStreak), 7);
    return DAILY_DAYS_DEF.map((dayDef) => {
      let status = 'locked';
      if (dayDef.day < todayIndex) {
        status = 'claimed';
      } else if (dayDef.day === todayIndex) {
        status = this.canClaim ? 'available' : 'claimed_today';
      }
      return {
        ...dayDef,
        status
      };
    });
  }

  claimToday() {
    this.refresh();
    if (!this.canClaim) return null;

    const dayIndex = Math.min(Math.max(1, this.currentStreak), 7) - 1;
    const reward = DAILY_DAYS_DEF[dayIndex];

    // Apply shards
    const nextStreak = storage.claimDailyReward(reward.shards);

    // Apply bonuses
    if (reward.bonus === 'hammer_2') {
      const cur = storage.data.hammerCount || 0;
      storage.save({ hammerCount: cur + 2 });
    } else if (reward.bonus === 'undo_2') {
      const cur = storage.data.undoCount || 0;
      storage.save({ undoCount: cur + 2 });
    } else if (reward.bonus === 'skin_zen_crystal') {
      storage.unlockSkin('zen_crystal');
    }

    this.refresh();
    return reward;
  }
}

export const dailyRewards = new DailyRewardsManager();
