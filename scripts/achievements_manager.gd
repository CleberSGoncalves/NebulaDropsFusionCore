extends Node

## AchievementsManager — Cofre de Conquistas & Multiplicador Permanente (Godot 4.7.2)
## Concede medalhas permanentes e multiplicador de score passivo para todas as partidas.

signal achievement_unlocked(id: String, title: String, bonus: float)

const ACHIEVEMENTS_DEF: Array[Dictionary] = [
	{
		"id": "first_fusion",
		"title": "Primeira Fusao",
		"desc": "Realize a sua primeira fusao nuclear de orbes",
		"icon": "[*]",
		"multiplier_bonus": 0.05
	},
	{
		"id": "tier5_reach",
		"title": "Poder Taquion",
		"desc": "Sintetize um orbe Tier 5 (Taquion)",
		"icon": "[5]",
		"multiplier_bonus": 0.05
	},
	{
		"id": "tier8_reach",
		"title": "Singularidade",
		"desc": "Sintetize um orbe Tier 8 (Antimateria)",
		"icon": "[8]",
		"multiplier_bonus": 0.05
	},
	{
		"id": "omega_core",
		"title": "Nucleo Omega",
		"desc": "Sintetize o lendario Nucleo de Fusao Omega (T11)",
		"icon": "[W]",
		"multiplier_bonus": 0.10
	},
	{
		"id": "combo_cascade",
		"title": "Mestre da Cascata",
		"desc": "Atinja um combo de fusao em cascata x4 ou superior",
		"icon": "[!]",
		"multiplier_bonus": 0.05
	},
	{
		"id": "speed_runner",
		"title": "Velocista Estelar",
		"desc": "Conclua qualquer setor em menos de 45 segundos",
		"icon": "[>]",
		"multiplier_bonus": 0.05
	},
	{
		"id": "three_stars_5",
		"title": "Constelacao Tripla",
		"desc": "Conquiste 3 estrelas em pelo menos 5 setores",
		"icon": "[*3]",
		"multiplier_bonus": 0.05
	},
	{
		"id": "tactical_genius",
		"title": "Estrategista Cosmico",
		"desc": "Utilize os power-ups taticos de Martelo e Desfazer",
		"icon": "[T]",
		"multiplier_bonus": 0.05
	},
	{
		"id": "overdrive_survivor",
		"title": "Piloto Overdrive",
		"desc": "Alcance 2.000 pontos no frenetico Modo Overdrive",
		"icon": "[OD]",
		"multiplier_bonus": 0.05
	},
	{
		"id": "time_attack_master",
		"title": "Senhor do Tempo",
		"desc": "Alcance 3.000 pontos na corrida do Modo Time Attack",
		"icon": "[TA]",
		"multiplier_bonus": 0.05
	}
]

var unlocked_achievements: Dictionary = {}

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	load_achievements()
	if EventBus:
		if EventBus.has_signal("orbs_merged"):
			EventBus.orbs_merged.connect(_on_orbs_merged)

func load_achievements() -> void:
	if SaveSystem:
		var prog: Dictionary = SaveSystem.carregar()
		unlocked_achievements = prog.get("achievements", {})

func save_achievements() -> void:
	if SaveSystem:
		var prog: Dictionary = SaveSystem.carregar()
		prog["achievements"] = unlocked_achievements
		SaveSystem.salvar(prog)

func is_unlocked(id: String) -> bool:
	return bool(unlocked_achievements.get(id, false))

func unlock(id: String) -> bool:
	if is_unlocked(id):
		return false
	
	unlocked_achievements[id] = true
	save_achievements()
	
	var info: Dictionary = get_achievement_info(id)
	achievement_unlocked.emit(id, str(info.get("title", id)), float(info.get("multiplier_bonus", 0.05)))
	if EventBus and EventBus.has_signal("hud_show_message"):
		var msg: String = "CONQUISTA DESBLOQUEADA: " + str(info.get("title", id)) + " (+%d%% Score Permanente!)" % int(float(info.get("multiplier_bonus", 0.05)) * 100)
		EventBus.hud_show_message.emit(msg, 3.5)
	return true

func get_achievement_info(id: String) -> Dictionary:
	for a in ACHIEVEMENTS_DEF:
		if a["id"] == id:
			return a
	return {}

func get_total_multiplier() -> float:
	var mult: float = 1.0
	for a in ACHIEVEMENTS_DEF:
		if is_unlocked(a["id"]):
			mult += float(a.get("multiplier_bonus", 0.05))
	return mult

func _on_orbs_merged(new_tier: int, _pos: Vector2, _pts: int) -> void:
	unlock("first_fusion")
	if new_tier >= 5:
		unlock("tier5_reach")
	if new_tier >= 8:
		unlock("tier8_reach")
	if new_tier >= 11:
		unlock("omega_core")
