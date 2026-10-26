import type {
  CategoryId,
  DifficultyId,
  FormatId,
  LanguageId,
  LevelId,
  RubricId,
  StyleId,
} from "./types";

/**
 * The interview catalog. Everything the setup flow, prompt builder and evaluator need
 * to know about tracks, roles and formats lives here, so adding a new field or role
 * is a data change rather than a code change.
 */

export interface RoleOption {
  id: string;
  title: string;
  skills: string[];
}

export type InterviewAvailability = "yes" | "some-posts" | "rare";

export interface Track {
  id: string;
  category: CategoryId;
  title: string;
  /** Field label used for prompts and rubric selection. */
  field: string;
  description: string;
  roles: RoleOption[];
  formats: FormatId[];
  defaultFormat: FormatId;
  rubric: RubricId;
  /** Government only: whether this selection process normally includes an interview. */
  interviewAvailability?: InterviewAvailability;
  /** Government only: what the interview stage is, and what it is not. */
  selectionNote?: string;
  /** Extra setup prompt shown for government tracks (e.g. optional subject). */
  backgroundPrompt?: string;
  /** Topic areas the interviewer should draw on. */
  topicAreas: string[];
}

const GOV_FORMATS: FormatId[] = ["government-personality", "situational", "resume", "panel", "stress"];

