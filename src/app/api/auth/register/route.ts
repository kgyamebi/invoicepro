import { hashPassword, hashToken, randomToken } from "@/lib/auth/crypto";
import { authEmail, sendEmail } from "@/lib/email/service";
import { registerSchema } from "@/lib/validation";
import { createSession } from "@/server/auth";
import { prisma } from "@/server/db";
import { clientIp, errorResponse, json, rateLimit } from "@/server/http";

export async function POST(request: Request) {
  try {
    rateLimit(`register:${clientIp(request)}`, 10);
    const body = registerSchema.parse(await request.json());
    const existing = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
    if (existing) {
      return json({ error: "An account with that email already exists." }, 409);
    }
    const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email.toLowerCase(),
        passwordHash: await hashPassword(body.password),
        countryCode: body.countryCode,
        role: adminEmail && adminEmail === body.email.toLowerCase() ? "SUPER_ADMIN" : "USER",
      },
    });
    const organization = await prisma.organization.create({
      data: {
        name: `${body.name}'s workspace`,
        ownerId: user.id,
        members: { create: { userId: user.id, role: "OWNER" } },
        creditAccount: { create: { balance: 0 } },
      },
    });
    const free = await prisma.plan.findUnique({ where: { key: "free" } });
    if (free) {
      await prisma.subscription.create({
        data: {
          organizationId: organization.id,
          planId: free.id,
          status: "ACTIVE",
          interval: "MONTHLY",
        },
      });
    }
    const verify = randomToken(24);
    await prisma.emailToken.create({
      data: {
        userId: user.id,
        type: "VERIFY_EMAIL",
        tokenHash: hashToken(verify),
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      },
    });
    const mail = authEmail("verify", verify);
    await sendEmail({ to: user.email, ...mail });
    await createSession(user.id, { ip: clientIp(request), userAgent: request.headers.get("user-agent") || undefined });
    return json({ id: user.id, needsOnboarding: true });
  } catch (error) {
    return errorResponse(error);
  }
}
