import type { InstancedMesh } from "three";
import { Vec3 } from "./vec";
import * as THREE from "three";

export enum CodeRunnerStatus {
	IDLE,
	RUNNING,
	ERROR
}

const neighborOffsets = [
	vec3(-1, 0, 0),
	vec3(1, 0, 0),
	vec3(0, -1, 0),
	vec3(0, 1, 0),
	vec3(0, 0, -1),
	vec3(0, 0, 1),
]

export class CodeRunner {
	private resolution?: number;
	private rate: number = 20; // frames per second
	private densityFunc?: (pos: Vec3) => Optional<Vec3>;
	private presenceBitArray?: Uint32Array;
	private pause?: boolean | (() => boolean);

	private r?: Float32Array;
	private g?: Float32Array;
	private b?: Float32Array;

	private material: THREE.Material = new THREE.MeshBasicMaterial();
	private instancedMesh?: InstancedMesh;

	private dummy = new THREE.Object3D();
	private currentPosition = new Vec3(0, 0, 0);

	private status = CodeRunnerStatus.IDLE;

	private lastTime = performance.now();
	private passedTime = 0;
	private timePerFrameMs = 1000 / this.rate;

	private pendingUpdates: (() => void)[] = [];


	constructor(public scene: THREE.Scene, public update: () => void) {
	}

	/**
	 * fails if out of bounds (negative or bigger than res)
	 */
	private idx(x: number, y: number, z: number) {
		return x + y * this.resolution! + z * this.resolution! * this.resolution!;
	}

	private isPresent(i: number): boolean {
		if (!this.presenceBitArray) return false;

		return (this.presenceBitArray![i >>> 5] & (1 << (i & 31))) !== 0;
	}

	private isInBounds(x: number, y: number, z: number): boolean {
		return x >= 0 && y >= 0 && z >= 0 &&
			x < this.resolution! && y < this.resolution! && z < this.resolution!;
	}

	private isVisible(x: number, y: number, z: number): boolean {
		const hidden = neighborOffsets.every(offset => {
			const nX = x + offset.x;
			const nY = y + offset.y;
			const nZ = z + offset.z;

			if (!this.isInBounds(nX, nY, nZ)) return false;

			const i = this.idx(nX, nY, nZ);
			return this.isPresent(i);
		});

		return !hidden;
	}

	private setPresent(i: number, value: boolean) {
		const w = i >>> 5;
		const b = 1 << (i & 31);
		if (value) this.presenceBitArray![w] |= b;
		else this.presenceBitArray![w] &= ~b;
	}

	private setColor(i: number, color: Vec3) {
		this.r![i] = color.r;
		this.g![i] = color.g;
		this.b![i] = color.b;
	}

	public requestUpdate(cb: () => void) {
		this.pendingUpdates.push(cb)
	}

	updateResolution(newResolution: number) {
		if (this.resolution === newResolution) return;

		this.resolution = newResolution;

		const N = this.resolution;
		const SIZE = 1.0;
		const cubeSize = SIZE / N;
		const total = N * N * N;

		const bitArrayLength = Math.ceil((newResolution * newResolution * newResolution) / 32);
		this.presenceBitArray = new Uint32Array(bitArrayLength);

		this.r = new Float32Array(total);
		this.g = new Float32Array(total);
		this.b = new Float32Array(total);

		const geo = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);

		if (this.instancedMesh) {
			this.instancedMesh.geometry.dispose();
			this.instancedMesh.dispose();
			this.scene.remove(this.instancedMesh);
		}

