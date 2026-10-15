extends Node

## GameManager — Gerenciador Central de Estado, Fusão e CrazyGames SDK v3 (Godot 4.7.2)

signal score_changed(new_score: int)
signal health_changed(new_health: int)
signal game_over
signal game_started

const TOTAL_FASES: int = 12

var score: int = 0
var high_score: int = 0
var health: int = 100
var max_health: int = 100
var current_level: int = 1
var max_unlocked_level: int = 1
var is_game_active: bool = false
var revive_used_this_attempt: bool = false

# Tabela dos 11 níveis de núcleos de plasma (Nebula Drops)
const ORB_TIERS: Array[Dictionary] = [
	{"tier": 1, "name": "Micro Plasma Spark", "radius": 22.0, "points": 10, "color": "#00f5ff"},
	{"tier": 2, "name": "Helium Ion Core", "radius": 30.0, "points": 25, "color": "#38bdf8"},
	{"tier": 3, "name": "Aurora Flux Drop", "radius": 38.0, "points": 60, "color": "#22c55e"},
	{"tier": 4, "name": "Solar Flare Pearl", "radius": 46.0, "points": 140, "color": "#eab308"},
	{"tier": 5, "name": "Tachyon Pulse Sphere", "radius": 56.0, "points": 300, "color": "#f97316"},
	{"tier": 6, "name": "Nova Blaze Core", "radius": 66.0, "points": 650, "color": "#ef4444"},
	{"tier": 7, "name": "Quantum Void Drop", "radius": 78.0, "points": 1400, "color": "#a855f7"},
	{"tier": 8, "name": "Antimatter Singularity", "radius": 92.0, "points": 3000, "color": "#ec4899"},
	{"tier": 9, "name": "Dark Energy Matrix", "radius": 108.0, "points": 6500, "color": "#6366f1"},
	{"tier": 10, "name": "Pulsar Radiant Engine", "radius": 126.0, "points": 15000, "color": "#14b8a6"},
	{"tier": 11, "name": "Nebula Fusion Core", "radius": 145.0, "points": 40000, "color": "#facc15"}
]

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	if SaveSystem:
		var prog: Dictionary = SaveSystem.obter_progresso()
		high_score = int(prog.get("high_score", 0))
		max_unlocked_level = int(prog.get("max_level", 1))

func start_new_game(level_idx: int = 1) -> void:
	current_level = clampi(level_idx, 1, TOTAL_FASES)
	score = 0
	health = max_health
	is_game_active = true
	revive_used_this_attempt = false
	score_changed.emit(score)
	health_changed.emit(health)
	game_started.emit()
	if EventBus:
		EventBus.score_updated.emit(score)
		EventBus.health_updated.emit(health, max_health)
	_cg_gameplay_start()

func add_score(points: int) -> void:
	if not is_game_active:
		return
	score += points
	if score > high_score:
		high_score = score
	score_changed.emit(score)
	if EventBus:
		EventBus.score_updated.emit(score)

func register_fusion(new_tier: int, merge_pos: Vector2) -> void:
	if not is_game_active:
		return
	var tier_idx: int = clampi(new_tier - 1, 0, ORB_TIERS.size() - 1)
	var pts: int = int(ORB_TIERS[tier_idx]["points"])
	add_score(pts)
	if EventBus:
		EventBus.orbs_merged.emit(new_tier, merge_pos, pts)
		var trauma_val: float = clampf(0.15 + float(new_tier) * 0.06, 0.15, 0.85)
		EventBus.camera_shake_requested.emit(trauma_val)
		if new_tier >= 5:
			EventBus.hit_stop_requested.emit(0.055, 0.05)
	if new_tier >= 8:
		_cg_happy_time()

func take_damage(amount: int) -> void:
	if not is_game_active:
		return
	health = max(0, health - amount)
	health_changed.emit(health)
	if EventBus:
		EventBus.health_updated.emit(health, max_health)
	if health <= 0:
		trigger_game_over()

func heal(amount: int) -> void:
	if not is_game_active:
		return
	health = min(max_health, health + amount)
	health_changed.emit(health)
	if EventBus:
		EventBus.health_updated.emit(health, max_health)

func complete_current_level(stars: int = 3) -> void:
	if not is_game_active:
		return
	is_game_active = false
	_cg_gameplay_stop()
	_cg_happy_time()
	if current_level >= max_unlocked_level and current_level < TOTAL_FASES:
		max_unlocked_level = current_level + 1
	if SaveSystem:
		var star_dict: Dictionary = {}
		star_dict["stars_level_" + str(current_level)] = clampi(stars, 1, 3)
		SaveSystem.salvar_progresso(max_unlocked_level, high_score, AudioServer.is_bus_mute(0), star_dict)
	if EventBus:
		EventBus.stars_earned.emit(current_level, stars)
		EventBus.level_completed.emit(current_level)

func trigger_game_over() -> void:
	is_game_active = false
	_cg_gameplay_stop()
	if SaveSystem:
		SaveSystem.salvar_progresso(max_unlocked_level, high_score, AudioServer.is_bus_mute(0))
	game_over.emit()
	if EventBus:
		EventBus.player_died.emit()

# ── Integração CrazyGames SDK v3 ──────────────────────────────────
func _cg_gameplay_start() -> void:
	if OS.has_feature("web"):
		JavaScriptBridge.eval("if(window.CrazyGames && window.CrazyGames.SDK && window.CrazyGames.SDK.game) window.CrazyGames.SDK.game.gameplayStart();")

func _cg_gameplay_stop() -> void:
	if OS.has_feature("web"):
		JavaScriptBridge.eval("if(window.CrazyGames && window.CrazyGames.SDK && window.CrazyGames.SDK.game) window.CrazyGames.SDK.game.gameplayStop();")

func _cg_happy_time() -> void:
	if OS.has_feature("web"):
		JavaScriptBridge.eval("if(window.CrazyGames && window.CrazyGames.SDK && window.CrazyGames.SDK.game) window.CrazyGames.SDK.game.happytime();")

func request_rewarded_revive() -> void:
	if revive_used_this_attempt:
		return
	get_tree().paused = true
	AudioServer.set_bus_mute(0, true)
	if not OS.has_feature("web"):
		_on_revive_ad_finished()
		return
	JavaScriptBridge.eval("if(window.CrazyGames && window.CrazyGames.SDK && window.CrazyGames.SDK.ad) { window.CrazyGames.SDK.ad.requestAd('rewarded'); }")
	_on_revive_ad_finished()

func _on_revive_ad_finished() -> void:
	revive_used_this_attempt = true
	AudioServer.set_bus_mute(0, false)
	get_tree().paused = false
	health = max_health
	is_game_active = true
	health_changed.emit(health)
	_cg_gameplay_start()
