/**
 * @fileoverview Meta-progression, Quests, Cosmetics & Daily Challenge definitions.
 * Central, dependency-free data module for Nebula Drops: Fusion Core.
 */

// ── Permanent Reactor Upgrades (Plasma Shard sink) ────────────────────────────
export const UPGRADES = [
  { key: 'pulse', nameEn: 'Extra Pulse', namePt: 'Pulso Extra', descEn: '+1 Gravitational Pulse per sector', descPt: '+1 Pulso Gravitacional por setor', baseCost: 60, maxLevel: 3 },
  { key: 'vent', nameEn: 'Extra Vent', namePt: 'Purga Extra', descEn: '+1 Plasma Vent per sector', descPt: '+1 Purga de Plasma por setor', baseCost: 60, maxLevel: 3 },
  { key: 'time', nameEn: 'Chrono Buffer', namePt: 'Buffer de Crono', descEn: '+10s time limit per sector', descPt: '+10s de tempo por setor', baseCost: 45, maxLevel: 5 },
  { key: 'catalyst', nameEn: 'Extra Catalyst', namePt: 'Catalisador Extra', descEn: '+1 Catalyst per sector', descPt: '+1 Catalisador por setor', baseCost: 90, maxLevel: 2 },
  { key: 'startTier', nameEn: 'Hot Start', namePt: 'Partida Quente', descEn: 'Start with a higher-tier orb', descPt: 'Comece com um orbe de nível maior', baseCost: 120, maxLevel: 2 }
];

export function getUpgrade(key) {
  return UPGRADES.find((u) => u.key === key) || null;
}

export function upgradeCost(key, level) {
  const u = getUpgrade(key);
  if (!u) return 0;
  return u.baseCost * (level + 1);
}

// ── Daily & Weekly Quests ─────────────────────────────────────────────────────
export const QUESTS = {
  daily: [
    { key: 'dq_fuse10', nameEn: 'Fuse 10 orbs', namePt: 'Funda 10 orbes', target: 10, reward: 25 },
    { key: 'dq_tier5', nameEn: 'Reach a Tier 5+ core', namePt: 'Alcance um núcleo nível 5+', target: 1, reward: 40 },
    { key: 'dq_score', nameEn: 'Score 800 in one sector', namePt: 'Faça 800 pontos em um setor', target: 800, reward: 35 }
  ],
  weekly: [
    { key: 'wq_win3', nameEn: 'Win 5 sectors', namePt: 'Vença 5 setores', target: 5, reward: 120 },
    { key: 'wq_star3', nameEn: 'Earn ★★★ in 3 sectors', namePt: 'Ganhe ★★★ em 3 setores', target: 3, reward: 150 },
    { key: 'wq_shards', nameEn: 'Collect 200 shards', namePt: 'Junte 200 fragmentos', target: 200, reward: 100 }
  ]
};

// ── Orb Themes (cosmetics) ────────────────────────────────────────────────────
export const THEMES = [
  { id: 'default', nameEn: 'Nebula Default', namePt: 'Nebula Padrão', cost: 0, hueShift: 0 },
  { id: 'magma', nameEn: 'Magma Core', namePt: 'Núcleo de Magma', cost: 200, hueShift: -45 },
  { id: 'aurora', nameEn: 'Aurora Flux', namePt: 'Fluxo Aurora', cost: 350, hueShift: 120 },
  { id: 'crystal', nameEn: 'Crystal Void', namePt: 'Vazio de Cristal', cost: 500, hueShift: 200 }
];

export function getTheme(id) {
  return THEMES.find((t) => t.id === id) || THEMES[0];
}

// Hex <-> RGB <-> HSL helpers for hue-shift theme application.
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(r, g, b) {
  const to = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return [h * 360, s, l];
}

function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

export function shiftHue(hex, deg) {
  if (!deg) return hex;
  const [r, g, b] = hexToRgb(hex);
  const [h, s, l] = rgbToHsl(r, g, b);
  const [r2, g2, b2] = hslToRgb(h + deg, s, l);
  return rgbToHex(r2, g2, b2);
}

/**
 * Returns the themed color triplet for a given tier config.
 * @param {{color:string, coreColor:string, ringColor:string}} cfg
 * @param {string} themeId
 */
export function applyTheme(cfg, themeId) {
  const theme = getTheme(themeId);
  if (!theme.hueShift) {
    return { color: cfg.color, coreColor: cfg.coreColor, ringColor: cfg.ringColor };
  }
  return {
    color: shiftHue(cfg.color, theme.hueShift),
    coreColor: shiftHue(cfg.coreColor, theme.hueShift),
    ringColor: shiftHue(cfg.ringColor, theme.hueShift)
  };
}

// ── Date helpers for daily challenge & quest reset ───────────────────────────
export function todayStr(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function yesterdayStr() {
  return todayStr(new Date(Date.now() - 86400000));
}

export function weekStr(d = new Date()) {
  const start = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil((((d - start) / 86400000) + start.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${week}`;
}
