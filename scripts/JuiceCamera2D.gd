extends Camera2D
class_name JuiceCamera2D

## JuiceCamera2D — Câmera com Screen Shake baseado em Trauma² e Look-Ahead (Godot 4.7.2)
## Segue rigorosamente a fórmula Shake = Trauma * Trauma com amortecimento exponencial.

@export var target_path: NodePath = NodePath("")
@export var smoothing_speed: float = 10.0
@export var look_ahead_distance: float = 60.0
@export var look_ahead_speed: float = 5.0
@export var trauma_decay: float = 1.6
@export var max_offset: Vector2 = Vector2(16.0, 14.0)
@export var max_roll: float = 0.06

var trauma: float = 0.0
var _target: Node2D = null
var _look_ahead_offset: Vector2 = Vector2.ZERO
var _base_position: Vector2 = Vector2(640.0, 360.0)
var _noise_seed: float = 0.0

func _ready() -> void:
	if not target_path.is_empty():
		_target = get_node_or_null(target_path)
	_base_position = global_position
	drag_horizontal_enabled = true
	drag_vertical_enabled = true
	drag_left_margin = 0.2
	drag_right_margin = 0.2
	drag_top_margin = 0.15
	drag_bottom_margin = 0.15
	if EventBus and EventBus.has_signal("camera_shake_requested"):
		EventBus.camera_shake_requested.connect(add_trauma)

func add_trauma(amount: float) -> void:
	trauma = clampf(trauma + amount, 0.0, 1.0)

func _physics_process(delta: float) -> void:
	if is_instance_valid(_target):
		var vel: Vector2 = _target.get("velocity") if "velocity" in _target else Vector2.ZERO
		var desired_offset: Vector2 = vel.normalized() * look_ahead_distance if vel.length() > 10.0 else Vector2.ZERO
		_look_ahead_offset = _look_ahead_offset.lerp(desired_offset, look_ahead_speed * delta)
		_base_position = _base_position.lerp(_target.global_position + _look_ahead_offset, smoothing_speed * delta)
		global_position = _base_position

	if trauma > 0.0:
		trauma = maxf(0.0, trauma - trauma_decay * delta)
		var shake: float = trauma * trauma
		_noise_seed += delta * 45.0
		offset.x = sin(_noise_seed * 1.7) * max_offset.x * shake
		offset.y = cos(_noise_seed * 2.3) * max_offset.y * shake
		rotation = sin(_noise_seed * 1.3) * max_roll * shake
	else:
		offset = Vector2.ZERO
		rotation = 0.0

func set_limits(left_val: int, top_val: int, right_val: int, bottom_val: int) -> void:
	limit_left = left_val
	limit_top = top_val
	limit_right = right_val
	limit_bottom = bottom_val
