import './style.css';

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as monaco from "monaco-editor";
import { getUserCode } from './getUserCode';
import globalsDts from './globals.d.ts?raw';
import exampleCode from './exampleCode.ts?raw';
import './globals';

monaco.languages.typescript.typescriptDefaults.addExtraLib(
	globalsDts,
	"globals.d.ts"
);

let editor = monaco.editor.create(document.getElementById("editor")!, {
	value: exampleCode,
	language: "typescript",
	theme: "vs-dark",
	automaticLayout: true,
});

/* -------------------- THREE SETUP -------------------- */

const canvas = document.getElementById("viewer") as HTMLCanvasElement;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(canvas.clientWidth, canvas.clientHeight);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

const camera = new THREE.PerspectiveCamera(
	60,
	canvas.clientWidth / canvas.clientHeight,
	0.1,
	100
);
camera.position.set(2.5, 2.5, 2.5);

const light = new THREE.AmbientLight(0x404040);
scene.add(light);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

function animate() {
	requestAnimationFrame(animate);
	controls.update();
	renderer.render(scene, camera);
}
animate();

/* -------------------- VOXELS -------------------- */

let instancedMesh: THREE.InstancedMesh | null = null;

function clearVoxels() {
	if (instancedMesh) {
		scene.remove(instancedMesh);
		instancedMesh.geometry.dispose();
		(instancedMesh.material as THREE.Material).dispose();
		instancedMesh = null;
	}
}

async function runUserCode() {
	// first try to get the code, if it fails to compile do not clear the render
	const { density, RESOLUTION = 40 } = await getUserCode(editor);

	clearVoxels();

	const N = RESOLUTION;
	const SIZE = 1.0;
	const cubeSize = SIZE / N;
	const total = N * N * N;

	const geo = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
	const mat = new THREE.MeshBasicMaterial();

	instancedMesh = new THREE.InstancedMesh(geo, mat, total);
	instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

	const dummy = new THREE.Object3D();
	let ptr = 0;
	const currentPosition = ((window as any).vec3)(0, 0, 0);

	for (let xi = 0; xi < N; xi++) {
		for (let yi = 0; yi < N; yi++) {
			for (let zi = 0; zi < N; zi++) {
				const x = xi / (N - 1);
				const y = yi / (N - 1);
				const z = zi / (N - 1);

				const color = density(currentPosition.set(x, y, z));
				if (!color) continue;

				dummy.position.set(x - 0.5, y - 0.5, z - 0.5);
				dummy.updateMatrix();
				instancedMesh.setMatrixAt(ptr, dummy.matrix);
				instancedMesh.setColorAt(ptr, new THREE.Color(color.r, color.g, color.b));
				ptr++;
			}
		}
	}

	instancedMesh.count = ptr;
	instancedMesh.instanceColor!.needsUpdate = true;

	scene.add(instancedMesh);
}

// Simple debounce helper
function debounce(fn: Function, delay = 300) {
	let timer: number | undefined;
	return (...args: any[]) => {
		if (timer) clearTimeout(timer);
		timer = window.setTimeout(() => fn(...args), delay);
	};
}

// Run whenever content changes (debounced)
editor.onDidChangeModelContent(
	debounce(() => {
		runUserCode();
	}, 300)
);

setTimeout(() => {
	runUserCode();
}, 100)
// document.getElementById("runBtn")!.addEventListener("click", () => runUserCode());

monaco.editor.onDidCreateEditor(() => {
	runUserCode();
})

monaco.editor.onDidCreateModel(() => {
	runUserCode();
})