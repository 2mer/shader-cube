import { fract as _fract, Vec2, Vec3, type ImmutableOperable } from "./vec";


function _vec2(x: number, y?: number) {
	return new Vec2(x, y)
}

function _vec3(x: number, y?: number, z?: number) {
	return new Vec3(x, y, z);
}

function _min(a: number, b: number): number {
	return a < b ? a : b;
}

function _max(a: number, b: number): number {
	return a > b ? a : b;
}

function _clamp(value: number, minVal: number, maxVal: number): number {
	return _min(_max(value, minVal), maxVal);
}

function _mix<T extends number | ImmutableOperable>(a: T, b: T, t: number): T {
	if (typeof a === 'number' && typeof b === 'number') {
		return a + (b - a) * t as T;
	}

	return (a as ImmutableOperable).clone().map((v, i) => {
		return v + ((b as ImmutableOperable).at(i) - v) * t;
	}) as T;
}

(window as any).mix = _mix;
(window as any).min = _min;
(window as any).max = _max;
(window as any).clamp = _clamp;

(window as any).vec2 = _vec2;
(window as any).vec3 = _vec3;
(window as any).fract = _fract;
(window as any).slider = () => 0;
(window as any).checkbox = () => false;

declare global {
	const time: number;

	const vec2: typeof _vec2;
	const vec3: typeof _vec3;
	const fract: typeof _fract;

	const mix: typeof _mix;
	const min: typeof _min;
	const max: typeof _max;
	const clamp: typeof _clamp;

	function slider(defaultValue: number): number;
	function checkbox(defaultValue: boolean): boolean;

	type Optional<T> = T | null | undefined;

	type vec2 = Vec2;
	type vec3 = Vec3;
}