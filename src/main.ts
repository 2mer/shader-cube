import './style.css';
import './globals';

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as monaco from "monaco-editor";
import { getUserCode } from './getUserCode';
import globalsDts from './globals.d.ts?raw';
import exampleCode from './exampleCode.ts?raw';
import { CodeRunner } from './CodeRunner';


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


// Simple debounce helper
function debounce(fn: Function, delay = 300) {
	let timer: number | undefined;
	return (...args: any[]) => {
		if (timer) clearTimeout(timer);
		timer = window.setTimeout(() => fn(...args), delay);
	};
}

const codeRunner = new CodeRunner(scene, () => {
	controls.update();
	renderer.render(scene, camera);
});

async function pullCodeAndRun() {
	const { density, RESOLUTION = 40, PAUSE, RATE } = await getUserCode(editor);

	codeRunner.requestUpdate(() => {
		codeRunner.updateDensityFunction(density);
		codeRunner.updateResolution(RESOLUTION);
		codeRunner.updateRate(RATE ?? 20);
		codeRunner.updateState(PAUSE);
	})

	codeRunner.renderFrame();
	codeRunner.loop();

}

// Run whenever content changes (debounced)
editor.onDidChangeModelContent(
	debounce(pullCodeAndRun, 300)
);

setTimeout(() => {
	pullCodeAndRun();
}, 1000);

(window as any).codeRunner = codeRunner;