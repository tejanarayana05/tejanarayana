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
 * Fixed viewpoint — only radius changes with scroll.
 * Chosen so the event horizon + red flare belt stay framed.
 */
const VIEW = {
	/** Top of page */
	farR: 26,
	/** Bottom of page — still outside the blank horizon */
	nearR: 13,
	inc: 16,
	az: 35
} as const;

function easeInOutCubic(k: number) {
	const t = Math.min(1, Math.max(0, k));
	return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function camAtRadius(r: number, out: THREE.Vector3) {
	const inc = VIEW.inc * D2R;
	const az = VIEW.az * D2R;
	return out.set(
		r * Math.cos(inc) * Math.sin(az),
		r * Math.sin(inc),
		r * Math.cos(inc) * Math.cos(az)
	);
}

type Profile = {
	steps: number;
	dpr: number;
	budget: number;
	bloom: boolean;
	frameMs: number;
};

function buildProfile(): Profile {
	if (typeof window === 'undefined') {
		return { steps: 240, dpr: 1, budget: 1.2e6, bloom: false, frameMs: 33 };
	}
	const mobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
	const cores = navigator.hardwareConcurrency || 4;
	const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
		?.saveData;
	if (mobile || saveData || cores <= 4) {
		return { steps: 240, dpr: 1.15, budget: 1.4e6, bloom: false, frameMs: 33 };
	}
	return { steps: 380, dpr: 1.5, budget: 2.8e6, bloom: true, frameMs: 16.7 };
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
	const desiredPos = new THREE.Vector3();
	camAtRadius(VIEW.farR, camPos);

	const uniforms = {
		uRes: { value: new THREE.Vector2(1, 1) },
		uTime: { value: 0 },
		uCamPos: { value: camPos.clone() },
		uCamTarget: { value: camTarget.clone() },
		uFov: { value: 1 / Math.tan(THREE.MathUtils.degToRad(44) / 2) },
		uSteps: { value: profile.steps | 0 },
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
		/** Frozen disk — no idle morph / turbulence drift */
		uRotSpeed: { value: 0 }
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

	const bloomPass = new UnrealBloomPass(new THREE.Vector2(2, 2), 0.55, 0.35, 0.52);
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
				/** Static grain (uTime held at 0) */
				uGrain: { value: 0.02 },
				uCA: { value: 0.002 }
			}
		})
	);
	composer.addPass(compositePass);

	const _dbSize = new THREE.Vector2();
	let scrollSmooth = 0;
	let lastNow = performance.now();
	let frameDebt = 0;
	let raf = 0;
	let disposed = false;
	let contextLost = false;
	let resizeQueued = false;
	let needsRender = true;
	let liveFrameMs = profile.frameMs;

	const onContextLost = (e: Event) => {
		e.preventDefault();
		contextLost = true;
		if (raf) cancelAnimationFrame(raf);
		raf = 0;
	};
	const onContextRestored = () => {
		contextLost = false;
		resize();
		needsRender = true;
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
		needsRender = true;
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
		const followRate = reducedMotion
			? 1
			: goingUp
				? 1 - Math.exp(-dt * 7)
				: 1 - Math.exp(-dt * 3.2);
		const prev = scrollSmooth;
		scrollSmooth += (scrollTarget - scrollSmooth) * followRate;
		if (scrollTarget <= 0.008) scrollSmooth = 0;

		if (Math.abs(scrollSmooth - prev) > 1e-5) needsRender = true;

		const k = easeInOutCubic(scrollSmooth);
		const r = THREE.MathUtils.lerp(VIEW.farR, VIEW.nearR, k);
		camAtRadius(r, desiredPos);

		const beforeX = camPos.x;
		const beforeY = camPos.y;
		const beforeZ = camPos.z;
		const camFollow = reducedMotion ? 1 : 1 - Math.exp(-dt * 4);
		camPos.lerp(desiredPos, camFollow);
		if (
			(camPos.x - beforeX) ** 2 + (camPos.y - beforeY) ** 2 + (camPos.z - beforeZ) ** 2 >
			1e-8
		) {
			needsRender = true;
		}

		uniforms.uCamPos.value.copy(camPos);
		uniforms.uCamTarget.value.copy(camTarget);

		const fovDeg = THREE.MathUtils.lerp(44, 42, k);
		uniforms.uFov.value = 1 / Math.tan(THREE.MathUtils.degToRad(fovDeg) / 2);
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
		const dt = Math.min(realDt, 0.05);

		updateCamera(dt);

		// Idle: do not advance shader time — image stays exactly as last scroll pose
		uniforms.uTime.value = 0;
		compositePass.uniforms.uTime.value = 0;

		frameDebt += realDt * 1000;
		const due = frameDebt >= liveFrameMs * 0.9;
		if (!needsRender && !due) return;
		if (due) frameDebt = Math.min(Math.max(0, frameDebt - liveFrameMs), liveFrameMs);
		if (!needsRender && due) {
			// Steady idle re-draw at capped FPS only if bloom/GPU needs a refresh; skip otherwise
			return;
		}

		needsRender = false;
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
	needsRender = true;
	raf = requestAnimationFrame(frame);

	return { resize: queueResize, dispose };
}
