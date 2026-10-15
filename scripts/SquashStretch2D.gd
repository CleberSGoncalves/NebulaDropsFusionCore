extends Node2D
class_name SquashStretch2D

## SquashStretch2D — Componente elástico de Squash & Stretch para Orbes de Fusão
## Aplica deformação não-linear preservando volume aparente durante quedas e fusões.

@export var target_visual_path: NodePath = NodePath("..")
@export var spring_stiffness: float = 18.0
@export var spring_damping: float = 10.0

var _visual: Node2D = null
var _target_scale: Vector2 = Vector2.ONE
var _velocity_scale: Vector2 = Vector2.ZERO

func _ready() -> void:
	_visual = get_node_or_null(target_visual_path)

func _physics_process(delta: float) -> void:
	if not is_instance_valid(_visual):
		return
	var displacement: Vector2 = _target_scale - _visual.scale
	var spring_force: Vector2 = displacement * spring_stiffness
	var damping_force: Vector2 = _velocity_scale * spring_damping
	_velocity_scale += (spring_force - damping_force) * delta
	_visual.scale += _velocity_scale * delta

func apply_drop_stretch() -> void:
	if not is_instance_valid(_visual):
		return
	_visual.scale = Vector2(0.78, 1.28)

func apply_impact_squash(intensity: float = 1.0) -> void:
	if not is_instance_valid(_visual):
		return
	var clamp_int: float = clampf(intensity, 0.2, 1.5)
	_visual.scale = Vector2(1.0 + 0.32 * clamp_int, 1.0 - 0.26 * clamp_int)

func apply_fusion_pop() -> void:
	if not is_instance_valid(_visual):
		return
	_visual.scale = Vector2(1.42, 0.68)
	if OS.has_feature("web"):
		JavaScriptBridge.eval("if (navigator.vibrate) navigator.vibrate(25);")
