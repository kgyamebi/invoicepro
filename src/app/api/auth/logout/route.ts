import { redirect } from "next/navigation";
import { destroySession } from "@/server/auth";
import { errorResponse } from "@/server/http";

export async function POST() {
  try {
    await destroySession();
  } catch (error) {
    return errorResponse(error);
  }
  redirect("/login");
}
