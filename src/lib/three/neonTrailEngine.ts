import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

export type NeonTrailOptions = {
	tubeColors?: string[];
	lightColors?: string[];
	lightIntensity?: number;
	tubeCount?: number;
	reducedMotion?: boolean;
};

export type NeonTrailEngine = {
	setColors: (colors: string[]) => void;
	setLightsColors: (colors: string[]) => void;
	resize: () => void;
	dispose: () => void;
};

const DEFAULT_TUBE_COLORS = ['#f967fb', '#53bc28', '#6958d5'];
const DEFAULT_LIGHT_COLORS = ['#83f36e', '#fe8a2e', '#ff008a', '#60aed5'];

type TubeState = {
	mesh: THREE.Mesh;
	points: THREE.Vector3[];
	offset: THREE.Vector3;
	phase: number;
	material: THREE.MeshStandardMaterial;
};

/**
 * Neon 3D tubes cursor trail — FreeFrontend / TubesCursor-style.
 * Pointer history is extruded into glowing tubes with bloom + point lights.
 */
export function createNeonTrailEngine(
	canvas: HTMLCanvasElement,
	options: NeonTrailOptions = {}
): NeonTrailEngine {
	const reducedMotion = !!options.reducedMotion;
	const tubeCount = Math.max(4, Math.min(14, options.tubeCount ?? 8));
	const historyLen = reducedMotion ? 14 : 22;
	const tubeRadius = 0.05;
	const tubularSegments = historyLen;

	let tubeColors = (options.tubeColors ?? DEFAULT_TUBE_COLORS).map((c) => new THREE.Color(c));
	let lightColors = (options.lightColors ?? DEFAULT_LIGHT_COLORS).map((c) => new THREE.Color(c));
	let lightIntensity = options.lightIntensity ?? (reducedMotion ? 1.2 : 2.4);

	const renderer = new THREE.WebGLRenderer({
		canvas,
		antialias: false,
		alpha: false,
		powerPreference: 'high-performance'
	});
	renderer.setClearColor(0x000000, 1);
	renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
	renderer.outputColorSpace = THREE.SRGBColorSpace;
	renderer.toneMapping = THREE.ACESFilmicToneMapping;
	renderer.toneMappingExposure = 1.05;

	const scene = new THREE.Scene();
	const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
	camera.position.set(0, 0, 8);
	camera.lookAt(0, 0, 0);

	const ambient = new THREE.AmbientLight(0x101018, 0.35);
	scene.add(ambient);

	const lights: THREE.PointLight[] = [];
	for (let i = 0; i < 4; i++) {
		const light = new THREE.PointLight(lightColors[i % lightColors.length], lightIntensity, 18, 2);
		light.position.set(
			Math.cos((i / 4) * Math.PI * 2) * 2.5,
			Math.sin((i / 4) * Math.PI * 2) * 1.6,
			2.2
		);
		scene.add(light);
		lights.push(light);
	}

	const pointer = new THREE.Vector2(0, 0);
	const target = new THREE.Vector3(0, 0, 0);
	const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
	const raycaster = new THREE.Raycaster();
	const hit = new THREE.Vector3();
	let hovering = false;

	const tubes: TubeState[] = [];
	for (let i = 0; i < tubeCount; i++) {
		const t = i / Math.max(1, tubeCount - 1);
		const color = tubeColors[0].clone().lerp(tubeColors[tubeColors.length - 1], t);
		if (tubeColors.length > 2) {
			const mid = tubeColors[Math.floor(tubeColors.length / 2)];
			color.copy(tubeColors[0]).lerp(mid, Math.min(1, t * 2));
			if (t > 0.5) color.copy(mid).lerp(tubeColors[tubeColors.length - 1], (t - 0.5) * 2);
		}

		const material = new THREE.MeshStandardMaterial({
			color,
			emissive: color.clone().multiplyScalar(0.85),
			emissiveIntensity: 1.4,
			roughness: 0.25,
			metalness: 0.35,
			toneMapped: true
		});

		const points: THREE.Vector3[] = [];
		for (let p = 0; p < historyLen; p++) points.push(new THREE.Vector3());

		const curve = new THREE.CatmullRomCurve3(points);
		const geom = new THREE.TubeGeometry(curve, tubularSegments, tubeRadius, 6, false);
		const mesh = new THREE.Mesh(geom, material);
		scene.add(mesh);

		tubes.push({
			mesh,
			points,
			offset: new THREE.Vector3(
				(Math.random() - 0.5) * 0.35,
				(Math.random() - 0.5) * 0.35,
				(Math.random() - 0.5) * 0.2
			),
			phase: Math.random() * Math.PI * 2,
			material
		});
	}

	const composer = new EffectComposer(renderer);
	composer.addPass(new RenderPass(scene, camera));
	const bloom = new UnrealBloomPass(
		new THREE.Vector2(2, 2),
		reducedMotion ? 0.55 : 0.95,
		0.55,
		0.12
	);
	composer.addPass(bloom);

	let raf = 0;
	let disposed = false;
	let last = performance.now();
	let elapsed = 0;

	function worldFromClient(clientX: number, clientY: number, out: THREE.Vector3) {
		const rect = canvas.getBoundingClientRect();
		pointer.x = ((clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
		pointer.y = -(((clientY - rect.top) / Math.max(1, rect.height)) * 2 - 1);
		raycaster.setFromCamera(pointer, camera);
		if (raycaster.ray.intersectPlane(plane, hit)) out.copy(hit);
	}

	function onPointerMove(e: PointerEvent) {
		hovering = true;
		worldFromClient(e.clientX, e.clientY, target);
	}

	function onPointerLeave() {
		hovering = false;
	}

	function colorAt(i: number, n: number) {
		if (tubeColors.length === 1) return tubeColors[0].clone();
		const t = n <= 1 ? 0 : i / (n - 1);
		const scaled = t * (tubeColors.length - 1);
		const a = Math.floor(scaled);
		const b = Math.min(tubeColors.length - 1, a + 1);
		return tubeColors[a].clone().lerp(tubeColors[b], scaled - a);
	}

	function setColors(colors: string[]) {
		if (!colors.length) return;
		tubeColors = colors.map((c) => new THREE.Color(c));
		tubes.forEach((tube, i) => {
			const c = colorAt(i, tubes.length);
			tube.material.color.copy(c);
			tube.material.emissive.copy(c).multiplyScalar(0.85);
		});
	}

	function setLightsColors(colors: string[]) {
		if (!colors.length) return;
		lightColors = colors.map((c) => new THREE.Color(c));
		lights.forEach((light, i) => {
			light.color.copy(lightColors[i % lightColors.length]);
		});
	}

	function rebuildTube(tube: TubeState) {
		const curve = new THREE.CatmullRomCurve3(tube.points);
		const next = new THREE.TubeGeometry(curve, tubularSegments, tubeRadius, 6, false);
		tube.mesh.geometry.dispose();
		tube.mesh.geometry = next;
	}

	function resize() {
		if (disposed) return;
		const parent = canvas.parentElement;
		const w = Math.max(1, parent?.clientWidth || window.innerWidth);
		const h = Math.max(1, parent?.clientHeight || window.innerHeight);
		camera.aspect = w / h;
		camera.updateProjectionMatrix();
		renderer.setSize(w, h, false);
		composer.setSize(w, h);
	}

	const tmp = new THREE.Vector3();
	const dir = new THREE.Vector3();

	function frame(now: number) {
		if (disposed) return;
		raf = requestAnimationFrame(frame);
		if (document.hidden) {
			last = now;
			return;
		}

		const dt = Math.min(0.05, (now - last) / 1000);
		last = now;
		elapsed += dt;

		if (!hovering) {
			const rx = 2.2 * Math.cos(elapsed * 0.7);
			const ry = 1.2 * Math.sin(elapsed * 0.95);
			target.set(rx, ry, 0);
		}

		const lerp = reducedMotion ? 0.22 : 0.14;
		tubes.forEach((tube, i) => {
			const noise =
				0.15 * Math.sin(elapsed * 1.4 + tube.phase) * (0.4 + (i % 5) * 0.12);
			tmp.copy(target).add(tube.offset);
			if (tube.offset.lengthSq() > 1e-6) {
				dir.copy(tube.offset).normalize();
				tmp.addScaledVector(dir, noise);
			}

			const head = tube.points[tube.points.length - 1];
			head.lerp(tmp, lerp);

			for (let p = tube.points.length - 2; p >= 0; p--) {
				tube.points[p].lerp(tube.points[p + 1], 0.42);
			}
			rebuildTube(tube);
		});

		lights.forEach((light, i) => {
			const a = elapsed * (0.6 + i * 0.1) + i;
			light.position.x = Math.cos(a) * 2.8;
			light.position.y = Math.sin(a * 1.1) * 1.8;
			light.intensity = lightIntensity * (0.85 + 0.2 * Math.sin(elapsed * 2 + i));
		});

		composer.render();
	}

	function dispose() {
		disposed = true;
		cancelAnimationFrame(raf);
		window.removeEventListener('pointermove', onPointerMove);
		window.removeEventListener('pointerleave', onPointerLeave);
		window.removeEventListener('resize', resize);
		tubes.forEach((tube) => {
			tube.mesh.geometry.dispose();
			tube.material.dispose();
			scene.remove(tube.mesh);
		});
		composer.dispose();
		renderer.dispose();
	}

	window.addEventListener('pointermove', onPointerMove, { passive: true });
	window.addEventListener('pointerleave', onPointerLeave);
	window.addEventListener('resize', resize, { passive: true });

	resize();
	raf = requestAnimationFrame(frame);

	return { setColors, setLightsColors, resize, dispose };
}
