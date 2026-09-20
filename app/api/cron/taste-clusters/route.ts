import { NextResponse } from "next/server";
import { processClusterQueue } from "../../../../server/services/taste-clusters/service";

export async function GET(request: Request) {
  if (
    !process.env.CRON_SECRET ||
    request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
  )
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (process.env.FASHION_AGENT_CLUSTER_SHADOW !== "true")
    return NextResponse.json({ enabled: false });
  try {
    return NextResponse.json(await processClusterQueue());
  } catch {
    return NextResponse.json(
      { error: "cluster_worker_failed" },
      { status: 503 }
    );
  }
}
