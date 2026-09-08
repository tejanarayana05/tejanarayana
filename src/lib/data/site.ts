export const site = {
	name: 'Teja Narayana',
	role: 'Product Engineer',
	email: 't@aejt.in',
	tagline: 'Where product thinking, engineering craft, and AI meet.',
	headline: 'I sit at the intersection of product, AI, and engineering.',
	description:
		'Product engineer bridging technical architecture, AI applications, and workflows. Documenting the trade-offs and choices that drive business value.',
	url: 'https://www.aejt.in',
	social: {
		github: 'https://github.com/tejanarayana05/',
		linkedin: 'https://www.linkedin.com/in/teja-na'
	}
} as const;

export const navLinks = [
	{ href: '/', label: 'Home' },
	{ href: '#focus', label: 'Focus' },
	{ href: '#signals', label: 'Signals' },
	{ href: '#contact', label: 'Contact' }
] as const;

export const pillars = [
	{
		id: 'product',
		title: 'Product',
		line: 'Understand people and business constraints before designing solutions.'
	},
	{
		id: 'ai',
		title: 'AI',
		line: 'Use models where they genuinely improve a workflow — not as decoration.'
	},
	{
		id: 'engineering',
		title: 'Engineering',
		line: 'Ship systems that solve real problems instead of technical trophies.'
	}
] as const;

export const signals = [
	{
		id: 'gxco',
		label: 'Now',
		title: 'Product Engineer at GXCO',
		detail:
			'Translating client needs into practical, scalable product and engineering solutions.',
		meta: 'May 2026'
	},
	{
		id: 'ieee',
		label: 'Research',
		title: 'IEEE deep learning publication',
		detail:
			'Hybrid VGG19 + LSTM for brain tumor classification — strengthening the AI foundation behind the product work.',
		meta: 'Mar 2024',
		href: 'https://ieeexplore.ieee.org/abstract/document/10467798'
	},
	{
		id: 'writing',
		label: 'Writing',
		title: 'Practical Python craft notes',
		detail:
			'Short, sharp articles on pathlib and Rich — tools that make everyday engineering cleaner.',
		meta: '2026',
		href: 'https://www.aejt.in/writing'
	}
] as const;

export const journeyHighlights = [
	'Product Analyst internship → product requirements and solution design',
	'ACM Winter School on AI & ML at IIT Patna',
	'Engineering graduation with a pull toward product + AI systems'
] as const;
