import Link from "next/link";
import { Card, PageHeader } from "@/components/ui";

const workspace = [
  { href: "/dashboard/settings/business", title: "Business profile", detail: "Name, logo, tax ID, currency, and invoice defaults." },
  { href: "/dashboard/settings/team", title: "Team", detail: "Invite staff and set roles." },
  { href: "/dashboard/settings/security", title: "Security", detail: "Password, MFA, and passkeys." },
  { href: "/dashboard/settings/sessions", title: "Sessions", detail: "Signed-in devices." },
];

export default function SettingsIndexPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Business details that appear on quotations, invoices, and receipts." />
      <div className="grid gap-3 md:grid-cols-2">
        {workspace.map((link) => (
          <Link key={link.href} href={link.href} className="block">
            <Card className="h-full transition hover:border-accent/40">
              <p className="font-medium">{link.title}</p>
              <p className="mt-1 text-sm text-muted">{link.detail}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
