interface Atable {
	at(index: number): number;
}
interface Mapable {
	map(mapper: (value: number, index: number) => number): this;
}
interface Clonable {
	clone(): this;
}
interface ImmutableOperable extends Atable, Mapable, Clonable {
}
declare class Scalar implements Atable {
	value: number;
	constructor(value: number);
	at(_: number): number;
}
declare class Vec1 {
	x: number;
	length: number;
	constructor(x: number);
	get r(): number;
	set r(v: number);
	at(index: number): number;
	set(x: number): this;
	map(mapper: (value: number, index: number) => number): this;
	add(other: Atable | number): this;
	sub(other: Atable | number): this;
	mul(other: Atable | number): this;
	div(other: Atable | number): this;
	fract(): this;
	round(): this;
	len(): number;
}
declare class Vec2 extends Vec1 {
	y: number;
	length: number;
	constructor(x: number, y?: number);
	get r(): number;
	set r(v: number);
	get g(): number;
	set g(v: number);
	at(index: number): number;
	set(x: number, y?: number): this;
	map(mapper: (value: number, index: number) => number): this;
	clone(): Vec2;
}
declare class Vec3 extends Vec2 {
	z: number;
	length: number;
	constructor(x: number, y?: number, z?: number);
	get b(): number;
	set b(v: number);
	at(index: number): number;
	set(x: number, y: number, z?: number): this;
	map(mapper: (value: number, index: number) => number): this;
	clone(): Vec3;
}
declare function vec2(x: number, y: number): Vec2;
declare function vec3(x: number, y: number, z: number): Vec3;
declare function fract<T extends number | ImmutableOperable>(value: T): T;
declare function min(a: number, b: number): number;
declare function max(a: number, b: number): number;
declare function clamp(value: number, minVal: number, maxVal: number): number;
declare function mix<T extends number | ImmutableOperable>(a: T, b: T, t: number): T;
declare type vec2 = Vec2;
declare type vec3 = Vec3;
declare type Optional<T> = T | null | undefined;
