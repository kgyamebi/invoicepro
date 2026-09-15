import { z } from "zod";
import { rewriteText } from "@/server/ai";
import { errorResponse, json } from "@/server/http";
import { getActiveContext } from "@/server/tenant";

export async function POST(request: Request) {
  try {
    const context = await getActiveContext();
    const { text } = z.object({ text: z.string().min(2) }).parse(await request.json());
    const result = await rewriteText(text, "Generate polite invoice notes. Do not invent amounts.", {
      organizationId: context.organization.id,
      businessId: context.business.id,
      userId: context.user.id,
    });
    return json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
