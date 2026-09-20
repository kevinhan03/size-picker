export const FASHION_AGENT_ALGORITHM = {
  orchestration: "fashion-agent-ops-v3",
  retrieval: "hybrid-axis-retrieval-v1",
  ranking: "baseline-mean-confidence-v2",
  feedbackShadow: "feedback-calibrated-v1",
  taste: "saved-mean-axes-v1",
} as const;
