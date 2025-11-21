// === settings ===
export const RESOLUTION = 30;
export const RATE = 20;
export const PAUSE = () => checkbox(false);
// === settings ===

export function density(pos: vec3): Optional<vec3> {
	pos.mul(2).fract().sub(0.5).mul(2);

	const d = pos.len();

	if (d > slider(1)) return;

	return pos
		.add(time)
		.fract()
		.mul(
			vec3(
				slider(1),
				slider(1),
				slider(1),
			)
		);
}