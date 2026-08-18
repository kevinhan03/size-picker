import { NextResponse } from "next/server";
import { getRegisteredRequestUser } from "../../../../server/auth/request-user";
import { getClosetProducts, getDigboxProducts, getMySizes } from "../../../../server/services/user-collections";

export async function GET(request: Request) {
  try {
    const user = await getRegisteredRequestUser(request);
    if (!user) return NextResponse.json({ ok: false, error: "registered account required" }, { status: 401 });

    const [closet, digbox, profiles] = await Promise.all([
      getClosetProducts(user.id),
      getDigboxProducts(user.id),
      getMySizes(user.id),
    ]);

    return NextResponse.json(
      { ok: true, data: { closet: { products: closet }, digbox, profiles } },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "collection bootstrap failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
