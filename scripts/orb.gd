extends RigidBody2D
class_name FusionOrb2D

## FusionOrb2D — Orbe de Energia Líquida com Colisão Física e Fusão Segura via call_deferred()
## Nunca altera a árvore de cenas diretamente durante o flush de física.

@export var tier: int = 1
var is_merging: bool = false

func _ready() -> void:
	add_to_group("fusion_orbs")
	contact_monitor = true
	max_contacts_reported = 4
	body_entered.connect(_on_body_entered)

func _on_body_entered(body: Node) -> void:
	if is_merging:
		return
	if body is FusionOrb2D:
		var other: FusionOrb2D = body as FusionOrb2D
		if not other.is_merging and other.tier == tier and tier < 11:
			# Apenas o orbe com menor instance_id agenda a fusão para evitar duplicidade
			if get_instance_id() < other.get_instance_id():
				is_merging = true
				other.is_merging = true
				call_deferred("_executar_fusao", other)

func _executar_fusao(other: FusionOrb2D) -> void:
	if not is_inside_tree() or not is_instance_valid(other):
		return
	var mid_pos: Vector2 = (global_position + other.global_position) * 0.5
	var next_tier: int = tier + 1
	if GameManager:
		GameManager.register_fusion(next_tier, mid_pos)
	other.queue_free()
	queue_free()
