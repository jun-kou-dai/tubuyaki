export interface TubuyakiRecord {
  id: string;
  rawText: string;
  cleanText: string | null;
  intent: string[];
  entities: {
    people: string[];
    places: string[];
    deadlines: string[];
    amounts: string[];
    tools: string[];
    organizations: string[];
  } | null;
  summary3lines: string | null;
  ideas: string[];
  nextAction: string | null;
  confidence: number | null;
  context: string | null;
  feedback: string | null;
  feedbackDetail: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export type IntentTag = "Problem" | "Desire" | "Insight" | "Decision" | "Note";

export const INTENT_TAGS: IntentTag[] = [
  "Problem",
  "Desire",
  "Insight",
  "Decision",
  "Note",
];

export const INTENT_COLORS: Record<IntentTag, string> = {
  Problem: "bg-red-100 text-red-700",
  Desire: "bg-purple-100 text-purple-700",
  Insight: "bg-yellow-100 text-yellow-700",
  Decision: "bg-green-100 text-green-700",
  Note: "bg-gray-100 text-gray-700",
};
