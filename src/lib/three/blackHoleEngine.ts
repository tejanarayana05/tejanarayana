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

/** Far / near camera anchors (from GARGANTUA presets: poster → close) */
export const VIEW = {
	home: { r: 24, inc: 38, az: 30 },
	close: { r: 9, inc: 14, az: 55 }
} as const;

const QUALITY = {
	standard: { steps: 120, dpr: 1.0, budget: 0.9e6 },
	high: { steps: 200, dpr: 1.25, budget: 1.6e6 }
} as const;

export type QualityKey = keyof typeof QUALITY;

function presetVec(p: { r: number; inc: number; az: number }, out = new THREE.Vector3()) {
	const inc = p.inc * D2R;
	const az = p.az * D2R;
	return out.set(
		p.r * Math.cos(inc) * Math.sin(az),
		p.r * Math.sin(inc),
		p.r * Math.cos(inc) * Math.cos(az)
	);
}

function easeCubic(k: number) {
	return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
}

function pickQuality(): QualityKey {
	if (typeof window === 'undefined') return 'standard';
	const cores = navigator.hardwareConcurrency || 4;
	const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory || 4;
	const mobile = /Mobi|Android/i.test(navigator.userAgent);
	if (mobile || cores <= 4 || mem <= 4) return 'standard';
	return 'high';
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

	const qualityKey = pickQuality();
	const quality = QUALITY[qualityKey];

	let renderer: THREE.WebGLRenderer;
	try {
		renderer = new THREE.WebGLRenderer({
			canvas,
			antialias: false,
			powerPreference: 'high-performance',
			alpha: false
		});
	} catch (e) {
		console.error('[black-hole] WebGL init failed', e);
		return {
			setScrollProgress() {},
			resize() {},
			dispose() {}
		};
	}

	renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
	renderer.toneMapping = THREE.NoToneMapping;

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

	const homePos = presetVec(VIEW.home);
	const closePos = presetVec(VIEW.close);
	const camPos = homePos.clone();
	const camTarget = new THREE.Vector3(0, 0, 0);
	const _lerp = new THREE.Vector3();

	const uniforms = {
		uRes: { value: new THREE.Vector2(1, 1) },
		uTime: { value: 0 },
		uCamPos: { value: camPos.clone() },
		uCamTarget: { value: camTarget.clone() },
		uFov: { value: 1 / Math.tan(THREE.MathUtils.degToRad(44) / 2) },
		uSteps: { value: quality.steps },
		uRotSign: { value: 1 },
		uDebug: { value: 0 },
		uDin: { value: 2.75 },
		uDout: { value: 40 },
		uDopMax: { value: 1.85 },
		uOpNear: { value: 0.9 },
		uOpFar: { value: 0.8 },
		uDiskBright: { value: 1 },
		uStarBright: { value: 1 },
		uSkyFloor: { value: 0.04 },
		uRotSpeed: { value: reducedMotion ? 0.15 : 1 }
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
	const rt = new THREE.WebGLRenderTarget(2, 2, { type: rtType, depthBuffer: false });
	const composer = new EffectComposer(renderer, rt);
	composer.addPass(new RenderPass(fsScene, fsCam));

	const bloomPass = new UnrealBloomPass(new THREE.Vector2(2, 2), 0.55, 0.35, 0.55);
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
				uVignette: { value: 1 },
				uGrain: { value: 0.045 },
				uCA: { value: 0.0028 }
			}
		})
	);
	composer.addPass(compositePass);

	const _dbSize = new THREE.Vector2();
	let scrollT = 0;
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
		const w = parent?.clientWidth || window.innerWidth;
		const h = parent?.clientHeight || window.innerHeight;
		const devDpr = window.devicePixelRatio || 1;
		const byPixels = Math.sqrt(quality.budget / Math.max(1, w * h));
		const dpr = Math.max(0.65, Math.min(devDpr, quality.dpr, byPixels));
		renderer.setPixelRatio(dpr);
		renderer.setSize(w, h, false);
		composer.setPixelRatio(dpr);
		composer.setSize(w, h);
		renderer.getDrawingBufferSize(_dbSize);
		uniforms.uRes.value.copy(_dbSize);
		compositePass.uniforms.uRes.value.copy(_dbSize);
	}

	function updateCamera() {
		const k = easeCubic(Math.min(1, Math.max(0, scrollT)));
		_lerp.lerpVectors(homePos, closePos, k);

		// Slow azimuth drift for life, damped near close-up
		if (!reducedMotion) {
			azDrift += 0.00035 * (1 - k * 0.7);
			const c = Math.cos(azDrift);
			const s = Math.sin(azDrift);
			camPos.set(_lerp.x * c + _lerp.z * s, _lerp.y, -_lerp.x * s + _lerp.z * c);
		} else {
			camPos.copy(_lerp);
		}
		uniforms.uCamPos.value.copy(camPos);
		uniforms.uCamTarget.value.copy(camTarget);
	}

	function frame() {
		if (disposed || contextLost) return;
		raf = requestAnimationFrame(frame);
		if (typeof document !== 'undefined' && document.hidden) return;

		const now = performance.now();
		const dt = Math.min(0.1, Math.max(0.0005, (now - lastNow) / 1000));
		lastNow = now;
		simTime += reducedMotion ? dt * 0.2 : dt;

		updateCamera();
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
		scrollT = Math.min(1, Math.max(0, t));
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
	updateCamera();
	raf = requestAnimationFrame(frame);

	return { setScrollProgress, resize, dispose };
}
