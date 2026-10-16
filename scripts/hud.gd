extends CanvasLayer

## HUD — Interface Gráfica Desacoplada via EventBus (Godot 4.7.2)
## Áreas de toque >= 48x48px, zero emojis Unicode, suporte a Overdrive, Time Attack, Conquistas, Loja e Power-ups.

@onready var score_label: Label = $MarginContainer/VBoxContainer/TopRow/ScoreLabel
@onready var mode_label: Label = $MarginContainer/VBoxContainer/TopRow/ModeLabel
@onready var health_bar: ProgressBar = $MarginContainer/VBoxContainer/HealthBar
@onready var game_over_panel: Panel = $GameOverPanel
@onready var pause_panel: Panel = $PausePanel

# Power-up buttons
@onready var hammer_btn: Button = $MarginContainer/VBoxContainer/BottomPowerups/HammerButton
@onready var undo_btn: Button = $MarginContainer/VBoxContainer/BottomPowerups/UndoButton

# Modal instances
var achievements_modal_inst: Node
var daily_rewards_modal_inst: Node
var shop_modal_inst: Node

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	
	achievements_modal_inst = get_node_or_null("AchievementsModal")
	daily_rewards_modal_inst = get_node_or_null("DailyRewardsModal")
	shop_modal_inst = get_node_or_null("ShopModal")
	
	if EventBus:
		EventBus.score_updated.connect(_on_score_changed)
		EventBus.health_updated.connect(_on_health_updated)
		EventBus.player_died.connect(_on_game_over)
		EventBus.pause_requested.connect(_on_pause_button_pressed)
		EventBus.resume_requested.connect(_on_resume_button_pressed)
	if GameManager:
		GameManager.score_changed.connect(_on_score_changed)
		GameManager.game_over.connect(_on_game_over)
		GameManager.mode_changed.connect(_on_mode_changed)
	
	var pow_mgr = get_node_or_null("/root/PowerupsManager")
	if pow_mgr:
		pow_mgr.powerup_counts_changed.connect(_on_powerup_counts_changed)
		_on_powerup_counts_changed(pow_mgr.hammer_count, pow_mgr.undo_count)
	
	if game_over_panel:
		game_over_panel.visible = false
	if pause_panel:
		pause_panel.visible = false

func _exit_tree() -> void:
	if EventBus:
		if EventBus.score_updated.is_connected(_on_score_changed):
			EventBus.score_updated.disconnect(_on_score_changed)
		if EventBus.health_updated.is_connected(_on_health_updated):
			EventBus.health_updated.disconnect(_on_health_updated)
		if EventBus.player_died.is_connected(_on_game_over):
			EventBus.player_died.disconnect(_on_game_over)

func _on_score_changed(new_score: int) -> void:
	if score_label:
		score_label.text = "PONTOS: %d" % new_score

func _on_mode_changed(mode_name: String) -> void:
	if mode_label:
		mode_label.text = "[ " + mode_name + " ]"

func _on_health_updated(current: int, _maximum: int) -> void:
	if health_bar:
		health_bar.value = current

func _on_powerup_counts_changed(hammers: int, undos: int) -> void:
	if hammer_btn:
		hammer_btn.text = "MARTELO (%d)" % hammers
	if undo_btn:
		undo_btn.text = "DESFAZER (%d)" % undos

func _on_hammer_pressed() -> void:
	var pow_mgr = get_node_or_null("/root/PowerupsManager")
	if pow_mgr:
		pow_mgr.toggle_hammer_mode()

func _on_undo_pressed() -> void:
	var pow_mgr = get_node_or_null("/root/PowerupsManager")
	if pow_mgr:
		pow_mgr.use_undo()

func _on_achievements_button_pressed() -> void:
	if achievements_modal_inst and achievements_modal_inst.has_method("open"):
		achievements_modal_inst.open()

func _on_daily_button_pressed() -> void:
	if daily_rewards_modal_inst and daily_rewards_modal_inst.has_method("open"):
		daily_rewards_modal_inst.open()

func _on_shop_button_pressed() -> void:
	if shop_modal_inst and shop_modal_inst.has_method("open"):
		shop_modal_inst.open()

func _on_game_over() -> void:
	if game_over_panel:
		game_over_panel.visible = true

func _on_pause_button_pressed() -> void:
	get_tree().paused = true
	if GameManager:
		GameManager._cg_gameplay_stop()
	if pause_panel:
		pause_panel.visible = true

func _on_resume_button_pressed() -> void:
	get_tree().paused = false
	if GameManager:
		GameManager._cg_gameplay_start()
	if pause_panel:
		pause_panel.visible = false

func _on_restart_button_pressed() -> void:
	get_tree().paused = false
	if game_over_panel:
		game_over_panel.visible = false
	if EventBus:
		EventBus.limpar_conexoes_ativas()
	if GameManager:
		GameManager.start_new_game(GameManager.current_level, GameManager.current_mode)
	get_tree().reload_current_scene()

func _on_mute_button_pressed() -> void:
	var is_muted: bool = AudioServer.is_bus_mute(0)
	AudioServer.set_bus_mute(0, not is_muted)
	if EventBus:
		EventBus.mute_toggled.emit(not is_muted)
