extends Node

## ThemeManager — Gerenciador de Biomas e Temas Visuais (Godot 4.7.2)
## Alterna entre Deep Space, Cyber Void (Glitch/Synthwave) e Cristais Zen

signal theme_changed(theme_name: String)

const THEMES: Dictionary = {
	"default": {
		"name": "Nebula Core",
		"bg_color": Color(0.02, 0.05, 0.12, 1.0),
		"grid_color": Color(0.0, 0.96, 1.0, 0.12),
		"wall_color": Color(0.22, 0.74, 0.97, 1.0),
		"ambient_particles": "starlight"
	},
	"cyber_void": {
		"name": "Cyber Void",
		"bg_color": Color(0.08, 0.02, 0.18, 1.0),
		"grid_color": Color(1.0, 0.2, 0.8, 0.22),
		"wall_color": Color(0.95, 0.25, 0.85, 1.0),
		"ambient_particles": "glitch_sparks"
	},
	"zen_crystal": {
		"name": "Cristais Zen",
		"bg_color": Color(0.02, 0.12, 0.18, 1.0),
		"grid_color": Color(0.4, 0.9, 0.85, 0.16),
		"wall_color": Color(0.3, 0.95, 0.8, 1.0),
		"ambient_particles": "prism_dust"
	}
}

var current_theme: String = "default"

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS

func set_theme(theme_name: String) -> void:
	if not THEMES.has(theme_name):
		theme_name = "default"
	current_theme = theme_name
	theme_changed.emit(current_theme)
	if EventBus and EventBus.has_user_signal("theme_changed"):
		EventBus.emit_signal("theme_changed", current_theme)

func get_theme_data(theme_name: String = "") -> Dictionary:
	var t: String = theme_name if theme_name != "" else current_theme
	return THEMES.get(t, THEMES["default"])
