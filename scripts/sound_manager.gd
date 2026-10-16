extends Node

## SoundManager — Sons Sintetizados Procedurais & Trilha Sonora Ambiente (Godot 4.7.2)
## Gera áudio harmônico pentatônico e trilha ambiente cósmica relaxante com zero dependências externas.

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

var sfx_player: AudioStreamPlayer
var music_player: AudioStreamPlayer

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	
	sfx_player = AudioStreamPlayer.new()
	sfx_player.bus = "Master"
	add_child(sfx_player)
	
	music_player = AudioStreamPlayer.new()
	music_player.bus = "Master"
	music_player.volume_db = -12.0
	add_child(music_player)
	
	if EventBus:
		if EventBus.has_signal("orbs_merged"):
			EventBus.orbs_merged.connect(_on_orbs_merged)
		if EventBus.has_signal("haptic_requested"):
			EventBus.haptic_requested.connect(trigger_haptic)
	
	_start_ambient_music()

func play_merge_tone(tier: int, combo_level: int = 1) -> void:
	var note_idx: int = clampi((tier - 1) + (combo_level - 1), 0, PENTATONIC_FREQS.size() - 1)
	var freq: float = PENTATONIC_FREQS[note_idx]
	_synthesize_beep(freq, 0.18 + float(combo_level) * 0.04)
	trigger_haptic(25 + combo_level * 10)

func trigger_haptic(duration_ms: int = 25) -> void:
	if OS.has_feature("web"):
		JavaScriptBridge.eval("if (navigator.vibrate) navigator.vibrate(%d);" % duration_ms)

func _synthesize_beep(freq: float, duration: float) -> void:
	var sample_rate: int = 22050
	var num_samples: int = int(sample_rate * duration)
	var pcm_data := PackedByteArray()
	pcm_data.resize(num_samples * 2)
	
	for i in range(num_samples):
		var t: float = float(i) / float(sample_rate)
		var env: float = 1.0 - (float(i) / float(num_samples))
		# Sine pura com segundo harmônico suave para calor acústico
		var sample: float = (sin(t * freq * TAU) * 0.75 + sin(t * freq * 1.5 * TAU) * 0.25) * env * 0.38
		var val: int = clampi(int(sample * 32767.0), -32768, 32767)
		pcm_data.encode_s16(i * 2, val)
	
	var stream := AudioStreamWAV.new()
	stream.format = AudioStreamWAV.FORMAT_16_BITS
	stream.mix_rate = sample_rate
	stream.stereo = false
	stream.data = pcm_data
	
	sfx_player.stream = stream
	sfx_player.play()

func _start_ambient_music() -> void:
	# Síntese de trilha ambiente cósmica relaxante (Cmaj9 / Am9 warm drone de 6 segundos em loop contínuo)
	var sample_rate: int = 22050
	var duration: float = 6.0
	var num_samples: int = int(sample_rate * duration)
	var pcm_data := PackedByteArray()
	pcm_data.resize(num_samples * 2)
	
	var chord_freqs: Array[float] = [130.81, 196.00, 246.94, 293.66, 329.63]
	for i in range(num_samples):
		var t: float = float(i) / float(sample_rate)
		# Envelope de respiração contínua em seno para loop sem cliques
		var loop_env: float = 0.5 - 0.5 * cos(t / duration * TAU)
		var sample: float = 0.0
		for f in chord_freqs:
			sample += sin(t * f * TAU) * 0.18 + sin(t * f * 1.002 * TAU) * 0.12
		sample = sample * loop_env * 0.22
		var val: int = clampi(int(sample * 32767.0), -32768, 32767)
		pcm_data.encode_s16(i * 2, val)
	
	var stream := AudioStreamWAV.new()
	stream.format = AudioStreamWAV.FORMAT_16_BITS
	stream.mix_rate = sample_rate
	stream.stereo = false
	stream.loop_mode = AudioStreamWAV.LOOP_FORWARD
	stream.loop_begin = 0
	stream.loop_end = num_samples
	stream.data = pcm_data
	
	music_player.stream = stream
	music_player.play()

func _on_orbs_merged(new_tier: int, _pos: Vector2, _pts: int) -> void:
	play_merge_tone(new_tier, 1)
