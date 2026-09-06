import { slugify } from "@/lib/utils";
import { businessSchema } from "@/lib/validation";
import { requireUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { errorResponse, json } from "@/server/http";

export async function GET() {
  try {
    const user = await requireUser();
    const membership = user.memberships[0];
    if (!membership) return json({ businesses: [] });
    const businesses = await prisma.business.findMany({
      where: { organizationId: membership.organizationId, deletedAt: null },
      orderBy: { createdAt: "asc" },
    });
    return json({ businesses });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const membership = user.memberships[0];
    if (!membership) return json({ error: "Workspace missing." }, 409);
    const body = businessSchema.parse(await request.json());
    const count = await prisma.business.count({
      where: { organizationId: membership.organizationId, deletedAt: null },
    });
    const limit = membership.organization.subscription?.plan.businessLimit ?? 1;
    if (count >= limit) {
      return json({ error: "Upgrade to add another business." }, 402);
    }
    const business = await prisma.business.create({
      data: {
        organizationId: membership.organizationId,
        name: body.name,
        slug: slugify(body.name) || `business-${Date.now()}`,
        countryCode: body.countryCode,
        currencyCode: body.currencyCode,
        businessType: body.businessType,
        phone: body.phone,
        email: body.email || user.email,
        website: body.website,
        addressLine1: body.addressLine1,
        city: body.city,
        region: body.region,
        postalCode: body.postalCode,
        taxId: body.taxId,
        preferredTemplate: body.preferredTemplate || "classic",
        isDefault: count === 0,
        brandSettings: { create: {} },
      },
    });
    return json({ business }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
