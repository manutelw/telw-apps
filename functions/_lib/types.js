export const PRACTICE_TYPES = new Set(["STUDENT_QA", "STUDENT_INTERVIEW", "WORKPLACE_DIALOGUE"]);
export const DIFFICULTIES = new Set(["GUIDED", "REALISTIC", "PRESSURE"]);
export const STUDENT_PROFILES = new Set(["MBA", "BTECH", "ARCHITECTURE", "OTHER_STUDENT"]);
export const WORKPLACE_LEVELS = new Set(["PROFESSIONAL", "MANAGER", "SENIOR_LEADER", "CXO"]);

export const SCORE_CRITERIA = {
  STUDENT_QA: [
    "Structure and Clarity", "Relevance", "Evidence", "Communication and Professionalism", "Composure"
  ],
  STUDENT_INTERVIEW: [
    "Structure and Clarity", "Content Depth and Evidence", "Listening and Responsiveness", "Business Thinking", "Communication and Professionalism", "Composure Under Pressure", "Recovery and Adaptation"
  ],
  WORKPLACE_DIALOGUE: [
    "Issue Clarity", "Ownership", "Judgement", "Stakeholder Awareness", "Options and Recommendation", "Professional Language", "Composure", "Decision or Next-Step Clarity"
  ]
};

export function validateStartPayload(input) {
  const practiceType = String(input.practiceType || "").toUpperCase();
  const difficulty = String(input.difficulty || "").toUpperCase();
  const profileKey = input.profileKey ? String(input.profileKey).toUpperCase() : null;
  const levelKey = input.levelKey ? String(input.levelKey).toUpperCase() : null;
  const topicKey = String(input.topicKey || "SURPRISE").toUpperCase();
  if (!PRACTICE_TYPES.has(practiceType)) throw new Error("Choose a valid practice type.");
  if (!DIFFICULTIES.has(difficulty)) throw new Error("Choose a valid difficulty.");
  if (practiceType === "WORKPLACE_DIALOGUE") {
    if (!WORKPLACE_LEVELS.has(levelKey)) throw new Error("Choose a valid workplace level.");
  } else if (!STUDENT_PROFILES.has(profileKey)) {
    throw new Error("Choose a valid student profile.");
  }
  return { practiceType, difficulty, profileKey, levelKey, topicKey };
}

export function maxLearnerTurns(practiceType, difficulty) {
  if (practiceType === "STUDENT_QA") return 1;
  if (difficulty === "PRESSURE") return 3;
  return 2;
}
