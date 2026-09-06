import { z } from "zod";
import { hashToken } from "@/lib/auth/crypto";
import { prisma } from "@/server/db";
import { errorResponse, json } from "@/server/http";

export async function POST(request: Request) {
  try {
    const { token } = z.object({ token: z.string().min(10) }).parse(await request.json());
    const record = await prisma.emailToken.findUnique({ where: { tokenHash: hashToken(token) } });
    if (!record || record.type !== "VERIFY_EMAIL" || record.usedAt || record.expiresAt < new Date()) {
      return json({ error: "This verification link is invalid or has expired." }, 400);
    }
    await prisma.user.update({
      where: { id: record.userId },
      data: { emailVerifiedAt: new Date() },
    });
    await prisma.emailToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
