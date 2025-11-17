export interface Atable {
	at(index: number): number;
}

export interface Mapable {
	map(mapper: (value: number, index: number) => number): this;
}

export interface Clonable {
	clone(): this;
}

export interface ImmutableOperable extends Atable, Mapable, Clonable { }

export class Scalar implements Atable {
	constructor(public value: number) { }

	at(_: number) {
		return this.value;
	}
}

export class Vec1 {
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

export class Vec2 extends Vec1 {
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

export class Vec3 extends Vec2 {
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

export function fract<T extends number | ImmutableOperable>(value: T): T {
	if (typeof value === 'number') {
		return value - Math.floor(value) as T;
	}

	return value.clone().map((v) => v - Math.floor(v)) as T;
}