export const TRACKS: Track[] = [
  // ───────────────────────── Government and public sector ─────────────────────────
  {
    id: "upsc-cse",
    category: "government",
    title: "UPSC Civil Services",
    field: "Public administration",
    description: "Personality Test after the Mains for IAS, IPS, IFS and allied services.",
    roles: [
      { id: "ias", title: "IAS / Civil Services candidate", skills: ["Public administration", "Ethics", "Current affairs"] },
    ],
    formats: GOV_FORMATS,
    defaultFormat: "government-personality",
    rubric: "government",
    interviewAvailability: "yes",
    selectionNote:
      "The Personality Test is the final stage after the Preliminary and Main examinations. This practice covers the interview only, not the written papers.",
    backgroundPrompt: "Home state, graduation subject, optional subject, hobbies listed in your DAF",
    topicAreas: ["Detailed Application Form (DAF) background", "Home state and district", "Optional subject", "Ethics and integrity", "Governance and public policy", "Current affairs (general)", "Situational judgement as an administrator"],
  },
  {
    id: "state-psc",
    category: "government",
    title: "State Public Service Commission",
    field: "Public administration",
    description: "State civil services and other PSC posts that include an interview.",
    roles: [
      { id: "state-civil", title: "State Civil Services candidate", skills: ["State administration", "Ethics", "Regional issues"] },
      { id: "psc-other", title: "Other PSC post", skills: ["Role knowledge", "Administration"] },
    ],
    formats: GOV_FORMATS,
    defaultFormat: "government-personality",
    rubric: "government",
    interviewAvailability: "some-posts",
    selectionNote:
      "Many state commissions hold an interview for civil services and some other posts, but several have removed interviews for certain recruitments. Check your official notification.",
    backgroundPrompt: "Your state, the post, graduation subject, optional subject",
    topicAreas: ["State history, geography and economy", "Regional development issues", "Background and education", "Ethics", "Administrative situations"],
  },
  {
    id: "defence-ssb",
    category: "government",
    title: "Defence officer selection (SSB)",
    field: "Defence services",
    description: "Personal interview at the Services Selection Board for NDA, CDS, AFCAT, TES and similar entries.",
    roles: [
      { id: "army", title: "Army officer candidate", skills: ["Officer-like qualities", "Leadership"] },
      { id: "navy", title: "Navy officer candidate", skills: ["Officer-like qualities", "Leadership"] },
      { id: "air-force", title: "Air Force officer candidate", skills: ["Officer-like qualities", "Leadership"] },
    ],
    formats: ["government-personality", "situational", "stress", "resume"],
    defaultFormat: "government-personality",
    rubric: "government",
    interviewAvailability: "yes",
    selectionNote:
      "SSB also includes screening, psychological tests and group tasks. This practice covers the personal interview only.",
    backgroundPrompt: "Entry type, education, family background, sports and activities",
    topicAreas: ["Self-awareness and background", "Family and friends", "Education and achievements", "Leadership examples", "Motivation for the forces", "General awareness"],
  },
  {
    id: "banking",
    category: "government",
    title: "Banking and financial regulators",
    field: "Banking and finance",
    description: "Officer-level recruitment such as IBPS PO, SBI PO, RBI Grade B, NABARD and IBPS SO.",
    roles: [
      { id: "po", title: "Probationary Officer", skills: ["Banking awareness", "Customer handling", "Financial basics"] },
      { id: "rbi-b", title: "RBI Grade B Officer", skills: ["Economy", "Monetary policy", "Finance"] },
      { id: "so", title: "Specialist Officer", skills: ["Domain knowledge", "Banking awareness"] },
    ],
    formats: ["government-personality", "situational", "technical", "resume"],
    defaultFormat: "government-personality",
    rubric: "government",
    interviewAvailability: "some-posts",
    selectionNote:
      "Officer and specialist recruitments usually include an interview. Clerk-level exams such as IBPS Clerk generally do not.",
    backgroundPrompt: "Post applied for, education, any work experience",
    topicAreas: ["Banking awareness", "Economy and financial inclusion", "Customer situations", "Background and motivation", "Ethics in finance"],
  },
  {
    id: "psu",
    category: "government",
    title: "Public sector undertakings",
    field: "Engineering and management",
    description: "PSU recruitment that includes an interview, often after GATE or a written test.",
    roles: [
      { id: "get", title: "Graduate Engineer Trainee", skills: ["Core engineering", "Problem solving"] },
      { id: "mt", title: "Management Trainee", skills: ["Management", "Communication"] },
    ],
    formats: ["technical", "government-personality", "resume", "situational"],
    defaultFormat: "technical",
    rubric: "government",
    interviewAvailability: "some-posts",
    selectionNote:
      "Many PSUs shortlist through GATE or a written test, then hold a group discussion and/or interview. The process differs by organisation.",
    backgroundPrompt: "Discipline, organisation, final-year project",
    topicAreas: ["Core subject fundamentals", "Final-year project", "Internships", "Organisation and sector", "HR questions"],
  },
  {
    id: "ssc",
    category: "government",
    title: "SSC and other central recruitment",
    field: "Central government",
    description: "Use only when your notification lists an interview or personality test.",
    roles: [{ id: "ssc-post", title: "Central government post", skills: ["Role knowledge", "General awareness"] }],
    formats: ["government-personality", "situational", "resume"],
    defaultFormat: "government-personality",
    rubric: "government",
    interviewAvailability: "rare",
    selectionNote:
      "Most SSC examinations, including CGL, CHSL and MTS, are selected through written and skill tests with no interview. Practise here only if your recruitment includes one.",
    topicAreas: ["Background", "Role knowledge", "General awareness", "Situational judgement"],
  },
  {
    id: "railways",
    category: "government",
    title: "Railways",
    field: "Railways",
    description: "Only for railway recruitments that include an interview.",
    roles: [{ id: "rail-post", title: "Railway post", skills: ["Role knowledge", "Safety", "Operations"] }],
    formats: ["government-personality", "technical", "situational"],
    defaultFormat: "government-personality",
    rubric: "government",
    interviewAvailability: "rare",
    selectionNote:
      "Major RRB recruitments such as NTPC, Group D, ALP and JE are selected through computer-based tests, skill or aptitude tests and medicals without an interview. Some other posts and railway PSUs do interview.",
    topicAreas: ["Role knowledge", "Safety and operations", "Background", "Situational judgement"],
  },
  {
    id: "teaching-research",
    category: "government",
    title: "Teaching and research",
    field: "Education and research",
    description: "Faculty, school teaching and research positions that interview candidates.",
    roles: [
      { id: "asst-prof", title: "Assistant Professor", skills: ["Subject expertise", "Teaching", "Research"] },
      { id: "teacher", title: "School teacher", skills: ["Pedagogy", "Classroom management"] },
      { id: "jrf", title: "Research fellow / project scientist", skills: ["Research methods", "Subject expertise"] },
    ],
    formats: ["technical", "government-personality", "resume", "panel"],
    defaultFormat: "panel",
    rubric: "government",
    interviewAvailability: "some-posts",
    selectionNote:
      "Interview requirements vary widely between universities, school boards and research labs. Some school recruitments have removed interviews.",
    backgroundPrompt: "Subject, research area, publications or teaching experience",
    topicAreas: ["Subject depth", "Teaching approach", "Research work", "Institutional contribution"],
  },
  {
    id: "international-public",
    category: "government",
    title: "International public sector",
    field: "Public sector",
    description: "Competency-based civil service and public agency interviews outside India.",
    roles: [{ id: "civil-servant", title: "Civil servant / public agency role", skills: ["Competencies", "Public service values"] }],
    formats: ["behavioral", "situational", "government-personality", "panel"],
    defaultFormat: "behavioral",
    rubric: "behavioral",
    interviewAvailability: "yes",
    selectionNote:
      "Many public bodies use structured, competency-based interviews. Check the published framework for your country or agency.",
    topicAreas: ["Behavioural competencies", "Public service values", "Delivering at pace", "Working together"],
  },
  {
    id: "government-custom",
    category: "government",
    title: "Other government interview",
    field: "Public sector",
    description: "Any other public-sector interview. Describe the post and process yourself.",
    roles: [{ id: "custom-gov", title: "Government post", skills: [] }],
    formats: GOV_FORMATS,
    defaultFormat: "government-personality",
    rubric: "government",
    interviewAvailability: "some-posts",
    selectionNote: "Confirm from the official notification that your selection process includes an interview.",
    backgroundPrompt: "Post, organisation and anything the panel will know about you",
    topicAreas: ["Background", "Role knowledge", "Ethics", "Situational judgement"],
  },

  // ───────────────────────── Private sector and corporate ─────────────────────────
  {
    id: "software",
    category: "private",
    title: "Software engineering and IT",
    field: "Software engineering",
    description: "Frontend, backend, mobile, DevOps, cloud, security and QA.",
    roles: [
      { id: "frontend", title: "Frontend Developer", skills: ["HTML/CSS", "JavaScript", "React", "TypeScript", "Accessibility"] },
      { id: "backend", title: "Backend Developer", skills: ["APIs", "Databases", "System design", "Node.js or Python"] },
      { id: "fullstack", title: "Full Stack Developer", skills: ["Frontend", "Backend", "Databases", "Deployment"] },
      { id: "mobile-developer", title: "Mobile Developer", skills: ["Swift", "Kotlin", "React Native or Flutter", "Mobile UI"] },
      { id: "devops", title: "DevOps Engineer", skills: ["CI/CD", "Docker", "Kubernetes", "Linux", "Cloud"] },
      { id: "cloud-architect", title: "Cloud Architect", skills: ["AWS/Azure/GCP", "Networking", "Infrastructure as code", "Cost"] },
      { id: "security-engineer", title: "Security Engineer", skills: ["Threat modelling", "OWASP", "Cryptography basics", "Incident response"] },
      { id: "qa-engineer", title: "QA Engineer", skills: ["Test design", "Automation", "API testing", "Bug triage"] },
      { id: "sde-fresher", title: "Software Engineer (campus / fresher)", skills: ["Data structures", "OOP", "DBMS", "Operating systems", "Projects"] },
    ],
    formats: ["technical", "behavioral", "hr", "resume", "job-description", "company", "panel", "stress"],
    defaultFormat: "technical",
    rubric: "technical",
    topicAreas: ["Fundamentals", "Practical problem solving", "Past projects", "Trade-offs", "Debugging approach"],
  },
  {
    id: "data-ai",
    category: "private",
    title: "Data, AI and machine learning",
    field: "Data and AI",
    description: "Analytics, data science and ML engineering.",
    roles: [
      { id: "data-analytics", title: "Data Analyst", skills: ["SQL", "Excel", "Dashboards", "Statistics"] },
      { id: "data-science", title: "Data Scientist", skills: ["Statistics", "Machine learning", "Experimentation", "Python"] },
      { id: "ml-engineer", title: "Machine Learning Engineer", skills: ["Model training", "MLOps", "Deployment", "Evaluation"] },
    ],
    formats: ["technical", "situational", "behavioral", "resume", "job-description", "company"],
    defaultFormat: "technical",
    rubric: "data",
    topicAreas: ["Analytical reasoning", "Methodology", "Interpreting results", "Limitations and bias", "Projects"],
  },
  {
    id: "design",
    category: "private",
    title: "Design",
    field: "Design",
    description: "UI/UX, product and graphic design.",
    roles: [
      { id: "ui-ux", title: "UI/UX Designer", skills: ["User research", "Interaction design", "Prototyping", "Design systems"] },
      { id: "product-designer", title: "Product Designer", skills: ["Problem framing", "Research", "Prototyping", "Metrics"] },
      { id: "graphic-designer", title: "Graphic Designer", skills: ["Typography", "Branding", "Layout", "Visual communication"] },
    ],
    formats: ["technical", "behavioral", "situational", "resume", "job-description", "company"],
    defaultFormat: "technical",
    rubric: "design",
    topicAreas: ["Portfolio walkthrough", "Design process", "Research and validation", "Critique and trade-offs"],
  },
  {
    id: "product-business",
    category: "private",
    title: "Product and business analysis",
    field: "Product management",
    description: "Product management, business analysis and agile delivery.",
    roles: [
      { id: "product-manager", title: "Product Manager", skills: ["Prioritisation", "Metrics", "Strategy", "Stakeholders"] },
      { id: "business-analyst", title: "Business Analyst", skills: ["Requirements", "SQL", "Process mapping", "Stakeholders"] },
      { id: "scrum-master", title: "Scrum Master", skills: ["Scrum", "Facilitation", "Coaching", "Delivery"] },
    ],
    formats: ["situational", "behavioral", "technical", "resume", "job-description", "company"],
    defaultFormat: "situational",
    rubric: "product",
    topicAreas: ["Product sense", "Prioritisation", "Metrics", "Stakeholder conflict", "Execution"],
  },
  {
    id: "business-functions",
    category: "private",
    title: "Business functions and MBA roles",
    field: "Business",
    description: "Marketing, sales, finance, consulting, operations and general management.",
    roles: [
      { id: "mba-general", title: "General Management", skills: ["Strategy", "Leadership", "Operations"] },
      { id: "mba-marketing", title: "Marketing", skills: ["Branding", "Consumer insight", "Digital marketing", "Analytics"] },
      { id: "mba-finance", title: "Finance", skills: ["Financial analysis", "Valuation", "Accounting", "Risk"] },
      { id: "sales", title: "Sales", skills: ["Prospecting", "Negotiation", "Pipeline", "Objection handling"] },
      { id: "consulting", title: "Consultant", skills: ["Structured problem solving", "Estimation", "Communication"] },
      { id: "operations", title: "Operations", skills: ["Process improvement", "Supply chain", "Metrics"] },
    ],
    formats: ["situational", "behavioral", "hr", "technical", "resume", "job-description", "company", "stress"],
    defaultFormat: "behavioral",
    rubric: "general",
    topicAreas: ["Role knowledge", "Business judgement", "Past impact", "Communication"],
  },
  {
    id: "people-support",
    category: "private",
    title: "People, support and administration",
    field: "Operations and people",
    description: "HR, customer support and administrative roles.",
    roles: [
      { id: "hr-specialist", title: "HR Specialist", skills: ["Recruitment", "Employee relations", "HR policy"] },
      { id: "customer-support", title: "Customer Support", skills: ["Empathy", "Problem resolution", "Escalation"] },
      { id: "admin", title: "Administrative Officer", skills: ["Organisation", "Communication", "Tools"] },
    ],
    formats: ["behavioral", "situational", "hr", "resume", "job-description"],
    defaultFormat: "behavioral",
    rubric: "behavioral",
    topicAreas: ["Handling people", "Conflict", "Process", "Service quality"],
  },
  {
    id: "professional-fields",
    category: "private",
    title: "Healthcare, law, education and more",
    field: "Professional services",
    description: "Healthcare, biotechnology, law, teaching, hospitality and other professions.",
    roles: [
      { id: "healthcare", title: "Healthcare professional", skills: ["Clinical judgement", "Patient care", "Ethics"] },
      { id: "biotech", title: "Biotechnology / life sciences", skills: ["Lab methods", "Research", "Regulation"] },
      { id: "law", title: "Legal associate", skills: ["Legal reasoning", "Research", "Drafting"] },
      { id: "educator", title: "Teacher / educator", skills: ["Pedagogy", "Classroom management", "Assessment"] },
      { id: "hospitality", title: "Hospitality", skills: ["Guest service", "Operations", "Teamwork"] },
    ],
    formats: ["behavioral", "situational", "technical", "hr", "resume", "job-description"],
    defaultFormat: "behavioral",
    rubric: "general",
    topicAreas: ["Professional judgement", "Ethics", "Domain knowledge", "Teamwork"],
  },
  {
    id: "leadership",
    category: "private",
    title: "Leadership and executive",
    field: "Leadership",
    description: "Manager, director and executive interviews.",
    roles: [
      { id: "eng-manager", title: "Engineering Manager", skills: ["People leadership", "Delivery", "Technical judgement"] },
      { id: "people-manager", title: "People Manager", skills: ["Coaching", "Performance", "Hiring"] },
      { id: "executive", title: "Executive / Director", skills: ["Strategy", "Organisation design", "Stakeholders"] },
    ],
    formats: ["behavioral", "situational", "panel", "stress", "resume", "job-description", "company"],
    defaultFormat: "behavioral",
    rubric: "behavioral",
    topicAreas: ["Leading teams", "Difficult decisions", "Strategy", "Stakeholder management", "Hiring and performance"],
  },
  {
    id: "campus-general",
    category: "private",
    title: "Campus placements and internships",
    field: "Graduate hiring",
    description: "HR and general rounds for freshers and interns in any field.",
    roles: [
      { id: "graduate", title: "Graduate trainee", skills: ["Communication", "Learning ability", "Projects"] },
      { id: "intern", title: "Intern", skills: ["Motivation", "Projects", "Coursework"] },
    ],
    formats: ["hr", "behavioral", "resume", "technical", "company"],
    defaultFormat: "hr",
    rubric: "behavioral",
    topicAreas: ["Introduction", "Projects", "Strengths and weaknesses", "Motivation", "Teamwork"],
  },

  // ───────────────────────── Custom ─────────────────────────
  {
    id: "custom",
    category: "custom",
    title: "Build your own",
    field: "Custom",
    description: "Any role, any field. Add your own topics and questions.",
    roles: [{ id: "custom-role", title: "", skills: [] }],
    formats: ["custom", "behavioral", "technical", "situational", "hr", "resume", "job-description", "panel", "stress"],
    defaultFormat: "custom",
    rubric: "general",
    topicAreas: [],
  },
];

