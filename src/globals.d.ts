declare module "vec" {
    export interface Atable {
        at(index: number): number;
    }
    export interface Mapable {
        map(mapper: (value: number, index: number) => number): this;
    }
    export interface Clonable {
        clone(): this;
    }
    export interface ImmutableOperable extends Atable, Mapable, Clonable {
    }
    export class Scalar implements Atable {
        value: number;
        constructor(value: number);
        at(_: number): number;
    }
    export class Vec1 {
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
    export class Vec2 extends Vec1 {
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
    export class Vec3 extends Vec2 {
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
    export function fract<T extends number | ImmutableOperable>(value: T): T;
}
declare module "globals" {
    import { fract as _fract, Vec2, Vec3, type ImmutableOperable } from "vec";
    function _vec2(x: number, y: number): Vec2;
    function _vec3(x: number, y: number, z: number): Vec3;
    function _min(a: number, b: number): number;
    function _max(a: number, b: number): number;
    function _clamp(value: number, minVal: number, maxVal: number): number;
    function _mix<T extends number | ImmutableOperable>(a: T, b: T, t: number): T;
    global {
        const time: number;
        const vec2: typeof _vec2;
        const vec3: typeof _vec3;
        const fract: typeof _fract;
        const mix: typeof _mix;
        const min: typeof _min;
        const max: typeof _max;
        const clamp: typeof _clamp;
        type Optional<T> = T | null | undefined;
        type vec2 = Vec2;
        type vec3 = Vec3;
    }
}
