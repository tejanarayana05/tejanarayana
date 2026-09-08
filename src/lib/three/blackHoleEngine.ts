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
const INC_MIN = 8 * D2R;
const INC_MAX = 28 * D2R;

/**
 * Permanent morph fly-around. Inclinations stay in a band that always
 * shows the circular event horizon + photon-ring flares (no polar dive).
 * Radii pre-scaled ~75% larger than stock GARGANTUA.
 */
const CINE_KEYS: ReadonlyArray<readonly [number, number, number]> = [
	[33, 16, -30],
	[26, 10, 20],
	[20, 22, 70],
	[15, 14, 120],
	[17, 20, 170],
	[22, 12, 220],
	[28, 18, 280],
	[30, 11, 330]
];

const R_FLOOR = 13;
const CINE_SEGMENT = 12;

const K_R = CINE_KEYS.map((k) => k[0]);
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
	const inc = THREE.MathUtils.clamp(
		cr(v(K_I, i - 1), v(K_I, i), v(K_I, i + 1), v(K_I, i + 2), t),
		INC_MIN,
		INC_MAX
	);
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
	/** Hard floor — below this the horizon silhouette collapses. */
	minSteps: number;
	dpr: number;
	budget: number;
	bloom: boolean;
	frameMs: number;
};

function buildProfile(): Profile {
	if (typeof window === 'undefined') {
		return { steps: 240, minSteps: 200, dpr: 1, budget: 1.2e6, bloom: false, frameMs: 33 };
	}
	const mobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
	const cores = navigator.hardwareConcurrency || 4;
	const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
		?.saveData;
	if (mobile || saveData || cores <= 4) {
		return { steps: 240, minSteps: 200, dpr: 1.15, budget: 1.4e6, bloom: false, frameMs: 33 };
	}
	return { steps: 380, minSteps: 260, dpr: 1.5, budget: 2.8e6, bloom: true, frameMs: 16.7 };
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
	let liveFrameMs = profile.frameMs;

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
		uDiskBright: { value: 1.15 },
		uStarBright: { value: 1.05 },
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
	let scrollSettling = false;

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
		const dpr = Math.max(0.8, Math.min(devDpr, profile.dpr, byPixels));
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
		const el = document.scrollingElement || document.documentElement;
		const max = Math.max(1, el.scrollHeight - window.innerHeight);
		const y = el.scrollTop || window.scrollY || 0;
		return Math.min(1, Math.max(0, y / max));
	}

	function updateCamera(dt: number) {
		const scrollTarget = readScrollProgress();
		const goingUp = scrollTarget < scrollSmooth - 0.001;
		// Snap back faster when scrolling up so the far morph state returns
		const followRate = reducedMotion
			? 1
			: goingUp
				? 1 - Math.exp(-dt * 7)
				: 1 - Math.exp(-dt * 3.4);
		scrollSmooth += (scrollTarget - scrollSmooth) * followRate;
		if (scrollTarget <= 0.008) scrollSmooth = 0;
		scrollSettling = Math.abs(scrollSmooth - scrollTarget) > 0.0015;

		const k = easeInOutCubic(scrollSmooth);

		if (!reducedMotion) {
			cineTime += dt;
		}

		cinePath(cineTime, cinePos);

		// Scroll pulls toward flare belt; k→0 fully restores the open morph radius
		const r0 = Math.max(cinePos.length(), R_FLOOR);
		const r1 = THREE.MathUtils.lerp(r0, R_FLOOR, k * 0.55);
		cinePos.multiplyScalar(r1 / r0);

		camPos.copy(cinePos);
		uniforms.uCamPos.value.copy(camPos);
		uniforms.uCamTarget.value.copy(camTarget);

		const fovDeg = THREE.MathUtils.lerp(45, 42, k);
		uniforms.uFov.value = 1 / Math.tan(THREE.MathUtils.degToRad(fovDeg) / 2);
	}

	function adaptQuality(realDt: number) {
		fpsFrames++;
		fpsWindow += realDt;
		if (fpsWindow < 1.25) return;
		const fps = fpsFrames / fpsWindow;
		fpsFrames = 0;
		fpsWindow = 0;

		// Prefer dropping frame rate over geodesic steps — steps preserve the ring
		if (fps < 26) {
			liveFrameMs = Math.min(40, liveFrameMs + 4);
			if (fps < 20 && liveSteps > profile.minSteps) {
				liveSteps = Math.max(profile.minSteps, liveSteps - 20);
				uniforms.uSteps.value = liveSteps | 0;
			}
		} else if (fps > 50) {
			liveFrameMs = Math.max(profile.frameMs, liveFrameMs - 2);
			if (liveSteps < profile.steps) {
				liveSteps = Math.min(profile.steps, liveSteps + 15);
				uniforms.uSteps.value = liveSteps | 0;
			}
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

		const dt = Math.min(realDt, 0.05);
		simTime += reducedMotion ? dt * 0.3 : dt;
		updateCamera(dt);

		frameDebt += realDt * 1000;
		const shouldRender = scrollSettling || frameDebt >= liveFrameMs * 0.9;
		if (shouldRender) {
			frameDebt = Math.min(Math.max(0, frameDebt - liveFrameMs), liveFrameMs);
		} else {
			return;
		}

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
