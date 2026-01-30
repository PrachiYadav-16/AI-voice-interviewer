/**
 * Job roles and interview categories
 */

export interface JobRole {
  id: string;
  title: string;
  category: string;
  description: string;
  icon: string;
  color: string;
  skills: string[];
}

export const JOB_ROLES: JobRole[] = [
  {
    id: "frontend",
    title: "Frontend Developer",
    category: "Engineering",
    description: "React, Vue, Angular, UI/UX implementation",
    icon: "🎨",
    color: "from-blue-500 to-cyan-500",
    skills: ["HTML/CSS", "JavaScript", "React", "TypeScript", "UI/UX"],
  },
  {
    id: "backend",
    title: "Backend Developer",
    category: "Engineering",
    description: "APIs, databases, server-side architecture",
    icon: "⚙️",
    color: "from-green-500 to-emerald-500",
    skills: ["Node.js", "Python", "Databases", "APIs", "System Design"],
  },
  {
    id: "fullstack",
    title: "Full Stack Developer",
    category: "Engineering",
    description: "End-to-end web application development",
    icon: "💻",
    color: "from-purple-500 to-pink-500",
    skills: ["Frontend", "Backend", "DevOps", "Databases", "Architecture"],
  },
  {
    id: "data-analytics",
    title: "Data Analyst",
    category: "Data",
    description: "Data visualization, SQL, business intelligence",
    icon: "📊",
    color: "from-orange-500 to-red-500",
    skills: ["SQL", "Python", "Excel", "Tableau", "Statistics"],
  },
  {
    id: "data-science",
    title: "Data Scientist",
    category: "Data",
    description: "Machine learning, statistical analysis, AI",
    icon: "🤖",
    color: "from-indigo-500 to-purple-500",
    skills: ["Python", "ML", "Statistics", "Deep Learning", "NLP"],
  },
  {
    id: "devops",
    title: "DevOps Engineer",
    category: "Engineering",
    description: "CI/CD, cloud infrastructure, automation",
    icon: "🚀",
    color: "from-teal-500 to-cyan-500",
    skills: ["Docker", "Kubernetes", "AWS", "CI/CD", "Linux"],
  },
  {
    id: "product-manager",
    title: "Product Manager",
    category: "Product",
    description: "Product strategy, roadmap, stakeholder management",
    icon: "📱",
    color: "from-yellow-500 to-orange-500",
    skills: ["Strategy", "Agile", "Analytics", "Communication", "Leadership"],
  },
  {
    id: "mba-general",
    title: "MBA General Management",
    category: "MBA",
    description: "Leadership, strategy, business operations",
    icon: "🎓",
    color: "from-red-500 to-pink-500",
    skills: ["Leadership", "Strategy", "Finance", "Operations", "Marketing"],
  },
  {
    id: "mba-marketing",
    title: "MBA Marketing",
    category: "MBA",
    description: "Brand management, digital marketing, analytics",
    icon: "📈",
    color: "from-pink-500 to-rose-500",
    skills: ["Marketing", "Branding", "Analytics", "Consumer Behavior", "Digital"],
  },
  {
    id: "mba-finance",
    title: "MBA Finance",
    category: "MBA",
    description: "Financial analysis, investment, corporate finance",
    icon: "💰",
    color: "from-green-500 to-teal-500",
    skills: ["Finance", "Accounting", "Valuation", "Risk", "Investment"],
  },
  {
    id: "ui-ux",
    title: "UI/UX Designer",
    category: "Design",
    description: "User research, wireframing, prototyping",
    icon: "🎯",
    color: "from-violet-500 to-purple-500",
    skills: ["Figma", "User Research", "Prototyping", "Design Systems", "UX"],
  },
  {
    id: "qa-engineer",
    title: "QA Engineer",
    category: "Engineering",
    description: "Test automation, quality assurance, bug tracking",
    icon: "🔍",
    color: "from-cyan-500 to-blue-500",
    skills: ["Testing", "Automation", "Selenium", "JIRA", "API Testing"],
  },
  {
    id: "mobile-developer",
    title: "Mobile Developer",
    category: "Engineering",
    description: "iOS, Android, React Native, Flutter development",
    icon: "📱",
    color: "from-emerald-500 to-teal-500",
    skills: ["Swift", "Kotlin", "React Native", "Flutter", "Mobile UI"],
  },
  {
    id: "cloud-architect",
    title: "Cloud Architect",
    category: "Engineering",
    description: "AWS, Azure, GCP, cloud infrastructure design",
    icon: "☁️",
    color: "from-sky-500 to-blue-500",
    skills: ["AWS", "Azure", "GCP", "Terraform", "Cloud Security"],
  },
  {
    id: "security-engineer",
    title: "Security Engineer",
    category: "Engineering",
    description: "Cybersecurity, penetration testing, security audits",
    icon: "🔒",
    color: "from-red-500 to-orange-500",
    skills: ["Security", "Penetration Testing", "OWASP", "Encryption", "Compliance"],
  },
  {
    id: "business-analyst",
    title: "Business Analyst",
    category: "Product",
    description: "Requirements gathering, process improvement, stakeholder management",
    icon: "📋",
    color: "from-amber-500 to-yellow-500",
    skills: ["Requirements", "SQL", "Documentation", "Stakeholder Management", "Agile"],
  },
  {
    id: "scrum-master",
    title: "Scrum Master",
    category: "Product",
    description: "Agile coaching, sprint planning, team facilitation",
    icon: "🎯",
    color: "from-lime-500 to-green-500",
    skills: ["Scrum", "Agile", "Facilitation", "Coaching", "Jira"],
  },
  {
    id: "ml-engineer",
    title: "Machine Learning Engineer",
    category: "Data",
    description: "ML models, deep learning, model deployment",
    icon: "🧠",
    color: "from-violet-500 to-fuchsia-500",
    skills: ["Python", "TensorFlow", "PyTorch", "MLOps", "Model Deployment"],
  },
  {
    id: "hr-specialist",
    title: "HR Specialist",
    category: "MBA",
    description: "Recruitment, talent management, employee relations",
    icon: "👥",
    color: "from-rose-500 to-pink-500",
    skills: ["Recruitment", "Talent Management", "HR Policies", "Employee Relations", "HRIS"],
  },
  {
    id: "graphic-designer",
    title: "Graphic Designer",
    category: "Design",
    description: "Visual design, branding, creative assets",
    icon: "🎨",
    color: "from-fuchsia-500 to-purple-500",
    skills: ["Photoshop", "Illustrator", "Branding", "Typography", "Creative Design"],
  },
];

export const JOB_CATEGORIES = [
  "All",
  "Engineering",
  "Data",
  "Product",
  "MBA",
  "Design",
] as const;

export type JobCategory = typeof JOB_CATEGORIES[number];
