import type { InstancedMesh } from "three";
import { Vec3 } from "./vec";
import * as THREE from "three";

export enum CodeRunnerStatus {
	IDLE,
	RUNNING,
	ERROR
}

export class CodeRunner {
	private resolution?: number;
	private rate: number = 20; // frames per second
	private densityFunc?: (pos: Vec3) => Optional<Vec3>;

	private material: THREE.Material = new THREE.MeshBasicMaterial();
	private instancedMesh?: InstancedMesh;

	private dummy = new THREE.Object3D();
	private currentPosition = new Vec3(0, 0, 0);

	private status = CodeRunnerStatus.IDLE;

	private lastTime = performance.now();
	private passedTime = 0;
	private timePerFrameMs = 1000 / this.rate;


	constructor(public scene: THREE.Scene, public update: () => void) {
	}

	updateResolution(newResolution: number) {
		if (this.resolution === newResolution) return;

		this.resolution = newResolution;

		const N = this.resolution;
		const SIZE = 1.0;
		const cubeSize = SIZE / N;
		const total = N * N * N;

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

	renderFrame() {
		if (!this.resolution) return;
		if (!this.densityFunc) return;
		if (!this.instancedMesh) return;

		// this.instancedMesh.count = 0;

		const N = this.resolution;

		let ptr = 0;

		(window as any).time = Date.now() / 1000;

		for (let xi = 0; xi < N; xi++) {
			for (let yi = 0; yi < N; yi++) {
				for (let zi = 0; zi < N; zi++) {
					const x = xi / (N - 1);
					const y = yi / (N - 1);
					const z = zi / (N - 1);

					const color = this.densityFunc(this.currentPosition.set(x, y, z));
					if (!color) continue;

					this.dummy.position.set(x - 0.5, y - 0.5, z - 0.5);
					this.dummy.updateMatrix();

					this.instancedMesh.setMatrixAt(ptr, this.dummy.matrix);
					this.instancedMesh.setColorAt(ptr, new THREE.Color(color.r, color.g, color.b));

					ptr++;
				}
			}
		}

		this.instancedMesh.count = ptr;
		this.instancedMesh.instanceColor!.needsUpdate = true;
		this.instancedMesh.instanceMatrix.needsUpdate = true;
	}

	start() {
		if (this.status === CodeRunnerStatus.RUNNING) return;

		if (!this.resolution) return;
		if (!this.densityFunc) return;
		if (!this.instancedMesh) return;

		this.status = CodeRunnerStatus.RUNNING;

		const frameLoop = () => {
			const now = performance.now();
			const delta = now - this.lastTime;
			this.lastTime = now;
			this.passedTime += delta;

			const isUpdateFrame = this.passedTime >= this.timePerFrameMs;
			this.passedTime %= this.timePerFrameMs;

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

	stop() {
		this.status = CodeRunnerStatus.IDLE;
	}

	isRunning() {
		return this.status === CodeRunnerStatus.RUNNING;
	}
}