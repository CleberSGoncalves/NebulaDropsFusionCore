/**
 * @fileoverview Main Entry Point for Nebula Drops: Fusion Core
 * Bootstraps CrazyGames SDK v3, Sound Synthesizer, Responsive HUD,
 * FluidCleb Interactive Splash (0.0s - 2.8s) + Interactive Lore, and Game Engine.
 */

import './style.css';
import { crazyGames } from './crazygames.js';
import { sound } from './audio.js';
import { GameHUD } from './hud.js';
import { GameEngine } from './game.js';
import { CinematicIntro } from './splash.js';

window.addEventListener('DOMContentLoaded', async () => {
  console.log('[Main] Bootstrapping Nebula Drops: Fusion Core...');

  // 1. Initialize CrazyGames SDK v3 asynchronously (resilient to AdBlock)
  await crazyGames.init();

  const canvas = document.getElementById('game-canvas');
  const stage = document.getElementById('game-stage');

  let engine = null;

  // 2. Instantiate decoupled HUD
  const hud = new GameHUD(stage, {
    onPause: () => {
      if (engine) engine.isPaused = true;
    },
    onResume: () => {
      if (engine) {
        engine.isPaused = false;
        crazyGames.gameplayStart();
      }
    },
    onRestart: () => {
      if (engine) {
        engine.loadSector(engine.currentSectorIndex, engine.isEndless);
      }
    },
    onNextLevel: (nextSectorId) => {
      if (engine) {
        engine.loadSector(nextSectorId - 1, false);
      }
    },
    onSelectLevel: (sectorId) => {
      if (engine) {
        engine.loadSector(sectorId - 1, false);
      }
    },
    onStartEndless: () => {
      if (engine) {
        engine.loadSector(0, true);
      }
    },
    onDropOrb: () => {
      if (engine) engine.requestDrop();
    },
    onTriggerPulse: () => {
      if (engine) engine.useGravitationalPulse();
    },
    onTriggerVent: () => {
      if (engine) engine.usePlasmaVent();
    },
    onTriggerCatalyst: () => {
      if (engine) engine.useCatalyst();
    },
    onRevive: () => {
      if (engine) engine.reviveWithEmergencyShield();
    }
  });

  // 3. Register CrazyGames SDK v3 Ad Callbacks for strict audio muting & physics freeze
  crazyGames.setAdCallbacks(
    // On Ad Started:
    () => {
      sound.setAdMuted(true);
      if (engine) engine.isAdPaused = true;
    },
    // On Ad Finished or Error:
    () => {
      sound.setAdMuted(false);
      if (engine) engine.isAdPaused = false;
    }
  );

  // 4. Create Game Engine instance
  engine = new GameEngine(canvas, hud);
  window.__nebulaEngine = engine; // Expose for automated QA inspection

  // 5. Launch FluidCleb Interactive Intro (0.0s - 2.8s) + Lore with 1-Click Skip
  const intro = new CinematicIntro(document.body, () => {
    console.log('[Main] Intro completed or skipped -> Entering Reactor Gameplay!');
    engine.start();
  });

  intro.start();
});
