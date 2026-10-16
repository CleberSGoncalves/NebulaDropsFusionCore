extends Node2D
class_name FusionGrid

## FusionGrid — Gerenciador de Grid, Física de Contenção & Cascata de Combos (Godot 4.7.2)
## Detecta fusões consecutivas em janela de 0.8s e multiplica os pontos (x2, x3, x5, x10)

signal combo_cascade_triggered(cascade_level: int, multiplier: float)

var last_merge_time: float = 0.0
var cascade_count: int = 0
const CASCADE_WINDOW: float = 0.85

func _ready() -> void:
	if EventBus:
		if EventBus.has_signal("orbs_merged"):
			EventBus.orbs_merged.connect(_on_orbs_merged)

func _on_orbs_merged(new_tier: int, pos: Vector2, _base_pts: int) -> void:
	var now: float = float(Time.get_ticks_msec()) / 1000.0
	if now - last_merge_time <= CASCADE_WINDOW:
		cascade_count += 1
	else:
		cascade_count = 1
	last_merge_time = now
	
	var mult: float = 1.0
	if cascade_count == 2:
		mult = 2.0
	elif cascade_count == 3:
		mult = 3.0
	elif cascade_count >= 4:
		mult = minf(10.0, 5.0 + float(cascade_count - 4) * 2.0)
	
	if cascade_count > 1:
		combo_cascade_triggered.emit(cascade_count, mult)
		if EventBus:
			var trauma: float = clampf(0.2 + float(cascade_count) * 0.12, 0.2, 0.9)
			EventBus.camera_shake_requested.emit(trauma)
			if EventBus.has_signal("hud_show_message"):
				EventBus.hud_show_message.emit("CASCATA x%d! BÔNUS MULTIPLICADOR!" % cascade_count, 1.2)
			if cascade_count >= 4:
				var ach = get_node_or_null("/root/AchievementsManager")
				if ach:
					ach.unlock("combo_cascade")
