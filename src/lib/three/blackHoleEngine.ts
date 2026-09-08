import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import {
	RAY_VERT,
	RAY_FRAG,
	COMPOSITE_VERT,
	COMPOSITE_FRAG
} from './gargantuaShaders.js';

const D2R = Math.PI / 180;

/**
 * GARGANTUA cinematic keyframes (r, inclination°, azimuth°).
 * This closed Catmull–Rom path is the permanent “morph” fly-around.
 */
const CINE_KEYS: ReadonlyArray<readonly [number, number, number]> = [
	[58, 12, -30],
	[36, 6, 10],
	[26, 24, 55],
	[14, 14, 100],
	[20, 52, 150],
	[34, 80, 200],
	[46, 35, 270],
	[36, 8, 330]
];

/** Scale path radii so the hole reads ~75% larger than the stock reference. */
const SIZE_SCALE = 1 / 1.75;
/** Never closer than this — keeps photon-ring / red flares on screen. */
const R_FLOOR = 11.5;
/** Seconds per cinematic segment (reference default). */
const CINE_SEGMENT = 11;

const K_R = CINE_KEYS.map((k) => k[0] * SIZE_SCALE);
const K_I = CINE_KEYS.map((k) => k[1] * D2R);
const K_A = CINE_KEYS.map((k) => k[2] * D2R);

