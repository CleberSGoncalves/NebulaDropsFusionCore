extends CanvasLayer

## HUD — Interface Gráfica Desacoplada via EventBus (Godot 4.7.2)
## Zero acoplamento direto com nós de física; áreas de toque >= 48x48px; zero emojis Unicode.

@onready var score_label: Label = $MarginContainer/VBoxContainer/TopRow/ScoreLabel
@onready var health_bar: ProgressBar = $MarginContainer/VBoxContainer/HealthBar
@onready var game_over_panel: Panel = $GameOverPanel
@onready var pause_panel: Panel = $PausePanel

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	if EventBus:
		EventBus.score_updated.connect(_on_score_changed)
		EventBus.health_updated.connect(_on_health_updated)
		EventBus.player_died.connect(_on_game_over)
		EventBus.pause_requested.connect(_on_pause_button_pressed)
		EventBus.resume_requested.connect(_on_resume_button_pressed)
	if GameManager:
		GameManager.score_changed.connect(_on_score_changed)
		GameManager.game_over.connect(_on_game_over)
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
		score_label.text = "SCORE: %d" % new_score

func _on_health_updated(current: int, _maximum: int) -> void:
	if health_bar:
		health_bar.value = current

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
		GameManager.start_new_game(GameManager.current_level)
	get_tree().reload_current_scene()

func _on_mute_button_pressed() -> void:
	var is_muted: bool = AudioServer.is_bus_mute(0)
	AudioServer.set_bus_mute(0, not is_muted)
	if EventBus:
		EventBus.mute_toggled.emit(not is_muted)
