extends CharacterBody2D

## Player (Dropper Pod) — Controlador do Emissor de Orbes no Topo do Reator (Godot 4.7.2)
## Suporta Desktop (WASD / Setas / Mouse) e Mobile Touch com Coyote/Buffer para disparo.

@export var move_speed: float = 420.0
@export var container_left: float = 380.0
@export var container_right: float = 900.0
@export var drop_cooldown: float = 0.45

var current_orb_tier: int = 1
var next_orb_tier: int = 2
var _cooldown_timer: float = 0.0
var _drop_buffered: bool = false
var _buffer_timer: float = 0.0

func _ready() -> void:
	add_to_group("player")
	position.y = 110.0
	position.x = (container_left + container_right) * 0.5
	_randomize_next_orbs()

func _physics_process(delta: float) -> void:
	if _cooldown_timer > 0.0:
		_cooldown_timer = maxf(0.0, _cooldown_timer - delta)

	if _buffer_timer > 0.0:
		_buffer_timer = maxf(0.0, _buffer_timer - delta)
		if _cooldown_timer <= 0.0 and _drop_buffered:
			_execute_drop()

	var dir: float = Input.get_axis("ui_left", "ui_right")
	if absf(dir) > 0.01:
		velocity.x = dir * move_speed
		position.x = clampf(position.x + velocity.x * delta, container_left, container_right)
	else:
		velocity.x = move_toward(velocity.x, 0.0, move_speed * delta * 8.0)

	if Input.is_action_just_pressed("ui_accept"):
		request_drop()

func _input(event: InputEvent) -> void:
	if event is InputEventMouseMotion:
		var mm: InputEventMouseMotion = event as InputEventMouseMotion
		position.x = clampf(mm.position.x, container_left, container_right)
	elif event is InputEventMouseButton:
		var mb: InputEventMouseButton = event as InputEventMouseButton
		if mb.button_index == MOUSE_BUTTON_LEFT and mb.pressed:
			position.x = clampf(mb.position.x, container_left, container_right)
			request_drop()

func request_drop() -> void:
	if _cooldown_timer <= 0.0:
		_execute_drop()
	else:
		_drop_buffered = true
		_buffer_timer = 0.14

func _execute_drop() -> void:
	_drop_buffered = false
	_cooldown_timer = drop_cooldown
	var dropped_tier: int = current_orb_tier
	current_orb_tier = next_orb_tier
	next_orb_tier = randi_range(1, 4)
	if EventBus:
		EventBus.orb_dropped.emit(dropped_tier, position.x)
		EventBus.next_orb_updated.emit(next_orb_tier)

func _randomize_next_orbs() -> void:
	current_orb_tier = randi_range(1, 3)
	next_orb_tier = randi_range(1, 4)
	if EventBus:
		EventBus.next_orb_updated.emit(next_orb_tier)
