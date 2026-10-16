extends Panel

signal closed

@onready var multiplier_label: Label = $VBoxContainer/MultiplierLabel
@onready var grid: GridContainer = $VBoxContainer/ScrollContainer/GridContainer
@onready var close_btn: Button = $VBoxContainer/CloseButton

func _ready() -> void:
	visible = false
	if close_btn:
		close_btn.pressed.connect(_on_close_pressed)

func open() -> void:
	visible = true
	_populate()

func _on_close_pressed() -> void:
	visible = false
	closed.emit()

func _populate() -> void:
	if not grid:
		return
	for c in grid.get_children():
		c.queue_free()
	
	var ach_mgr = get_node_or_null("/root/AchievementsManager")
	var total_mult: float = 1.0
	if ach_mgr:
		total_mult = ach_mgr.get_total_multiplier()
	
	if multiplier_label:
		multiplier_label.text = "MULTIPLICADOR PERMANENTE: x%.2f (BÔNUS PASSIVO)" % total_mult
	
	var defs: Array[Dictionary] = []
	if ach_mgr:
		defs = ach_mgr.ACHIEVEMENTS_DEF
	
	for a in defs:
		var panel := PanelContainer.new()
		panel.custom_minimum_size = Vector2(240, 70)
		var vbox := VBoxContainer.new()
		
		var unlocked: bool = false
		if ach_mgr:
			unlocked = ach_mgr.is_unlocked(str(a.get("id", "")))
		
		var title := Label.new()
		if unlocked:
			title.text = "[OK] " + str(a.get("title", ""))
			title.modulate = Color(0.98, 0.8, 0.1)
		else:
			title.text = "[ ] " + str(a.get("title", ""))
			title.modulate = Color(0.6, 0.6, 0.6)
		
		var desc := Label.new()
		desc.text = str(a.get("desc", "")) + " (+%d%%)" % int(float(a.get("multiplier_bonus", 0.05)) * 100)
		desc.add_theme_font_size_override("font_size", 11)
		desc.modulate = Color(0.8, 0.8, 0.8)
		
		vbox.add_child(title)
		vbox.add_child(desc)
		panel.add_child(vbox)
		grid.add_child(panel)
