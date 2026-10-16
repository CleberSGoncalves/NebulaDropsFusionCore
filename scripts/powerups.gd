extends Node

## PowerupsManager — Power-ups Táticos: Martelo & Desfazer (Godot 4.7.2)
## Martelo quebra 1 orbe indesejado; Desfazer reverte a última soltura.
## Recarregável via Rewarded Ad CrazyGames SDK v3.

signal powerup_counts_changed(hammers: int, undos: int)
signal hammer_mode_toggled(active: bool)
signal orb_undone()

var hammer_count: int = 2
var undo_count: int = 2
var is_hammer_active: bool = false
var last_dropped_orb_ref: Variant = null

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	load_counts()

func load_counts() -> void:
	if SaveSystem:
		var prog: Dictionary = SaveSystem.carregar()
		hammer_count = int(prog.get("hammer_count", 2))
		undo_count = int(prog.get("undo_count", 2))
	powerup_counts_changed.emit(hammer_count, undo_count)

func save_counts() -> void:
	if SaveSystem:
		var prog: Dictionary = SaveSystem.carregar()
		prog["hammer_count"] = hammer_count
		prog["undo_count"] = undo_count
		SaveSystem.salvar(prog)

func toggle_hammer_mode() -> void:
	if hammer_count <= 0:
		request_rewarded_recharge("hammer")
		return
	is_hammer_active = not is_hammer_active
	hammer_mode_toggled.emit(is_hammer_active)
	if is_hammer_active and EventBus and EventBus.has_signal("hud_show_message"):
		EventBus.hud_show_message.emit("MODO MARTELO ATIVO: Clique em um orbe para destruí-lo!", 2.0)

func use_hammer_on_orb(orb_node: Node) -> bool:
	if not is_hammer_active or hammer_count <= 0:
		return false
	
	hammer_count -= 1
	is_hammer_active = false
	hammer_mode_toggled.emit(false)
	save_counts()
	powerup_counts_changed.emit(hammer_count, undo_count)
	
	if orb_node and is_instance_valid(orb_node):
		if EventBus:
			EventBus.camera_shake_requested.emit(0.4)
			if EventBus.has_signal("hud_show_message"):
				EventBus.hud_show_message.emit("ORBE DESTRUÍDO PELO MARTELO!", 1.5)
		orb_node.queue_free()
	
	_check_tactical_achievement()
	return true

func register_orb_drop(orb_node: Node) -> void:
	last_dropped_orb_ref = orb_node

func use_undo() -> bool:
	if undo_count <= 0:
		request_rewarded_recharge("undo")
		return false
	
	if last_dropped_orb_ref == null or not is_instance_valid(last_dropped_orb_ref):
		if EventBus and EventBus.has_signal("hud_show_message"):
			EventBus.hud_show_message.emit("Nenhuma jogada recente para desfazer!", 1.5)
		return false
	
	undo_count -= 1
	save_counts()
	powerup_counts_changed.emit(hammer_count, undo_count)
	
	if is_instance_valid(last_dropped_orb_ref):
		last_dropped_orb_ref.queue_free()
		last_dropped_orb_ref = null
	
	orb_undone.emit()
	if EventBus and EventBus.has_signal("hud_show_message"):
		EventBus.hud_show_message.emit("JOGADA DESFEITA COM SUCESSO!", 1.5)
	
	_check_tactical_achievement()
	return true

func request_rewarded_recharge(type: String) -> void:
	if OS.has_feature("web"):
		JavaScriptBridge.eval("if(window.CrazyGames && window.CrazyGames.SDK && window.CrazyGames.SDK.ad) window.CrazyGames.SDK.ad.requestAd('rewarded');")
	
	# Simulação ou callback imediato
	if type == "hammer":
		hammer_count += 2
	else:
		undo_count += 2
	save_counts()
	powerup_counts_changed.emit(hammer_count, undo_count)
	if EventBus and EventBus.has_signal("hud_show_message"):
		EventBus.hud_show_message.emit("POWER-UPS RECARREGADOS (+2)! ", 2.0)

func _check_tactical_achievement() -> void:
	var ach = get_node_or_null("/root/AchievementsManager")
	if ach:
		ach.unlock("tactical_genius")
