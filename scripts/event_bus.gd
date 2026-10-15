extends Node

## EventBus — Barramento Global de Eventos Desacoplado (Godot 4.7.2)
## UI e sistemas nunca se acoplam diretamente às entidades de física.

# ── Gameplay & Fusão de Núcleos ───────────────────────────────────
signal score_updated(new_score: int)
signal health_updated(current: int, maximum: int)
signal orb_dropped(tier: int, drop_x: float)
signal orbs_merged(new_tier: int, merge_pos: Vector2, points: int)
signal next_orb_updated(next_tier: int)
signal danger_level_changed(danger_ratio: float)
signal player_died()
signal level_completed(level_index: int)
signal checkpoint_reached(checkpoint_id: int)

# ── UI e Menus ────────────────────────────────────────────────────
signal hud_show_message(text: String, duration: float)
signal pause_requested()
signal resume_requested()
signal level_select_requested()

# ── Áudio ─────────────────────────────────────────────────────────
signal play_sfx(sfx_name: String)
signal play_music(track_name: String)
signal mute_toggled(is_muted: bool)

# ── Game Feel & Juice ─────────────────────────────────────────────
signal camera_shake_requested(trauma_amount: float)
signal hit_stop_requested(duration_sec: float, scale_factor: float)
signal stars_earned(level_index: int, star_count: int)
signal haptic_requested(duration_ms: int)
signal pacing_adjusted(new_coyote_time: float)

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS

func limpar_conexoes_ativas() -> void:
	var sinais: Array[Signal] = [
		score_updated, health_updated, orb_dropped, orbs_merged,
		next_orb_updated, danger_level_changed, player_died,
		level_completed, checkpoint_reached, hud_show_message,
		camera_shake_requested, hit_stop_requested,
		stars_earned, haptic_requested, pacing_adjusted
	]
	for sig in sinais:
		for conn in sig.get_connections():
			sig.disconnect(conn.callable)
