export const RESOLUTION = 80;

export function density(pos: vec3): Optional<vec3> {
	pos.mul(2).fract().sub(0.5).mul(2);

	const d = pos.len();
	if (d > 1) return null;

	return pos;
}