		this.instancedMesh = new THREE.InstancedMesh(geo, this.material, total);
		this.instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
		this.scene.add(this.instancedMesh);
	}

	updateDensityFunction(func: (pos: Vec3) => Optional<Vec3>) {
		this.densityFunc = func;
	}

	updateRate(newRate: number) {
		if (this.rate === newRate) return;

		this.rate = newRate;
		this.timePerFrameMs = 1000 / this.rate;
	}

	updateState(pause: boolean | (() => boolean) | undefined) {
		this.pause = pause;
	}

	renderFrame() {
		if (this.pendingUpdates.length > 0) {
			this.pendingUpdates.forEach(cb => cb());
			this.pendingUpdates = [];
		}

		if (!this.resolution) return;
		if (!this.densityFunc) return;
		if (!this.instancedMesh) return;

		// this.instancedMesh.count = 0;

		const N = this.resolution;

		let ptr = 0;

		(window as any).time = Date.now() / 1000;

		// prepass
		for (let xi = 0; xi < N; xi++) {
			for (let yi = 0; yi < N; yi++) {
				for (let zi = 0; zi < N; zi++) {
					const x = xi / (N - 1);
					const y = yi / (N - 1);
					const z = zi / (N - 1);


					const color = this.densityFunc(this.currentPosition.set(x, y, z));
					const i = this.idx(xi, yi, zi);

					this.setPresent(i, !!color);
					if (color) {
						this.setColor(i, color);
					}

				}
			}
		}

		// upload pass
		for (let xi = 0; xi < N; xi++) {
			for (let yi = 0; yi < N; yi++) {
				for (let zi = 0; zi < N; zi++) {
					const i = this.idx(xi, yi, zi);
					if (!this.isPresent(i)) continue;
					if (!this.isVisible(xi, yi, zi)) continue;

					const x = xi / (N - 1);
					const y = yi / (N - 1);
					const z = zi / (N - 1);

					this.dummy.position.set(x - 0.5, y - 0.5, z - 0.5);
					this.dummy.updateMatrix();

					this.instancedMesh.setMatrixAt(ptr, this.dummy.matrix);
					this.instancedMesh.setColorAt(ptr, new THREE.Color(this.r![i], this.g![i], this.b![i]));

					ptr++;
				}
			}
		}

		// this.dummy.position.set(x - 0.5, y - 0.5, z - 0.5);
		// 			this.dummy.updateMatrix();

		// 			this.instancedMesh.setMatrixAt(ptr, this.dummy.matrix);
		// 			this.instancedMesh.setColorAt(ptr, new THREE.Color(color.r, color.g, color.b));
		// ptr++;

		this.instancedMesh.count = ptr;
		this.instancedMesh.instanceColor!.needsUpdate = true;
		this.instancedMesh.instanceMatrix.needsUpdate = true;
	}

	loop() {
		if (!this.resolution) throw new Error("Resolution not set");
		if (!this.densityFunc) throw new Error("Resolution not set");
		if (!this.instancedMesh) throw new Error("Resolution not set");

		const frameLoop = () => {
			const now = performance.now();
			const delta = now - this.lastTime;
			this.lastTime = now;
			this.passedTime += delta;

			const isUpdateFrame = this.passedTime >= this.timePerFrameMs;
			this.passedTime %= this.timePerFrameMs;

			this.computeState();

			if (this.isRunning()) {
				try {
					if (isUpdateFrame) {
						this.renderFrame();
					}
				} catch (e) {
					this.status = CodeRunnerStatus.ERROR;
					console.error("Error during code execution:", e);
					return;
				}
			}

			this.update();

			requestAnimationFrame(frameLoop);
		}

		requestAnimationFrame(frameLoop);
	}

	computeState() {
		const paused = typeof this.pause === 'function' ? this.pause() : Boolean(this.pause);

		if (this.isRunning() && paused) {
			this.stop();
		} else if (!this.isRunning() && !paused) {
			this.start();
		}
	}

	start() {
		if (this.status === CodeRunnerStatus.RUNNING) return;

		this.status = CodeRunnerStatus.RUNNING;
	}

	stop() {
		this.status = CodeRunnerStatus.IDLE;
	}

	isRunning() {
		return this.status === CodeRunnerStatus.RUNNING;
	}
}