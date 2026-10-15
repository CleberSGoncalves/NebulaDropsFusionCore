extends Node
class_name HitStopManager

## HitStopManager — Micro-congelamento de impacto (Hit-Stop 40ms a 80ms) para Game Feel
## Comunica peso físico nas fusões de núcleos de alto nível sem travar a UI.

var _is_frozen: bool = false

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	if EventBus and EventBus.has_signal("hit_stop_requested"):
		EventBus.hit_stop_requested.connect(trigger_hit_stop)

func trigger_hit_stop(duration_sec: float = 0.055, time_scale_factor: float = 0.05) -> void:
	if _is_frozen:
		return
	_is_frozen = true
	Engine.time_scale = time_scale_factor
	var timer: SceneTreeTimer = get_tree().create_timer(duration_sec, true, false, true)
	timer.timeout.connect(_on_hit_stop_timeout)

func _on_hit_stop_timeout() -> void:
	Engine.time_scale = 1.0
	_is_frozen = false
