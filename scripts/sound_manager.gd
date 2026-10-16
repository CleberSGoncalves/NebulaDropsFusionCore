extends Node

## SoundManager — Sons Sintetizados Procedurais & Vibração Háptica (Godot 4.7.2)
## Utiliza escala pentatônica harmônica para fusões em cascata e feedback háptico na Web.

const PENTATONIC_FREQS: Array[float] = [
	261.63, # C4
	293.66, # D4
	329.63, # E4
	392.00, # G4
	440.00, # A4
	523.25, # C5
	587.33, # D5
	659.25, # E5
	783.99, # G5
	880.00, # A5
	1046.50 # C6
]

var audio_player: AudioStreamPlayer

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	audio_player = AudioStreamPlayer.new()
	audio_player.bus = "Master"
	add_child(audio_player)
	
	if EventBus:
		if EventBus.has_signal("orbs_merged"):
			EventBus.orbs_merged.connect(_on_orbs_merged)
		if EventBus.has_signal("haptic_requested"):
			EventBus.haptic_requested.connect(trigger_haptic)

func play_merge_tone(tier: int, combo_level: int = 1) -> void:
	var note_idx: int = clampi((tier - 1) + (combo_level - 1), 0, PENTATONIC_FREQS.size() - 1)
	var freq: float = PENTATONIC_FREQS[note_idx]
	_synthesize_beep(freq, 0.12 + float(combo_level) * 0.03)
	trigger_haptic(25 + combo_level * 10)

func trigger_haptic(duration_ms: int = 25) -> void:
	if OS.has_feature("web"):
		JavaScriptBridge.eval("if (navigator.vibrate) navigator.vibrate(%d);" % duration_ms)

func _synthesize_beep(freq: float, duration: float) -> void:
	# Cria sintetizador procedural de onda senoidal simples
	var sample_rate: int = 22050
	var num_samples: int = int(sample_rate * duration)
	var pcm_data := PackedByteArray()
	pcm_data.resize(num_samples * 2)
	
	for i in range(num_samples):
		var t: float = float(i) / float(sample_rate)
		var env: float = 1.0 - (float(i) / float(num_samples)) # Decay linear
		var sample: float = sin(t * freq * TAU) * env * 0.45
		var val: int = clampi(int(sample * 32767.0), -32768, 32767)
		pcm_data.encode_s16(i * 2, val)
	
	var stream := AudioStreamWAV.new()
	stream.format = AudioStreamWAV.FORMAT_16_BITS
	stream.mix_rate = sample_rate
	stream.stereo = false
	stream.data = pcm_data
	
	audio_player.stream = stream
	audio_player.play()

func _on_orbs_merged(new_tier: int, _pos: Vector2, _pts: int) -> void:
	play_merge_tone(new_tier, 1)