export const CATEGORIES: { id: CategoryId; title: string; description: string }[] = [
  { id: "government", title: "Government and public sector", description: "UPSC, state PSCs, SSB, banking, PSUs, teaching and more" },
  { id: "private", title: "Private sector", description: "Tech, data, design, product, business, healthcare, leadership" },
  { id: "custom", title: "Custom", description: "Describe any interview and bring your own questions" },
];

export interface FormatInfo {
  id: FormatId;
  title: string;
  description: string;
  /** Instruction folded into the interviewer's system prompt. */
  instruction: string;
  needs?: "resume" | "job-description" | "organization";
}

export const FORMATS: Record<FormatId, FormatInfo> = {
  hr: {
    id: "hr",
    title: "HR round",
    description: "Introduction, motivation, strengths, fit",
    instruction:
      "Run an HR screening round: self-introduction, motivation for the role, strengths and weaknesses, career goals, team fit and practical questions such as notice period or relocation only if relevant.",
  },
  behavioral: {
    id: "behavioral",
    title: "Behavioural (STAR)",
    description: "Past situations, actions and results",
    instruction:
      "Run a behavioural interview. Ask for specific past situations. Probe for the candidate's own actions, measurable results and what they learned. If an answer is hypothetical or vague, ask for a real example.",
  },
  technical: {
    id: "technical",
    title: "Technical knowledge",
    description: "Concepts, problem solving, trade-offs",
    instruction:
      "Run a spoken technical interview. Ask conceptual and practical problem-solving questions suited to the level. Ask the candidate to explain reasoning and trade-offs aloud. Do not ask them to write code character by character; this is a voice conversation.",
  },
  situational: {
    id: "situational",
    title: "Situational and case",
    description: "Hypothetical scenarios and judgement",
    instruction:
      "Present realistic hypothetical scenarios or short cases relevant to the role. Ask how the candidate would approach them, then probe assumptions, priorities and risks.",
  },
  resume: {
    id: "resume",
    title: "Resume deep-dive",
    description: "Questions about what you listed",
    instruction:
      "Base most questions on the candidate's resume. Ask them to expand on specific projects, roles and claims, and probe for their personal contribution and evidence.",
    needs: "resume",
  },
  "job-description": {
    id: "job-description",
    title: "Job description match",
    description: "Questions mapped to the posting",
    instruction:
      "Base questions on the responsibilities and requirements in the job description. Test whether the candidate can show evidence for each key requirement.",
    needs: "job-description",
  },
  company: {
    id: "company",
    title: "Company-focused",
    description: "Motivation and fit for a target organisation",
    instruction:
      "Include questions about why the candidate wants to join the target organisation and how their experience fits. Only refer to facts about the organisation that are widely known; never claim to know its confidential or actual interview questions.",
    needs: "organization",
  },
  "government-personality": {
    id: "government-personality",
    title: "Personality test",
    description: "Background, ethics, awareness, judgement",
    instruction:
      "Conduct a public-service personality interview in the manner of a board: questions about the candidate's background, education, home region, hobbies, ethical dilemmas, governance and broad awareness. Look for balanced views, honesty and clear reasoning rather than memorised facts.",
  },
  panel: {
    id: "panel",
    title: "Panel simulation",
    description: "Several interviewers with different focus",
    instruction:
      "Simulate a panel of three members with different focus areas (for example a chairperson, a subject expert and an HR or behavioural member). Announce briefly who is asking when the speaker changes, e.g. 'Let me hand over to our subject expert.' Keep a single voice but change perspective.",
  },
  stress: {
    id: "stress",
    title: "Pressure round",
    description: "Firm follow-ups and challenge, kept respectful",
    instruction:
      "Apply controlled pressure: challenge weak reasoning, ask pointed follow-ups and play devil's advocate. Remain respectful at all times. Never insult, mock or demean the candidate, and ease off if they appear distressed.",
  },
  custom: {
    id: "custom",
    title: "Custom",
    description: "Your topics and questions",
    instruction:
      "Follow the candidate's chosen topics and custom questions. Fill the remaining time with relevant questions for the stated role.",
  },
};

