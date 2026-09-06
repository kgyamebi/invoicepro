import { getSessionUser } from "@/server/auth";
import { json } from "@/server/http";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return json({ user: null }, 401);
  const membership = user.memberships[0];
  const businesses = membership?.organization.businesses.filter((item) => !item.deletedAt) ?? [];
  return json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      countryCode: user.countryCode,
    },
    organization: membership
      ? {
          id: membership.organization.id,
          name: membership.organization.name,
          role: membership.role,
          plan: membership.organization.subscription?.plan.key ?? "free",
        }
      : null,
    businesses: businesses.map((item) => ({
      id: item.id,
      name: item.name,
      currencyCode: item.currencyCode,
      countryCode: item.countryCode,
      isDefault: item.isDefault,
    })),
    googleEnabled: Boolean(process.env.GOOGLE_CLIENT_ID),
  });
}
