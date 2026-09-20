import { NextResponse } from "next/server";
import {
  getRegisteredRequestUser,
  hasValidMutationOrigin,
} from "../../../../../server/auth/request-user";
import {
  createHumanEvaluation,
  getEvaluationProgress,
  rateHumanEvaluation,
} from "../../../../../server/services/taste-clusters/human-evaluation";
import { evaluationQuestions } from "../../../../../server/services/taste-clusters/questions";
const response = (data: unknown, status = 200) =>
  NextResponse.json(
    {
      ok: status < 400,
      data: status < 400 ? data : undefined,
      error: status >= 400 ? data : undefined,
    },
    { status, headers: { "Cache-Control": "private, no-store" } }
  );
const enabled = () => process.env.FASHION_AGENT_EXPERIMENTS === "true";
export async function GET(request: Request) {
  if (!enabled()) return response("not_found", 404);
  const user = await getRegisteredRequestUser(request);
  if (!user) return response("login_required", 401);
  try {
    return response(await getEvaluationProgress(user.id));
  } catch {
    return response("evaluation_unavailable", 503);
  }
}
export async function POST(request: Request) {
  if (!enabled()) return response("not_found", 404);
  if (!hasValidMutationOrigin(request)) return response("invalid_origin", 403);
  const user = await getRegisteredRequestUser(request);
  if (!user) return response("login_required", 401);
  try {
    const body = await request.json();
    const question = evaluationQuestions.find(
      (item) => item.id === body.questionId
    );
    if (!question) return response("invalid_question", 400);
    return response(await createHumanEvaluation(user.id, question));
  } catch {
    return response("evaluation_unavailable", 503);
  }
}
export async function PUT(request: Request) {
  if (!enabled()) return response("not_found", 404);
  if (!hasValidMutationOrigin(request)) return response("invalid_origin", 403);
  const user = await getRegisteredRequestUser(request);
  if (!user) return response("login_required", 401);
  try {
    const body = await request.json();
    if (typeof body.runId !== "string") return response("invalid_rating", 400);
    await rateHumanEvaluation(user.id, body.runId, body);
    return response({ saved: true });
  } catch {
    return response("invalid_rating", 400);
  }
}
