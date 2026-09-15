import { z } from "zod";
import { hashPassword, hashToken } from "@/lib/auth/crypto";
import { prisma } from "@/server/db";
import { errorResponse, json } from "@/server/http";

export async function POST(request: Request) {
  try {
    const { token, password } = z
      .object({ token: z.string().min(10), password: z.string().min(8).max(72) })
      .parse(await request.json());
    const record = await prisma.emailToken.findUnique({ where: { tokenHash: hashToken(token) } });
    if (!record || record.type !== "RESET_PASSWORD" || record.usedAt || record.expiresAt < new Date()) {
      return json({ error: "This reset link is invalid or has expired." }, 400);
    }
    await prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash: await hashPassword(password) },
    });
    await prisma.emailToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });
    await prisma.session.deleteMany({ where: { userId: record.userId } });
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