function cr(p0: number, p1: number, p2: number, p3: number, t: number) {
	const t2 = t * t;
	const t3 = t2 * t;
	return (
		0.5 *
		(2 * p1 +
			(-p0 + p2) * t +
			(2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
			(-p0 + 3 * p1 - 3 * p2 + p3) * t3)
	);
}

function wrapIdx(k: number, n: number) {
	return ((k % n) + n) % n;
}

function cinePath(time: number, out: THREE.Vector3) {
	const n = CINE_KEYS.length;
	const tt = time / CINE_SEGMENT;
	const i = Math.floor(tt);
	const t = tt - i;
	const v = (arr: number[], k: number) => arr[wrapIdx(k, n)];
	const az = (k: number) => K_A[wrapIdx(k, n)] + 2 * Math.PI * Math.floor(k / n);
	const r = Math.max(R_FLOOR, cr(v(K_R, i - 1), v(K_R, i), v(K_R, i + 1), v(K_R, i + 2), t));
	const inc = cr(v(K_I, i - 1), v(K_I, i), v(K_I, i + 1), v(K_I, i + 2), t);
	const a = cr(az(i - 1), az(i), az(i + 1), az(i + 2), t);
	return out.set(
		r * Math.cos(inc) * Math.sin(a),
		r * Math.sin(inc),
		r * Math.cos(inc) * Math.cos(a)
	);
}

function easeInOutCubic(k: number) {
	const t = Math.min(1, Math.max(0, k));
	return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

type Profile = {
	steps: number;
	minSteps: number;
	dpr: number;
	budget: number;
	bloom: boolean;
	/** Target frame interval ms (30fps mobile / 60fps desktop). */
	frameMs: number;
};

function buildProfile(): Profile {
	if (typeof window === 'undefined') {
		return { steps: 180, minSteps: 120, dpr: 1, budget: 1e6, bloom: false, frameMs: 33 };
	}
	const mobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
	const cores = navigator.hardwareConcurrency || 4;
	const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
		?.saveData;
	if (mobile || saveData || cores <= 4) {
		return { steps: 200, minSteps: 140, dpr: 1.1, budget: 1.2e6, bloom: false, frameMs: 33 };
	}
	return { steps: 360, minSteps: 200, dpr: 1.5, budget: 2.6e6, bloom: true, frameMs: 16.7 };
}

export type BlackHoleEngine = {
	resize: () => void;
	dispose: () => void;
};

export function createBlackHoleEngine(canvas: HTMLCanvasElement): BlackHoleEngine {
	const reducedMotion =
		typeof window !== 'undefined' &&
		window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	const profile = buildProfile();
	let liveSteps = profile.steps;

	let renderer: THREE.WebGLRenderer;
	try {
		renderer = new THREE.WebGLRenderer({
			canvas,
			antialias: false,
			powerPreference: 'high-performance',
			alpha: false,
			stencil: false,
			depth: false
		});
	} catch (e) {
		console.error('[black-hole] WebGL init failed', e);
		return { resize() {}, dispose() {} };
	}

	renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
	renderer.toneMapping = THREE.NoToneMapping;
	renderer.setClearColor(0x000000, 1);

	let halfFloatOK = true;
	try {
		const gl = renderer.getContext();
		halfFloatOK = !!(
			gl.getExtension('EXT_color_buffer_float') ||
			gl.getExtension('EXT_color_buffer_half_float')
		);
	} catch {
		halfFloatOK = false;
	}

	const fsScene = new THREE.Scene();
	const fsCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
	const camPos = new THREE.Vector3();
	const camTarget = new THREE.Vector3(0, 0, 0);
	const cinePos = new THREE.Vector3();
	cinePath(0, camPos);

	const uniforms = {
		uRes: { value: new THREE.Vector2(1, 1) },
		uTime: { value: 0 },
		uCamPos: { value: camPos.clone() },
		uCamTarget: { value: camTarget.clone() },
		uFov: { value: 1 / Math.tan(THREE.MathUtils.degToRad(44) / 2) },
		uSteps: { value: liveSteps | 0 },
		uRotSign: { value: 1 },
		uDebug: { value: 0 },
		uDin: { value: 2.75 },
		uDout: { value: 40 },
		uDopMax: { value: 1.85 },
		uOpNear: { value: 0.92 },
		uOpFar: { value: 0.82 },
		uDiskBright: { value: 1.12 },
		uStarBright: { value: 1.0 },
		uSkyFloor: { value: 0.035 },
		uRotSpeed: { value: reducedMotion ? 0.25 : 1.0 }
	};

	const fsMat = new THREE.ShaderMaterial({
		vertexShader: RAY_VERT,
		fragmentShader: RAY_FRAG,
		uniforms,
		depthTest: false,
		depthWrite: false
	});
	fsScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), fsMat));

	const useBloom = profile.bloom && halfFloatOK;
	const rtType = halfFloatOK ? THREE.HalfFloatType : THREE.UnsignedByteType;
	const rt = new THREE.WebGLRenderTarget(2, 2, {
		type: rtType,
		depthBuffer: false,
		stencilBuffer: false
	});
	const composer = new EffectComposer(renderer, rt);
	composer.addPass(new RenderPass(fsScene, fsCam));

	const bloomPass = new UnrealBloomPass(new THREE.Vector2(2, 2), 0.58, 0.36, 0.5);
	bloomPass.enabled = useBloom;
	composer.addPass(bloomPass);

	const compositePass = new ShaderPass(
		new THREE.ShaderMaterial({
			vertexShader: COMPOSITE_VERT,
			fragmentShader: COMPOSITE_FRAG,
			uniforms: {
				tDiffuse: { value: null },
				uRes: { value: new THREE.Vector2(1, 1) },
				uTime: { value: 0 },
				uVignette: { value: 0.8 },
				uGrain: { value: profile.bloom ? 0.038 : 0.028 },
				uCA: { value: 0.0022 }
			}
		})
	);
	composer.addPass(compositePass);

	const _dbSize = new THREE.Vector2();
	let scrollSmooth = 0;
	let cineTime = 0;
	let simTime = 0;
	let lastNow = performance.now();
	let frameDebt = 0;
	let raf = 0;
	let disposed = false;
	let contextLost = false;
	let fpsFrames = 0;
	let fpsWindow = 0;
	let resizeQueued = false;

	const onContextLost = (e: Event) => {
		e.preventDefault();
		contextLost = true;
		if (raf) cancelAnimationFrame(raf);
		raf = 0;
	};
	const onContextRestored = () => {
		contextLost = false;
		resize();
		if (!raf && !disposed) raf = requestAnimationFrame(frame);
	};
	canvas.addEventListener('webglcontextlost', onContextLost, false);
	canvas.addEventListener('webglcontextrestored', onContextRestored, false);

	function resize() {
		if (disposed || contextLost) return;
		const parent = canvas.parentElement;
		const w = Math.max(1, parent?.clientWidth || window.innerWidth);
		const h = Math.max(1, parent?.clientHeight || window.innerHeight);
		const devDpr = window.devicePixelRatio || 1;
		const byPixels = Math.sqrt(profile.budget / Math.max(1, w * h));
		const dpr = Math.max(0.75, Math.min(devDpr, profile.dpr, byPixels));
		renderer.setPixelRatio(dpr);
		renderer.setSize(w, h, false);
		composer.setPixelRatio(dpr);
		composer.setSize(w, h);
		renderer.getDrawingBufferSize(_dbSize);
		uniforms.uRes.value.copy(_dbSize);
		compositePass.uniforms.uRes.value.copy(_dbSize);
	}

	function queueResize() {
		if (resizeQueued) return;
		resizeQueued = true;
		requestAnimationFrame(() => {
			resizeQueued = false;
			resize();
		});
	}

	function readScrollProgress() {
		const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
		return Math.min(1, Math.max(0, window.scrollY / max));
	}

	function updateCamera(dt: number) {
		// Sample scroll inside rAF — no scroll-handler jank
		const scrollTarget = readScrollProgress();
		const follow = reducedMotion ? 1 : 1 - Math.exp(-dt * 2.4);
		scrollSmooth += (scrollTarget - scrollSmooth) * follow;
		const k = easeInOutCubic(scrollSmooth);

		if (!reducedMotion) {
			cineTime += dt;
		}

		cinePath(cineTime, cinePos);

		// Scroll gently pulls toward the flare belt without killing the morph path
		const r0 = cinePos.length();
		const r1 = THREE.MathUtils.lerp(r0, R_FLOOR, k * 0.72);
		cinePos.multiplyScalar(r1 / Math.max(r0, 1e-4));

		camPos.copy(cinePos);
		uniforms.uCamPos.value.copy(camPos);
		uniforms.uCamTarget.value.copy(camTarget);

		const fovDeg = THREE.MathUtils.lerp(45, 42, k);
		uniforms.uFov.value = 1 / Math.tan(THREE.MathUtils.degToRad(fovDeg) / 2);
	}

	function adaptQuality(realDt: number) {
		fpsFrames++;
		fpsWindow += realDt;
		if (fpsWindow < 1.0) return;
		const fps = fpsFrames / fpsWindow;
		fpsFrames = 0;
		fpsWindow = 0;

		if (fps < 26 && liveSteps > profile.minSteps) {
			liveSteps = Math.max(profile.minSteps, liveSteps - 40);
			uniforms.uSteps.value = liveSteps | 0;
			if (fps < 22 && bloomPass.enabled) bloomPass.enabled = false;
		} else if (fps > 48 && liveSteps < profile.steps) {
			liveSteps = Math.min(profile.steps, liveSteps + 20);
			uniforms.uSteps.value = liveSteps | 0;
			if (useBloom && !bloomPass.enabled && fps > 52) bloomPass.enabled = true;
		}
	}

	function frame(now: number) {
		if (disposed || contextLost) return;
		raf = requestAnimationFrame(frame);

		if (typeof document !== 'undefined' && document.hidden) {
			lastNow = now;
			frameDebt = 0;
			return;
		}

		const realDt = Math.min(0.1, Math.max(0.0005, (now - lastNow) / 1000));
		lastNow = now;
		adaptQuality(realDt);

		// Cap render rate (30fps mobile / ~60 desktop) while keeping camera clock smooth
		frameDebt += realDt * 1000;
		const shouldRender = frameDebt >= profile.frameMs * 0.92;
		if (shouldRender) {
			frameDebt = Math.min(frameDebt - profile.frameMs, profile.frameMs);
		}

		const dt = Math.min(realDt, 0.05);
		simTime += reducedMotion ? dt * 0.3 : dt;
		updateCamera(dt);

		if (!shouldRender) return;

		uniforms.uTime.value = simTime;
		compositePass.uniforms.uTime.value = simTime;

		try {
			composer.render();
		} catch (err) {
			console.error('[black-hole] render fault', err);
			cancelAnimationFrame(raf);
			raf = 0;
		}
	}

	function dispose() {
		disposed = true;
		if (raf) cancelAnimationFrame(raf);
		raf = 0;
		window.removeEventListener('resize', queueResize);
		canvas.removeEventListener('webglcontextlost', onContextLost, false);
		canvas.removeEventListener('webglcontextrestored', onContextRestored, false);
		fsMat.dispose();
		rt.dispose();
		composer.dispose();
		renderer.dispose();
	}

	window.addEventListener('resize', queueResize, { passive: true });
	resize();
	updateCamera(1);
	raf = requestAnimationFrame(frame);

	return { resize: queueResize, dispose };
}
