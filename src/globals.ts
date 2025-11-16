interface Atable {
	at(index: number): number;
}

interface Mapable {
	map(mapper: (value: number, index: number) => number): this;
}

interface Clonable {
	clone(): this;
}

interface ImmutableOperable extends Atable, Mapable, Clonable { }

class Scalar implements Atable {
	constructor(public value: number) { }

	at(_: number) {
		return this.value;
	}
}

class Vec1 {
	length = 1;

	constructor(public x: number) { }

	get r() {
		return this.x;
	}

	set r(v: number) {
		this.x = v;
	}

	at(index: number) {
		if (index === 0) return this.x;
		return 0;
	}

	set(x: number) {
		this.x = x;
		return this;
	}

	map(mapper: (value: number, index: number) => number) {
		this.x = mapper(this.x, 0);
		return this;
	}

	add(other: Atable | number) {
		if (typeof other === 'number') other = new Scalar(other);
		return this.map((v, i) => v + other.at(i));
	}

	sub(other: Atable | number) {
		if (typeof other === 'number') other = new Scalar(other);
		return this.map((v, i) => v - other.at(i));
	}

	mul(other: Atable | number) {
		if (typeof other === 'number') other = new Scalar(other);
		return this.map((v, i) => v * other.at(i));
	}

	div(other: Atable | number) {
		if (typeof other === 'number') other = new Scalar(other);
		return this.map((v, i) => v / other.at(i));
	}

	fract() {
		return this.map((v) => fract(v));
	}

	round() {
		return this.map((v) => Math.round(v));
	}

	len() {
		let sum = 0;
		for (let i = 0; i < this.length; i++) {
			const v = this.at(i);
			sum += v * v;
		}
		return Math.sqrt(sum);
	}
}

class Vec2 extends Vec1 {
	length = 2;

	constructor(x: number, public y: number = x) {
		super(x);
	}

	get r() {
		return this.x;
	}

	set r(v: number) {
		this.x = v;
	}

	get g() {
		return this.y;
	}

	set g(v: number) {
		this.y = v;
	}

	at(index: number) {
		if (index === 0) return this.x;
		if (index === 1) return this.y;
		return 0;
	}

	set(x: number, y?: number) {
		this.x = x;
		if (y !== undefined) this.y = y;
		return this;
	}

	map(mapper: (value: number, index: number) => number) {
		this.x = mapper(this.x, 0);
		this.y = mapper(this.y, 1);
		return this;
	}

	clone() {
		return new Vec2(this.x, this.y);
	}
}

class Vec3 extends Vec2 {
	length = 3;

	constructor(x: number, y: number = x, public z: number = y) {
		super(x, y);
	}

	get b() {
		return this.z;
	}

	set b(v: number) {
		this.z = v;
	}

	at(index: number) {
		if (index === 0) return this.x;
		if (index === 1) return this.y;
		if (index === 2) return this.z;
		return 0;
	}

	set(x: number, y: number, z?: number) {
		this.x = x;
		this.y = y;
		if (z !== undefined) this.z = z;
		return this;
	}

	map(mapper: (value: number, index: number) => number) {
		this.x = mapper(this.x, 0);
		this.y = mapper(this.y, 1);
		this.z = mapper(this.z, 2);
		return this;
	}

	clone() {
		return new Vec3(this.x, this.y, this.z);
	}
}

function vec2(x: number, y: number) {
	return new Vec2(x, y)
}

function vec3(x: number, y: number, z: number) {
	return new Vec3(x, y, z);
}

function fract<T extends number | ImmutableOperable>(value: T): T {
	if (typeof value === 'number') {
		return value - Math.floor(value) as T;
	}

	return value.clone().map((v) => v - Math.floor(v)) as T;
}

function min(a: number, b: number): number {
	return a < b ? a : b;
}

function max(a: number, b: number): number {
	return a > b ? a : b;
}

function clamp(value: number, minVal: number, maxVal: number): number {
	return min(max(value, minVal), maxVal);
}

function mix<T extends number | ImmutableOperable>(a: T, b: T, t: number): T {
	if (typeof a === 'number' && typeof b === 'number') {
		return a + (b - a) * t as T;
	}

	return (a as ImmutableOperable).clone().map((v, i) => {
		return v + ((b as ImmutableOperable).at(i) - v) * t;
	}) as T;
}

(window as any).mix = mix;
(window as any).min = min;
(window as any).max = max;
(window as any).clamp = clamp;

(window as any).vec2 = vec2;
(window as any).vec3 = vec3;
(window as any).fract = fract;

declare type vec2 = Vec2;
declare type vec3 = Vec3;

declare type Optional<T> = T | null | undefined;
