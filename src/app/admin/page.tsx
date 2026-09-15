import { redirect } from "next/navigation";
import { Card } from "@/components/ui";
import { requireUser } from "@/server/auth";
import { prisma } from "@/server/db";

export default async function AdminPage() {
  const user = await requireUser().catch(() => null);
  if (!user) redirect("/login");
  if (user.role !== "SUPER_ADMIN") redirect("/dashboard");
  const [users, businesses, documents, subscriptions] = await Promise.all([
    prisma.user.count(),
    prisma.business.count(),
    prisma.document.count(),
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
  ]);
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 space-y-4">
      <h1 className="text-3xl font-semibold">Admin</h1>
      <div className="grid gap-3 md:grid-cols-4">
        <Card><p className="text-sm text-muted">Users</p><p className="text-2xl">{users}</p></Card>
        <Card><p className="text-sm text-muted">Businesses</p><p className="text-2xl">{businesses}</p></Card>
        <Card><p className="text-sm text-muted">Documents</p><p className="text-2xl">{documents}</p></Card>
        <Card><p className="text-sm text-muted">Active subscriptions</p><p className="text-2xl">{subscriptions}</p></Card>
      </div>
    </div>
  );
}
