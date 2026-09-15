import { destroySession } from "@/server/auth";
import { errorResponse, json } from "@/server/http";

export async function POST() {
  try {
    await destroySession();
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
