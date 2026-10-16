shader_type canvas_item;

// Glitch & RGB Split Shader para Nebula Drops: Fusion Core
// Suporta distorção de onda, glitch horizontal em fatias e aberração cromática

uniform float glitch_intensity : hint_range(0.0, 1.0) = 0.0;
uniform float wave_intensity : hint_range(0.0, 1.0) = 0.0;
uniform float time_speed : hint_range(0.1, 10.0) = 2.0;

float random_noise(vec2 co) {
	return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

void fragment() {
	vec2 uv = UV;
	float t = TIME * time_speed;
	
	if (glitch_intensity > 0.01) {
		// Fatias horizontais de glitch
		float slice_y = floor(uv.y * 32.0);
		float slice_noise = random_noise(vec2(slice_y, floor(t * 8.0)));
		if (slice_noise < glitch_intensity * 0.4) {
			float offset = (random_noise(vec2(slice_y, t)) - 0.5) * 0.06 * glitch_intensity;
			uv.x += offset;
		}
		
		// Distorção de onda (clímax / combos)
		if (wave_intensity > 0.01) {
			uv.y += sin(uv.x * 20.0 + t * 4.0) * 0.008 * wave_intensity;
			uv.x += cos(uv.y * 15.0 + t * 3.0) * 0.008 * wave_intensity;
		}
		
		// Separação cromática RGB (Aberration)
		float rgb_split = 0.012 * glitch_intensity;
		vec4 r_col = texture(TEXTURE, vec2(uv.x + rgb_split, uv.y));
		vec4 g_col = texture(TEXTURE, uv);
		vec4 b_col = texture(TEXTURE, vec2(uv.x - rgb_split, uv.y));
		
		COLOR = vec4(r_col.r, g_col.g, b_col.b, (r_col.a + g_col.a + b_col.a) / 3.0);
	} else if (wave_intensity > 0.01) {
		uv.y += sin(uv.x * 12.0 + t * 2.0) * 0.004 * wave_intensity;
		COLOR = texture(TEXTURE, uv);
	} else {
		COLOR = texture(TEXTURE, uv);
	}
}
