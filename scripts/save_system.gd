extends Node

## SaveSystem — Persistência Atômica Anti-Corrupção (Godot 4.7.2)
## Grava primeiro em user://save_temp.json antes de renomear para user://savegame.json

const TEMP_PATH: String = "user://save_temp.json"
const SAVE_PATH: String = "user://savegame.json"

func salvar(dados: Dictionary) -> void:
	var arquivo: FileAccess = FileAccess.open(TEMP_PATH, FileAccess.WRITE)
	if arquivo:
		arquivo.store_string(JSON.stringify(dados))
		arquivo.close() # Sincroniza imediatamente com IndexedDB na Web
		if FileAccess.file_exists(SAVE_PATH):
			DirAccess.remove_absolute(SAVE_PATH)
		DirAccess.rename_absolute(TEMP_PATH, SAVE_PATH)

func carregar() -> Dictionary:
	if not FileAccess.file_exists(SAVE_PATH):
		return {}
	var arquivo: FileAccess = FileAccess.open(SAVE_PATH, FileAccess.READ)
	if not arquivo:
		return {}
	var raw: String = arquivo.get_as_text()
	arquivo.close()
	var parsed: Variant = JSON.parse_string(raw)
	return parsed if parsed is Dictionary else {}

func obter_progresso() -> Dictionary:
	var dados: Dictionary = carregar()
	return {
		"max_level": int(dados.get("max_level", 1)),
		"high_score": int(dados.get("high_score", 0)),
		"plasma_shards": int(dados.get("plasma_shards", 0)),
		"muted": bool(dados.get("muted", false)),
		"stars": dados.get("stars", {})
	}

func salvar_progresso(max_level: int, high_score: int, muted: bool, stars: Dictionary = {}) -> void:
	var atual: Dictionary = obter_progresso()
	var stars_merged: Dictionary = atual.get("stars", {})
	for k in stars.keys():
		stars_merged[k] = max(int(stars_merged.get(k, 0)), int(stars[k]))
	salvar({
		"max_level": max(int(atual.get("max_level", 1)), max_level),
		"high_score": max(int(atual.get("high_score", 0)), high_score),
		"plasma_shards": int(atual.get("plasma_shards", 0)),
		"muted": muted,
		"stars": stars_merged
	})
