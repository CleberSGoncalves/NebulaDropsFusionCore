extends RefCounted
class_name LevelLoader

## LevelLoader — Carregador e Validador dos 20 Níveis Handcrafted (Godot 4.7.2)

const LEVELS_FILE: String = "res://data/levels.json"

static func load_all_levels() -> Array[Dictionary]:
	var result: Array[Dictionary] = []
	if not FileAccess.file_exists(LEVELS_FILE):
		push_warning("[LevelLoader] Arquivo levels.json não encontrado. Usando fallback procedural.")
		return result
	
	var file: FileAccess = FileAccess.open(LEVELS_FILE, FileAccess.READ)
	if not file:
		return result
	
	var content: String = file.get_as_text()
	file.close()
	
	var parsed: Variant = JSON.parse_string(content)
	if parsed is Dictionary and parsed.has("levels"):
		for lvl in parsed["levels"]:
			if lvl is Dictionary:
				result.append(lvl)
	
	return result

static func get_level(level_id: int) -> Dictionary:
	var all: Array[Dictionary] = load_all_levels()
	for lvl in all:
		if int(lvl.get("id", 0)) == level_id:
			return lvl
	if all.size() > 0:
		return all[0]
	return {
		"id": level_id,
		"name_en": "Chamber " + str(level_id),
		"name_pt": "Câmara " + str(level_id),
		"target_score": 250,
		"star1_score": 150,
		"star2_score": 260,
		"star3_score": 400,
		"target_tier": 3,
		"time_limit": 150,
		"gravity": 700,
		"theme": "default",
		"shard_reward": 50,
		"initial_orbs": []
	}
