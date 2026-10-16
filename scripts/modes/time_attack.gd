extends Node
class_name TimeAttackMode

## TimeAttackMode — Corrida Contra o Relógio de 90s (Godot 4.7.2)
## Cada combinação bem-sucedida adiciona +3 segundos extras ao cronômetro.

signal time_tick(seconds_left: float)
signal time_added(seconds_bonus: float)
signal time_attack_ended(final_score: int)

var is_active: bool = false
var time_remaining: float = 90.0
const TIME_BONUS_PER_MERGE: float = 3.0

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_PAUSABLE
	if EventBus:
		if EventBus.has_signal("orbs_merged"):
			EventBus.orbs_merged.connect(_on_orbs_merged)

func start_mode() -> void:
	is_active = true
	time_remaining = 90.0
	time_tick.emit(time_remaining)
	if GameManager:
		GameManager.score = 0
		GameManager.is_game_active = true

func _process(delta: float) -> void:
	if not is_active:
		return
	
	time_remaining -= delta
	if time_remaining <= 0.0:
		time_remaining = 0.0
		is_active = false
		time_tick.emit(time_remaining)
		_end_mode()
	else:
		time_tick.emit(time_remaining)

func _on_orbs_merged(_new_tier: int, _pos: Vector2, _pts: int) -> void:
	if not is_active:
		return
	time_remaining += TIME_BONUS_PER_MERGE
	time_added.emit(TIME_BONUS_PER_MERGE)
	if EventBus and EventBus.has_signal("hud_show_message"):
		EventBus.hud_show_message.emit("+3s TEMPO EXTRA!", 0.8)

func _end_mode() -> void:
	var final_score: int = 0
	if GameManager:
		final_score = GameManager.score
		GameManager.is_game_active = false
		if SaveSystem:
			var prog: Dictionary = SaveSystem.carregar()
			var ta_best: int = int(prog.get("time_attack_best", 0))
			if final_score > ta_best:
				prog["time_attack_best"] = final_score
				SaveSystem.salvar(prog)
		if final_score >= 3000:
			var ach = get_node_or_null("/root/AchievementsManager")
			if ach:
				ach.unlock("time_attack_master")
	time_attack_ended.emit(final_score)
