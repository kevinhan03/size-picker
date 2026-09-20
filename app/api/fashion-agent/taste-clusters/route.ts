import { NextResponse } from "next/server";
import { getRegisteredRequestUser } from "../../../../server/auth/request-user";
import { supabase } from "../../../../server/lib/supabase.js";
import { getTasteSummary } from "../../../../server/services/taste-analysis";
import {
  fingerprint,
  VERSION,
} from "../../../../server/services/taste-clusters/cluster";

export async function GET(request: Request) {
  const user = await getRegisteredRequestUser(request);
  if (!user)
    return NextResponse.json({ error: "login_required" }, { status: 401 });
  const source = new URL(request.url).searchParams.get("source") || "digbox";
  if (source !== "digbox" && source !== "closet")
    return NextResponse.json({ error: "invalid_source" }, { status: 400 });
  try {
    if (!supabase) throw new Error("database_unavailable");
    const { products } = await getTasteSummary(user.id, source);
    const hash = fingerprint(products);
    const models = await supabase
      .from("user_taste_cluster_models")
      .select("id,fingerprint,accepted,result,created_at,algorithm_version")
      .eq("user_id", user.id)
      .eq("source", source)
      .eq("algorithm_version", VERSION)
      .eq("fingerprint", hash)
      .maybeSingle();
    if (models.error) throw models.error;
    const current = models.data;
    const evaluations = current
      ? await supabase
          .from("user_taste_cluster_evaluations")
          .select(
            "id,plan,selected_cluster,baseline_ids,shadow_ids,overlap,created_at"
          )
          .eq("user_id", user.id)
          .eq("model_id", current.id)
          .order("created_at", { ascending: false })
          .limit(20)
      : { data: [], error: null };
    if (evaluations.error) throw evaluations.error;
    return NextResponse.json(
      {
        mode: "shadow",
        productionTaste: "saved-axis-mean",
        enabled: process.env.FASHION_AGENT_CLUSTER_SHADOW === "true",
        source,
        status: current ? (current.accepted ? "ready" : "rejected") : "pending",
        current,
        evaluations: evaluations.data,
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch {
    return NextResponse.json(
      { error: "clusters_unavailable" },
      { status: 503 }
    );
  }
}
