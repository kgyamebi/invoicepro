import { z } from "zod";
import { hashToken, randomToken } from "@/lib/auth/crypto";
import { authEmail, sendEmail } from "@/lib/email/service";
import { prisma } from "@/server/db";
import { clientIp, errorResponse, json, rateLimit } from "@/server/http";

export async function POST(request: Request) {
  try {
    rateLimit(`forgot:${clientIp(request)}`, 8);
    const { email } = z.object({ email: z.string().email() }).parse(await request.json());
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (user) {
      const token = randomToken(24);
      await prisma.emailToken.create({
        data: {
          userId: user.id,
          type: "RESET_PASSWORD",
          tokenHash: hashToken(token),
          expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
        },
      });
      const mail = authEmail("reset", token);
      await sendEmail({ to: user.email, ...mail });
    }
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
