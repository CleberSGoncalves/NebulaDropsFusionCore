extends Control
class_name LevelSelect

## LevelSelect — Menu de Seleção de Fases com Grade de Cards Visuais e 3 Estrelas (Regra 10)
## Utiliza GridContainer (columns=3) dentro de ScrollContainer e MarginContainer.

signal fase_selecionada(level_index: int)

const TOTAL_FASES: int = 12

@export var grid_path: NodePath = NodePath("MarginContainer/ScrollContainer/GridContainer")
var _grid: GridContainer = null

func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_STOP
	_grid = get_node_or_null(grid_path)
	carregar_grade_fases()

func carregar_grade_fases() -> void:
	if not is_instance_valid(_grid):
		return
	for child in _grid.get_children():
		child.queue_free()

	var progresso: Dictionary = SaveSystem.obter_progresso() if SaveSystem else {"max_level": 1, "stars": {}}
	var max_lvl: int = int(progresso.get("max_level", 1))
	var stars_dict: Dictionary = progresso.get("stars", {})

	for i in range(1, TOTAL_FASES + 1):
		var unlocked: bool = i <= max_lvl
		var star_count: int = int(stars_dict.get("stars_level_" + str(i), 0))
		var card: PanelContainer = _criar_card_visual(i, unlocked, star_count)
		_grid.add_child(card)

func _criar_card_visual(level_idx: int, unlocked: bool, stars: int) -> PanelContainer:
	var panel: PanelContainer = PanelContainer.new()
	panel.custom_minimum_size = Vector2(210.0, 240.0)

	var vbox: VBoxContainer = VBoxContainer.new()
	vbox.alignment = BoxContainer.ALIGNMENT_CENTER
	panel.add_child(vbox)

	# Thumbnail procedural com cor temática do núcleo alvo
	var thumb: ColorRect = ColorRect.new()
	thumb.custom_minimum_size = Vector2(180.0, 100.0)
	var hue: float = fmod(float(level_idx) * 0.085, 1.0)
	thumb.color = Color.from_hsv(hue, 0.75, 0.85) if unlocked else Color(0.2, 0.22, 0.28, 1.0)
	vbox.add_child(thumb)

	# Título do Setor
	var title_lbl: Label = Label.new()
	title_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title_lbl.text = "SECTOR %02d" % level_idx
	vbox.add_child(title_lbl)

	# 3 Estrelas ASCII (Regra 9A & 10)
	var stars_lbl: Label = Label.new()
	stars_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	var star_str: String = ""
	for s in range(1, 4):
		star_str += "★ " if s <= stars else "☆ "
	stars_lbl.text = star_str.strip_edges()
	vbox.add_child(stars_lbl)

	# Botão de Ação
	var btn: Button = Button.new()
	btn.custom_minimum_size = Vector2(160.0, 48.0)
	btn.text = "LAUNCH" if unlocked else "LOCKED"
	btn.disabled = not unlocked
	if unlocked:
		btn.pressed.connect(func() -> void: _on_card_pressed(level_idx))
	else:
		panel.modulate = Color(0.4, 0.4, 0.4, 1.0)
	vbox.add_child(btn)

	return panel

func _on_card_pressed(level_idx: int) -> void:
	fase_selecionada.emit(level_idx)
	if GameManager:
		GameManager.start_new_game(level_idx)
	visible = false
