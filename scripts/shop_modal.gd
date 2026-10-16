extends Panel

signal closed

@onready var shards_label: Label = $VBoxContainer/ShardsLabel
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
	
	var shop_mgr = get_node_or_null("/root/ShopManager")
	var shards: int = 0
	if SaveSystem:
		var prog: Dictionary = SaveSystem.carregar()
		shards = int(prog.get("plasma_shards", 0))
	
	if shards_label:
		shards_label.text = "SEUS SHARDS DE PLASMA: %d ♦" % shards
	
	var defs: Array[Dictionary] = []
	if shop_mgr:
		defs = shop_mgr.SKINS_DEF
	
	for s in defs:
		var card := PanelContainer.new()
		card.custom_minimum_size = Vector2(240, 110)
		var vbox := VBoxContainer.new()
		
		var skin_id: String = str(s.get("id", ""))
		var unlocked: bool = false
		var is_equipped: bool = false
		if shop_mgr:
			unlocked = shop_mgr.is_skin_unlocked(skin_id)
			is_equipped = (shop_mgr.equipped_skin == skin_id)
		
		var title := Label.new()
		var title_text: String = str(s.get("name", ""))
		if is_equipped:
			title_text += " (EQUIPADA)"
		title.text = title_text
		title.modulate = Color.from_string(str(s.get("color", "#ffffff")), Color.WHITE)
		title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		
		var desc := Label.new()
		desc.text = str(s.get("desc", ""))
		desc.add_theme_font_size_override("font_size", 10)
		desc.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		
		var btn_row := HBoxContainer.new()
		if unlocked:
			var equip_btn := Button.new()
			if is_equipped:
				equip_btn.text = "EQUIPADA"
			else:
				equip_btn.text = "EQUIPAR"
			equip_btn.disabled = is_equipped
			equip_btn.size_flags_horizontal = Control.SIZE_EXPAND_FILL
			equip_btn.pressed.connect(func():
				if shop_mgr:
					shop_mgr.equip_skin(skin_id)
					_populate()
			)
			btn_row.add_child(equip_btn)
		else:
			var buy_btn := Button.new()
			buy_btn.text = "COMPRAR (%d ♦)" % int(s.get("cost", 999))
			buy_btn.size_flags_horizontal = Control.SIZE_EXPAND_FILL
			buy_btn.pressed.connect(func():
				if shop_mgr:
					shop_mgr.buy_with_shards(skin_id)
					_populate()
			)
			var ad_btn := Button.new()
			ad_btn.text = "[VÍDEO] GRÁTIS"
			ad_btn.size_flags_horizontal = Control.SIZE_EXPAND_FILL
			ad_btn.pressed.connect(func():
				if shop_mgr:
					shop_mgr.unlock_via_rewarded_ad(skin_id)
					_populate()
			)
			btn_row.add_child(buy_btn)
			btn_row.add_child(ad_btn)
		
		vbox.add_child(title)
		vbox.add_child(desc)
		vbox.add_child(btn_row)
		card.add_child(vbox)
		grid.add_child(card)