export const LEVELS: { id: LevelId; title: string }[] = [
  { id: "intern", title: "Intern / student" },
  { id: "entry", title: "Entry level / fresher" },
  { id: "mid", title: "Mid level" },
  { id: "senior", title: "Senior" },
  { id: "leadership", title: "Leadership" },
];

export const STYLES: { id: StyleId; title: string; description: string; instruction: string }[] = [
  {
    id: "friendly",
    title: "Friendly",
    description: "Warm and relaxed",
    instruction: "Be warm and relaxed, like an approachable interviewer. Do not over-praise; acknowledge answers briefly and move on.",
  },
  {
    id: "neutral",
    title: "Neutral",
    description: "Polite, even, gives little away",
    instruction: "Be polite and even-toned. Give minimal feedback during the interview, as most real interviewers do.",
  },
  {
    id: "formal",
    title: "Formal",
    description: "Structured and reserved",
    instruction: "Be formal and reserved, like an official selection board. Use complete sentences and avoid casual language.",
  },
  {
    id: "challenging",
    title: "Challenging",
    description: "Probing, pushes for depth",
    instruction: "Be probing and direct. Push for specifics, test claims and ask 'why' often, while staying courteous.",
  },
];

export const DIFFICULTIES: { id: DifficultyId; title: string; instruction: string }[] = [
  { id: "easy", title: "Warm-up", instruction: "Keep questions approachable and give the candidate room to settle in." },
  { id: "standard", title: "Standard", instruction: "Pitch questions at a realistic level for the role and seniority." },
  { id: "hard", title: "Tough", instruction: "Ask demanding questions and deeper follow-ups, as a selective employer would." },
];

