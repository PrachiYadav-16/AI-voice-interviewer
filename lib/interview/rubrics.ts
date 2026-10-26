import type { RubricId } from "./types";

export interface RubricCriterion {
  name: string;
  /** What a 5 looks like, shown to users and given to the evaluator. */
  description: string;
}

export interface Rubric {
  id: RubricId;
  title: string;
  framework?: { name: string; explanation: string };
  criteria: RubricCriterion[];
}

/** Shared 1–5 anchor scale used by every rubric. */
export const SCALE = [
  { score: 1, label: "Missing", meaning: "Not addressed, or incorrect." },
  { score: 2, label: "Weak", meaning: "Touched on, but vague or mostly unsupported." },
  { score: 3, label: "Adequate", meaning: "Addressed with some specifics; noticeable gaps." },
  { score: 4, label: "Strong", meaning: "Clear and specific, with minor gaps." },
  { score: 5, label: "Excellent", meaning: "Thorough, specific and well reasoned." },
] as const;

export const RUBRICS: Record<RubricId, Rubric> = {
  behavioral: {
    id: "behavioral",
    title: "Behavioural answers",
    framework: {
      name: "STAR",
      explanation:
        "Situation: brief context. Task: what you were responsible for. Action: what you personally did. Result: the outcome, ideally measured, and what you learned.",
    },
    criteria: [
      { name: "Context", description: "Sets up the situation briefly and clearly." },
      { name: "Ownership", description: "Makes their own responsibility and role clear." },
      { name: "Actions", description: "Describes specific steps they personally took." },
      { name: "Outcome", description: "States a concrete result, ideally measurable." },
      { name: "Reflection", description: "Explains what they learned or would do differently." },
    ],
  },
  technical: {
    id: "technical",
    title: "Technical answers",
    criteria: [
      { name: "Correctness", description: "Statements are technically accurate." },
      { name: "Reasoning", description: "Explains why, not only what." },
      { name: "Approach", description: "Breaks the problem down in a sensible order." },
      { name: "Trade-offs", description: "Compares alternatives and their costs." },
      { name: "Explanation", description: "Easy to follow when spoken aloud." },
    ],
  },
  design: {
    id: "design",
    title: "Design answers",
    criteria: [
      { name: "Problem framing", description: "Defines the user problem before solutions." },
      { name: "User research", description: "Grounds decisions in evidence about users." },
      { name: "Design decisions", description: "Justifies choices and alternatives considered." },
      { name: "Usability", description: "Considers accessibility, edge cases and usability." },
      { name: "Impact", description: "Connects work to outcomes or metrics." },
    ],
  },
  product: {
    id: "product",
    title: "Product answers",
    criteria: [
      { name: "Problem definition", description: "Clarifies goals, users and constraints." },
      { name: "Prioritisation", description: "Uses a clear rationale to choose what matters." },
      { name: "Metrics", description: "Defines how success would be measured." },
      { name: "Trade-offs", description: "Acknowledges risks and what is given up." },
      { name: "Strategy", description: "Links the answer to a broader direction." },
    ],
  },
  data: {
    id: "data",
    title: "Data answers",
    criteria: [
      { name: "Analytical reasoning", description: "Frames the question and hypotheses logically." },
      { name: "Methodology", description: "Picks suitable methods and explains why." },
      { name: "Interpretation", description: "Draws sound conclusions from results." },
      { name: "Limitations", description: "Names bias, data quality and uncertainty." },
      { name: "Communication", description: "Explains clearly to a non-specialist." },
    ],
  },
  government: {
    id: "government",
    title: "Public-service interview",
    criteria: [
      { name: "Relevance", description: "Answers the question that was asked." },
      { name: "Balanced reasoning", description: "Considers multiple perspectives fairly." },
      { name: "Factual accuracy", description: "Facts stated are correct, or uncertainty is admitted honestly." },
      { name: "Ethical judgement", description: "Shows integrity and sound values in dilemmas." },
      { name: "Clarity", description: "Expresses views clearly and calmly." },
    ],
  },
  general: {
    id: "general",
    title: "General interview",
    criteria: [
      { name: "Relevance", description: "Answers the actual question." },
      { name: "Completeness", description: "Covers the important parts of the question." },
      { name: "Specificity", description: "Uses concrete examples and evidence." },
      { name: "Role knowledge", description: "Shows knowledge expected for the role." },
      { name: "Structure", description: "Organised so the listener can follow." },
    ],
  },
};
