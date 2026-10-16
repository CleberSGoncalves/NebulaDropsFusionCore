extends Node

## ShopManager — Loja de Skins Cosméticas (Godot 4.7.2)
## Desbloqueia 6 paletas visuais por Plasma Shards ou instantaneamente via Rewarded Ad CrazyGames.

signal skin_changed(skin_id: String)
signal skin_unlocked(skin_id: String)

const SKINS_DEF: Array[Dictionary] = [
	{
		"id": "default",
		"name": "Plasma Nebular",
		"desc": "Paleta clássica com orbes de energia cósmica neon",
		"cost": 0,
		"color": "#00f5ff"
	},
	{
		"id": "cyber_void",
		"name": "Cyberpunk Neon",
		"desc": "Estilo synthwave com rosa choque e ciano elétrico",
		"cost": 150,
		"color": "#ec4899"
	},
	{
		"id": "zen_crystal",
		"name": "Cristais Zen",
		"desc": "Facetas translúcidas de cristal prismático e quartzo",
		"cost": 300,
		"color": "#2dd4bf"
	},
	{
		"id": "solar_flare",
		"name": "Tempestade Solar",
		"desc": "Brilho ardente de coroa solar e labaredas douradas",
		"cost": 450,
		"color": "#f59e0b"
	},
	{
		"id": "quantum_neon",
		"name": "Vazio Quântico",
		"desc": "Profundezas do vácuo com ultravioleta e radiação gama",
		"cost": 600,
		"color": "#a855f7"
	},
	{
		"id": "matrix_code",
		"name": "Terminal Matrix",
		"desc": "Fósforo verde de terminal hacker cibernético",
		"cost": 800,
		"color": "#22c55e"
	}
]

var unlocked_skins: Dictionary = {"default": true}
var equipped_skin: String = "default"

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	load_shop_data()

func load_shop_data() -> void:
	if not SaveSystem:
		return
	var prog: Dictionary = SaveSystem.carregar()
	unlocked_skins = prog.get("unlocked_skins", {"default": true})
	equipped_skin = str(prog.get("equipped_skin", "default"))

func save_shop_data() -> void:
	if not SaveSystem:
		return
	var prog: Dictionary = SaveSystem.carregar()
	prog["unlocked_skins"] = unlocked_skins
	prog["equipped_skin"] = equipped_skin
	SaveSystem.salvar(prog)

func is_skin_unlocked(skin_id: String) -> bool:
	return bool(unlocked_skins.get(skin_id, false))

func equip_skin(skin_id: String) -> bool:
	if not is_skin_unlocked(skin_id):
		return false
	equipped_skin = skin_id
	save_shop_data()
	skin_changed.emit(equipped_skin)
	if EventBus and EventBus.has_signal("hud_show_message"):
		var info: Dictionary = get_skin_info(skin_id)
		EventBus.hud_show_message.emit("SKIN EQUIPADA: " + str(info.get("name", skin_id)), 1.5)
	return true

func buy_with_shards(skin_id: String) -> bool:
	if is_skin_unlocked(skin_id):
		equip_skin(skin_id)
		return true
	
	var info: Dictionary = get_skin_info(skin_id)
	var cost: int = int(info.get("cost", 999))
	
	if not SaveSystem:
		return false
	
	var prog: Dictionary = SaveSystem.carregar()
	var shards: int = int(prog.get("plasma_shards", 0))
	if shards < cost:
		if EventBus and EventBus.has_signal("hud_show_message"):
			EventBus.hud_show_message.emit("Shards insuficientes! Assista um anúncio ou jogue mais.", 2.0)
		return false
	
	prog["plasma_shards"] = shards - cost
	unlocked_skins[skin_id] = true
	prog["unlocked_skins"] = unlocked_skins
	SaveSystem.salvar(prog)
	
	skin_unlocked.emit(skin_id)
	equip_skin(skin_id)
	return true

func unlock_via_rewarded_ad(skin_id: String) -> void:
	if OS.has_feature("web"):
		JavaScriptBridge.eval("if(window.CrazyGames && window.CrazyGames.SDK && window.CrazyGames.SDK.ad) window.CrazyGames.SDK.ad.requestAd('rewarded');")
	
	unlocked_skins[skin_id] = true
	save_shop_data()
	skin_unlocked.emit(skin_id)
	equip_skin(skin_id)
	if EventBus and EventBus.has_signal("hud_show_message"):
		EventBus.hud_show_message.emit("SKIN DESBLOQUEADA POR ANÚNCIO!", 2.0)

func get_skin_info(skin_id: String) -> Dictionary:
	for s in SKINS_DEF:
		if s["id"] == skin_id:
			return s
	return {}
