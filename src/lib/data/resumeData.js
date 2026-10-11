/**
 * @typedef {Object} DeepDiveItem
 * @property {string} [tag]
 * @property {string} title
 * @property {string} [subtitle]
 * @property {string[]} [techStack]
 * @property {string} [overview]
 * @property {string[]} [details]
 * @property {string[]} [bullets]
 */

/**
 * @typedef {Object} ResumeData
 * @property {Object} personal
 * @property {string} personal.firstName
 * @property {string} personal.lastName
 * @property {string} personal.name
 * @property {string} personal.title
 * @property {string} personal.summary
 * @property {string} personal.photoUrl
 * @property {string} personal.address
 * @property {string} personal.phone
 * @property {string} personal.email
 * @property {string} personal.website
 * @property {string} personal.pdfUrl
 * @property {Object} socials
 * @property {{ highlights: string[] }} skills
 * @property {Array<{ institution: string, degree: string, date: string }>} education
 * @property {Object} career
 * @property {Array<{ id: string, title: string, company: string, dates: string, bullets: string[] }>} experience
 * @property {Array<{ id: string, title: string, subtitle: string, dates?: string, bullets: string[] }>} projects
 * @property {Record<string, DeepDiveItem>} deepDives
 */

/** @type {ResumeData} */
export const resumeData = {
  personal: {
    firstName: "Teja",
    lastName: "Narayana",
    name: "Teja Narayana",
    title: "Product Engineer",
    summary: "Product Engineer with experience building modern full-stack web applications, distributed AI agents, and scalable ERP data pipelines. Specialized in Svelte, SvelteKit, FastAPI, and LLM-based automation workflows.",
    photoUrl: "/teja.jpeg",
    address: "Vijayawada, AP, India - 520007",
    phone: "+91 6300655083",
    email: "work@tejanarayana.com",
    website: "https://www.tejanarayana.com",
    pdfUrl: "/Teja-Narayana-Resume.pdf"
  },
  socials: {
    linkedin: "https://linkedin.com/in/teja-na",
    github: "https://github.com/tejanarayana05",
    x: "https://x.com/littleheadache",
    instagram: "https://instagram.com/jaajikaya"
  },
  skills: {
    highlights: [
      "Svelte / SvelteKit",
      "Python / FastAPI / Flask",
      "LLMs & AI Agents (RAG, Vision)",
      "MySQL, PostgreSQL & BigQuery",
      "Cloud Infrastructure (GCP / Docker)",
      "Analytics & Visualizations (Looker Studio / PowerBI / Tableau)"
    ]
  },
  education: [
    {
      institution: "PVP Siddhartha Institute of Technology",
      degree: "B.Tech in Computer Science (Affiliated to JNTUK)",
      date: "Aug 2020 - May 2024"
    }
  ],
  career: {
    objective: "Software and systems engineer with experience building modern web applications, distributed backend services, and interactive user interfaces. Specializing in SvelteKit, high-performance web applications, and scalable data architectures. Seeking to leverage technical expertise in a product engineering role to drive scalable engineering solutions."
  },
  experience: [
    {
      id: "role-2",
      title: "Product Engineer",
      company: "GXCO Tech PVT Ltd.",
      dates: "May 2026 - Present",
      bullets: [
        "Redesigned and integrated recruitment/onboarding workflows into unified ERP, replacing 3 third-party services and reducing overhead by 40%.",
        "Developed AI-powered features and agents using vision and autoregressive models to automate internal document workflows.",
        "Designed real-time operational analytics dashboards using BigQuery and Looker Studio to drive decision support."
      ]
    },
    {
      id: "role-1",
      title: "Product Analyst Intern",
      company: "GXCO Tech PVT Ltd.",
      dates: "Sept 2025 - Apr 2026",
      bullets: [
        "Analyzed business workflows across ERP, HRMS, and helpdesk products to translate requirements into technical features.",
        "Built onboarding chatbots and workflow automations using Python, n8n, and LLM-based agent systems.",
        "Developed internal AI prototypes and RAG pipelines for rapid business information retrieval and employee support."
      ]
    }
  ],
  projects: [
    {
      id: "project-wag",
      title: "WAG (Week at a Glance)",
      subtitle: "Full-Stack Operational Planning Application",
      bullets: [
        "Translated structured Excel workflow into a normalized PostgreSQL relational architecture and API layer using Svelte, FastAPI, and SQLAlchemy.",
        "Designed APIs supporting operational planning, tracking, and reporting with GCP production-oriented decoupled deployment."
      ]
    },
    {
      id: "project-vseva",
      title: "Vseva (Vehicle Passport)",
      subtitle: "Privacy-Aware Digital Vehicle Records Platform",
      bullets: [
        "Built a consolidated vehicle record profile merging registration, compliance history, and ownership records.",
        "Engineered owner-controlled Trust Pass workflows exposing verifiable vehicle data while safeguarding private owner details."
      ]
    },
    {
      id: "project-buy-or-wait",
      title: "Buy or Wait?",
      subtitle: "Financial Planning Agent & Cash Flow Forecast Engine",
      bullets: [
        "Reconstructed user financial state from structured events, messages, and image evidence to forecast 90-day cash flow horizons.",
        "Separated probabilistic LLM evidence processing from deterministic financial balance validation algorithms."
      ]
    }
  ],
  deepDives: {
    'role-2': {
      tag: 'Experience Deep Dive • GXCO Tech Pvt. Ltd.',
      title: 'Product Engineer (May 2026 - Present)',
      overview: 'Architecting core ERP modules, custom AI agents, and cross-departmental data analytics engines.',
      details: [
        'Consolidated 3 separate legacy tools into a central recruitment module, saving 40% candidate processing overhead.',
        'Engineered custom multi-modal AI pipelines leveraging autoregressive vision models for document parsing.',
        'Constructed BigQuery data pipelines integrated with Looker Studio for enterprise decision support.'
      ]
    },
    'role-1': {
      tag: 'Experience Deep Dive • GXCO Tech Pvt. Ltd.',
      title: 'Product Analyst Intern (Sept 2025 - Apr 2026)',
      overview: 'Focused on workflow automation, product requirement synthesis, and prototyping LLM tools.',
      details: [
        'Created custom n8n workflows integrated with LLM agents to reduce manual customer service touchpoints.',
        'Synthesized complex operational specifications across HRMS and helpdesk systems into execution roadmaps.',
        'Built interactive internal tools using Python and modern APIs for employee self-service.'
      ]
    },
    'skills': {
      tag: 'Comprehensive Skillset',
      title: 'Technical & Engineering Expertise',
      overview: 'Full-stack development, distributed backend architectures, and production AI system design.',
      details: [
        'Languages: Python, JavaScript, SQL',
        'Frameworks: Svelte, SvelteKit, React, FastAPI, Flask, n8n, LangChain, Google ADK',
        'Databases & Cloud: PostgreSQL, MySQL, MongoDB, BigQuery, Google Cloud Platform, Docker',
        'AI/ML: LLMs, RAG, AI Agents, Computer Vision, LoRA Fine-tuning, Hugging Face'
      ]
    },
    'education': {
      tag: 'Academic Foundation',
      title: 'PVP Siddhartha Institute of Technology',
      overview: 'B.Tech in Computer Science and Engineering (Affiliated to JNTUK).',
      details: [
        'Core coursework: Data Structures, Operating Systems, Database Management Systems, Software Engineering',
        'Graduated May 2024 (Vijayawada, AP, India)'
      ]
    },
    'project-wag': {
      tag: 'Project Deep Dive • Full-Stack Application',
      title: 'WAG — Week at a Glance',
      subtitle: 'Operational Planning System',
      techStack: ['Svelte', 'FastAPI', 'PostgreSQL', 'SQLAlchemy', 'GCP'],
      overview: 'Designed and developed a full-stack operational planning application transformed from a legacy structured Excel workflow into a scalable relational system.',
      details: [
        'Translated complex spreadsheet business requirements into a normalized PostgreSQL data model and relational schema.',
        'Developed backend APIs using FastAPI and SQLAlchemy to execute core planning, tracking, and operational reporting features.',
        'Architected for GCP cloud deployment with a modular design isolating the Svelte frontend, REST API, and PostgreSQL database.'
      ]
    },
    'project-vseva': {
      tag: 'Project Deep Dive • Privacy & AI Platform',
      title: 'Vseva — Vehicle Passport',
      subtitle: 'Digital Vehicle Identity Platform',
      techStack: ['SvelteKit', 'Python', 'MongoDB', 'AI Agents'],
      overview: 'Built a privacy-centric digital vehicle passport consolidating fragmented vehicle records into a persistent digital identity profile.',
      details: [
        'Unified vehicle registration, compliance records, incident logs, and ownership transfers into a single source of truth.',
        'Designed public verification lookups paired with owner-controlled Trust Pass workflows to share verifiable data securely.',
        'Engineered an AI-assisted prototype using synthetic data, transparent data provenance, and explainable record checks.'
      ]
    },
    'project-buy-or-wait': {
      tag: 'Project Deep Dive • AI Decision Systems',
      title: 'Buy or Wait?',
      subtitle: 'Financial Planning & Cash Flow Agent',
      techStack: ['Python', 'LLMs', 'Decision Engine', 'Data Modeling'],
      overview: 'Engineered a financial planning engine capable of evaluating user financial health from unstructured inputs and forecasting short-term cash flow.',
      details: [
        'Reconstructed complete user financial state from multi-modal inputs including raw text, transactional messages, and document evidence.',
        'Evaluated multi-tier payment scenarios (full, installment, partial, spending cuts) while strictly enforcing minimum cash constraints.',
        'Decoupled probabilistic LLM document interpretation from deterministic balance math to guarantee reproducible financial forecasts.'
      ]
    }
  }
};