export const LANGUAGES: { id: LanguageId; title: string; instruction: string }[] = [
  { id: "en-IN", title: "English (India)", instruction: "Speak in clear Indian English." },
  { id: "en-US", title: "English (US)", instruction: "Speak in clear American English." },
  { id: "en-GB", title: "English (UK)", instruction: "Speak in clear British English." },
  { id: "hi", title: "Hindi", instruction: "Conduct the entire interview in Hindi. Use Devanagari script in your responses." },
  {
    id: "hinglish",
    title: "Hindi + English",
    instruction: "Use natural Hinglish: mostly Hindi with English technical terms, matching the candidate's own mix.",
  },
];

export function getTrack(id: string): Track | undefined {
  return TRACKS.find((t) => t.id === id);
}

export function tracksFor(category: CategoryId): Track[] {
  return TRACKS.filter((t) => t.category === category);
}

/** Pick the rubric: format-specific rubrics override the track's field rubric. */
export function rubricFor(trackId: string, format: FormatId): RubricId {
  if (format === "behavioral" || format === "hr") return "behavioral";
  if (format === "government-personality") return "government";
  return getTrack(trackId)?.rubric ?? "general";
}

/** Approximate minutes per question for duration estimates and the call's hard limit. */
export const MINUTES_PER_QUESTION = 2.5;

export function estimatedMinutes(questionCount: number): number {
  return Math.round(questionCount * MINUTES_PER_QUESTION + 2);
}
