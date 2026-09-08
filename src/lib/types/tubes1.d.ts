declare module '$lib/vendor/tubes1.min.js' {
	type TubesApp = {
		tubes: {
			setColors: (colors: string[]) => void;
			setLightsColors: (colors: string[]) => void;
		};
		dispose?: () => void;
	};

	type TubesOptions = {
		tubes?: {
			colors?: string[];
			lights?: {
				intensity?: number;
				colors?: string[];
			};
		};
	};

	export default function TubesCursor(
		canvas: HTMLCanvasElement,
		options?: TubesOptions
	): TubesApp;
}
