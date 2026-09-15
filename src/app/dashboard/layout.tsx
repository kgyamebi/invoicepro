import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/brand";
import { getSessionUser } from "@/server/auth";

const links = [
  ["Overview", "/dashboard"],
  ["Invoices", "/dashboard/invoices"],
  ["Quotations", "/dashboard/quotations"],
  ["Receipts", "/dashboard/receipts"],
  ["Customers", "/dashboard/customers"],
  ["Products", "/dashboard/products"],
  ["Inventory", "/dashboard/inventory"],
  ["Reports", "/dashboard/reports"],
  ["Reminders", "/dashboard/reminders"],
  ["Templates", "/dashboard/templates"],
  ["Billing", "/dashboard/billing"],
  ["Settings", "/dashboard/settings"],
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const hasBusiness = user.memberships[0]?.organization.businesses.some((item) => !item.deletedAt);
  if (!hasBusiness) redirect("/onboarding");

  return (
    <div className="min-h-screen md:grid md:grid-cols-[240px_1fr]">
      <aside className="border-b border-line bg-white md:border-b-0 md:border-r">
        <div className="flex items-center justify-between px-4 py-4">
          <Link href="/dashboard">
            <Logo />
          </Link>
        </div>
        <nav className="flex gap-2 overflow-x-auto px-3 pb-3 md:block md:space-y-1 md:overflow-visible">
          {links.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="block whitespace-nowrap rounded-lg px-3 py-2 text-sm text-muted hover:bg-accent-soft hover:text-ink"
            >
              {label}
            </Link>
          ))}
        </nav>
        <form action="/api/auth/logout" method="post" className="hidden px-4 pb-6 md:block">
          <button className="text-sm text-muted" formAction={async () => {
            "use server";
            const { destroySession } = await import("@/server/auth");
            await destroySession();
            redirect("/login");
          }}>
            Log out
          </button>
        </form>
      </aside>
      <div className="px-4 py-6 md:px-8">{children}</div>
    </div>
  );
}
