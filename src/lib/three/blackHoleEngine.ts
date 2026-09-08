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
 * Camera path mirrors GARGANTUA presets, exaggerated for scroll drama:
 * far cinematic open → close-in photon-ring view.
 * Radii are /1.75 vs the prior path so the hole reads ~75% larger on screen.
 */
export const VIEW = {
	far: { r: 24, inc: 18, az: -20 },
	close: { r: 4.11, inc: 12, az: 55 }
} as const;

/** Match reference cinematic profile — low step counts break the horizon silhouette. */
const QUALITY = {
	mobile: { steps: 280, dpr: 1.15, budget: 1.8e6 },
	desktop: { steps: 420, dpr: 1.75, budget: 3.2e6 }
} as const;

type Quality = (typeof QUALITY)[keyof typeof QUALITY];

function presetVec(p: { r: number; inc: number; az: number }, out = new THREE.Vector3()) {
	const inc = p.inc * D2R;
	const az = p.az * D2R;
	return out.set(
		p.r * Math.cos(inc) * Math.sin(az),
		p.r * Math.sin(inc),
		p.r * Math.cos(inc) * Math.cos(az)
	);
}

function easeInOutCubic(k: number) {
	const t = Math.min(1, Math.max(0, k));
	return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function pickQuality(): Quality {
	if (typeof window === 'undefined') return QUALITY.mobile;
	const mobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
	const cores = navigator.hardwareConcurrency || 4;
	if (mobile || cores <= 4) return QUALITY.mobile;
	return QUALITY.desktop;
}

export type BlackHoleEngine = {
	setScrollProgress: (t: number) => void;
	resize: () => void;
	dispose: () => void;
};

export function createBlackHoleEngine(canvas: HTMLCanvasElement): BlackHoleEngine {
	const reducedMotion =
		typeof window !== 'undefined' &&
		window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	const quality = pickQuality();

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
		return { setScrollProgress() {}, resize() {}, dispose() {} };
	}

	// Linear pipe — composite pass applies ACES (same as GARGANTUA)
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

	const farPos = presetVec(VIEW.far);
	const closePos = presetVec(VIEW.close);
	const camPos = farPos.clone();
	const camTarget = new THREE.Vector3(0, 0, 0);
	const desiredPos = farPos.clone();
	const _tmp = new THREE.Vector3();

	const uniforms = {
		uRes: { value: new THREE.Vector2(1, 1) },
		uTime: { value: 0 },
		uCamPos: { value: camPos.clone() },
		uCamTarget: { value: camTarget.clone() },
		uFov: { value: 1 / Math.tan(THREE.MathUtils.degToRad(46) / 2) },
		uSteps: { value: quality.steps | 0 },
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
		uRotSpeed: { value: reducedMotion ? 0.2 : 1.05 }
	};

	const fsMat = new THREE.ShaderMaterial({
		vertexShader: RAY_VERT,
		fragmentShader: RAY_FRAG,
		uniforms,
		depthTest: false,
		depthWrite: false
	});
	fsScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), fsMat));

	const rtType = halfFloatOK ? THREE.HalfFloatType : THREE.UnsignedByteType;
	const rt = new THREE.WebGLRenderTarget(2, 2, {
		type: rtType,
		depthBuffer: false,
		stencilBuffer: false
	});
	const composer = new EffectComposer(renderer, rt);
	composer.addPass(new RenderPass(fsScene, fsCam));

	const bloomPass = new UnrealBloomPass(new THREE.Vector2(2, 2), 0.62, 0.38, 0.48);
	bloomPass.enabled = halfFloatOK;
	composer.addPass(bloomPass);

	const compositePass = new ShaderPass(
		new THREE.ShaderMaterial({
			vertexShader: COMPOSITE_VERT,
			fragmentShader: COMPOSITE_FRAG,
			uniforms: {
				tDiffuse: { value: null },
				uRes: { value: new THREE.Vector2(1, 1) },
				uTime: { value: 0 },
				uVignette: { value: 0.85 },
				uGrain: { value: 0.04 },
				uCA: { value: 0.0024 }
			}
		})
	);
	composer.addPass(compositePass);

	const _dbSize = new THREE.Vector2();
	let scrollTarget = 0;
	let scrollSmooth = 0;
	let azDrift = 0;
	let simTime = 0;
	let lastNow = performance.now();
	let raf = 0;
	let disposed = false;
	let contextLost = false;

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
		const byPixels = Math.sqrt(quality.budget / Math.max(1, w * h));
		const dpr = Math.max(0.85, Math.min(devDpr, quality.dpr, byPixels));
		renderer.setPixelRatio(dpr);
		renderer.setSize(w, h, false);
		composer.setPixelRatio(dpr);
		composer.setSize(w, h);
		renderer.getDrawingBufferSize(_dbSize);
		uniforms.uRes.value.copy(_dbSize);
		compositePass.uniforms.uRes.value.copy(_dbSize);
	}

	function updateCamera(dt: number) {
		// Smooth scroll progress (cinematic ease)
		const follow = reducedMotion ? 1 : 1 - Math.exp(-dt * 4.2);
		scrollSmooth += (scrollTarget - scrollSmooth) * follow;
		const k = easeInOutCubic(scrollSmooth);

		_tmp.lerpVectors(farPos, closePos, k);

		// Gentle orbit only while still far — stops fighting the close-up
		if (!reducedMotion) {
			azDrift += dt * 0.045 * (1 - k);
			const c = Math.cos(azDrift);
			const s = Math.sin(azDrift);
			desiredPos.set(_tmp.x * c + _tmp.z * s, _tmp.y, -_tmp.x * s + _tmp.z * c);
		} else {
			desiredPos.copy(_tmp);
		}

		const camFollow = reducedMotion ? 1 : 1 - Math.exp(-dt * 3.5);
		camPos.lerp(desiredPos, camFollow);

		uniforms.uCamPos.value.copy(camPos);
		uniforms.uCamTarget.value.copy(camTarget);

		// Slight FOV tighten on approach (more immersive zoom)
		const fovDeg = THREE.MathUtils.lerp(48, 38, k);
		uniforms.uFov.value = 1 / Math.tan(THREE.MathUtils.degToRad(fovDeg) / 2);
	}

	function frame() {
		if (disposed || contextLost) return;
		raf = requestAnimationFrame(frame);
		if (typeof document !== 'undefined' && document.hidden) {
			lastNow = performance.now();
			return;
		}

		const now = performance.now();
		const dt = Math.min(0.05, Math.max(0.0005, (now - lastNow) / 1000));
		lastNow = now;
		simTime += reducedMotion ? dt * 0.25 : dt;

		updateCamera(dt);
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

	function setScrollProgress(t: number) {
		scrollTarget = Math.min(1, Math.max(0, t));
	}

	function dispose() {
		disposed = true;
		if (raf) cancelAnimationFrame(raf);
		raf = 0;
		canvas.removeEventListener('webglcontextlost', onContextLost, false);
		canvas.removeEventListener('webglcontextrestored', onContextRestored, false);
		fsMat.dispose();
		rt.dispose();
		composer.dispose();
		renderer.dispose();
	}

	resize();
	updateCamera(1);
	raf = requestAnimationFrame(frame);

	return { setScrollProgress, resize, dispose };
}
