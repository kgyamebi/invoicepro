import { verifyPassword } from "@/lib/auth/crypto";
import { loginSchema } from "@/lib/validation";
import { createSession } from "@/server/auth";
import { prisma } from "@/server/db";
import { clientIp, errorResponse, json, rateLimit } from "@/server/http";

export async function POST(request: Request) {
  try {
    rateLimit(`login:${clientIp(request)}`, 20);
    const body = loginSchema.parse(await request.json());
    const user = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
    if (!user?.passwordHash || user.deletedAt) {
      return json({ error: "Invalid email or password." }, 401);
    }
    const ok = await verifyPassword(body.password, user.passwordHash);
    if (!ok) return json({ error: "Invalid email or password." }, 401);
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), lastLoginIp: clientIp(request) },
    });
    await createSession(user.id, { ip: clientIp(request), userAgent: request.headers.get("user-agent") || undefined });
    const membership = await prisma.organizationMember.findFirst({
      where: { userId: user.id },
      include: { organization: { include: { businesses: { where: { deletedAt: null } } } } },
    });
    return json({
      id: user.id,
      needsOnboarding: !membership?.organization.businesses.length,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
