extends Panel

signal closed

@onready var streak_label: Label = $VBoxContainer/StreakLabel
@onready var grid: GridContainer = $VBoxContainer/GridContainer
@onready var claim_button: Button = $VBoxContainer/ClaimButton
@onready var close_button: Button = $VBoxContainer/CloseButton

func _ready() -> void:
	visible = false
	if claim_button:
		claim_button.pressed.connect(_on_claim_pressed)
	if close_button:
		close_button.pressed.connect(_on_close_pressed)

func open() -> void:
	visible = true
	_populate()

func _on_close_pressed() -> void:
	visible = false
	closed.emit()

func _on_claim_pressed() -> void:
	var mgr = get_node_or_null("/root/DailyRewards")
	if mgr:
		mgr.claim_today()
		_populate()

func _populate() -> void:
	var mgr = get_node_or_null("/root/DailyRewards")
	if not mgr or not grid:
		return
	
	mgr.check_status()
	if streak_label:
		streak_label.text = "SEQUÊNCIA ATIVA: DIA %d DE 7" % mgr.current_streak
	
	if claim_button:
		claim_button.disabled = not mgr.can_claim_today
		if mgr.can_claim_today:
			claim_button.text = "COLETAR PRÊMIO DE HOJE"
		else:
			claim_button.text = "JÁ COLETADO HOJE!"
	
	for c in grid.get_children():
		c.queue_free()
	
	for d in mgr.DAYS_DEF:
		var card := PanelContainer.new()
		card.custom_minimum_size = Vector2(75, 90)
		var vbox := VBoxContainer.new()
		
		var day_num: int = int(d.get("day", 1))
		var is_current: bool = (day_num == mgr.current_streak)
		var is_past: bool = (day_num < mgr.current_streak)
		
		var lbl_day := Label.new()
		lbl_day.text = "D%d" % day_num
		lbl_day.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		if is_current:
			lbl_day.modulate = Color(0.98, 0.8, 0.1)
		else:
			lbl_day.modulate = Color(0.7, 0.7, 0.7)
		
		var lbl_rew := Label.new()
		lbl_rew.text = str(d.get("reward", ""))
		lbl_rew.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		lbl_rew.add_theme_font_size_override("font_size", 9)
		lbl_rew.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		
		vbox.add_child(lbl_day)
		vbox.add_child(lbl_rew)
		card.add_child(vbox)
		if is_past:
			card.modulate = Color(0.5, 0.5, 0.5)
		grid.add_child(card)
