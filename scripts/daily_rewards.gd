extends Node

## DailyRewardsManager — Calendário de Recompensas Diárias (7 Dias) (Godot 4.7.2)
## Aumenta retenção D1 e D7 com prêmios crescentes de plasma shards, powerups e skins.

signal reward_claimed(day: int, reward_data: Dictionary)

const DAYS_DEF: Array[Dictionary] = [
	{"day": 1, "title": "Dia 1", "reward": "50 Shards", "shards": 50, "bonus": ""},
	{"day": 2, "title": "Dia 2", "reward": "100 Shards", "shards": 100, "bonus": "score_boost"},
	{"day": 3, "title": "Dia 3", "reward": "150 Shards + 2 Martelos", "shards": 150, "bonus": "hammer_2"},
	{"day": 4, "title": "Dia 4", "reward": "200 Shards + 2 Desfazer", "shards": 200, "bonus": "undo_2"},
	{"day": 5, "title": "Dia 5", "reward": "300 Shards + Catalisador", "shards": 300, "bonus": "catalyst_1"},
	{"day": 6, "title": "Dia 6", "reward": "450 Shards (2X)", "shards": 450, "bonus": "double_shards"},
	{"day": 7, "title": "Dia 7", "reward": "1000 Shards + Skin Zen", "shards": 1000, "bonus": "skin_zen_crystal"}
]

var current_streak: int = 1
var can_claim_today: bool = true
var last_claim_day_epoch: int = 0

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	check_status()

func check_status() -> void:
	if not SaveSystem:
		return
	var prog: Dictionary = SaveSystem.carregar()
	current_streak = int(prog.get("daily_streak", 1))
	last_claim_day_epoch = int(prog.get("last_claim_day_epoch", 0))
	
	var today_epoch: int = int(Time.get_unix_time_from_system() / 86400)
	if last_claim_day_epoch == 0:
		can_claim_today = true
	elif today_epoch > last_claim_day_epoch:
		if today_epoch - last_claim_day_epoch == 1:
			# Dia consecutivo
			can_claim_today = true
		else:
			# Quebrou o streak, reinicia para o dia 1
			current_streak = 1
			can_claim_today = true
	else:
		can_claim_today = false

func claim_today() -> Dictionary:
	if not can_claim_today:
		return {}
	
	var day_idx: int = clampi(current_streak - 1, 0, 6)
	var reward: Dictionary = DAYS_DEF[day_idx]
	
	var today_epoch: int = int(Time.get_unix_time_from_system() / 86400)
	last_claim_day_epoch = today_epoch
	can_claim_today = false
	
	# Aplica recompensa
	if SaveSystem:
		var prog: Dictionary = SaveSystem.carregar()
		var current_shards: int = int(prog.get("plasma_shards", 0))
		prog["plasma_shards"] = current_shards + int(reward["shards"])
		prog["daily_streak"] = (current_streak % 7) + 1
		prog["last_claim_day_epoch"] = last_claim_day_epoch
		SaveSystem.salvar(prog)
	
	current_streak = (current_streak % 7) + 1
	reward_claimed.emit(day_idx + 1, reward)
	
	if EventBus and EventBus.has_signal("hud_show_message"):
		EventBus.hud_show_message.emit("RECOMPENSA COLETADA: " + str(reward["reward"]) + "!", 3.0)
	
	return reward
