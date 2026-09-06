import { Card } from "@/components/ui";

export default function RemindersPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold">Reminders</h1>
      <Card>
        <p className="text-sm text-muted">
          Email reminders can run on: 3 days before due, due date, and 3 / 7 / 14 days overdue. The worker sends them
          when Redis is configured. WhatsApp Business API sending is marked coming soon until that integration exists.
        </p>
      </Card>
    </div>
  );
}
