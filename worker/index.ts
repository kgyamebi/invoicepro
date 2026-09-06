import { PrismaClient } from "@prisma/client";
import { documentEmail, sendEmail } from "../src/lib/email/service";
import { formatMoney } from "../src/lib/money/currency";
import { getAppUrl } from "../src/lib/utils";

const prisma = new PrismaClient();

async function sendDueReminders() {
  const due = await prisma.reminder.findMany({
    where: { sentAt: null, scheduledFor: { lte: new Date() } },
    include: { document: { include: { customer: true } } },
    take: 50,
  });
  for (const reminder of due) {
    const email = reminder.document.customer?.email;
    if (email && reminder.channel === "EMAIL") {
      const mail = documentEmail({
        customerName: reminder.document.customer?.name || "there",
        documentLabel: reminder.document.type,
        number: reminder.document.number,
        total: formatMoney(reminder.document.grandTotal.toString(), reminder.document.currencyCode),
        viewUrl: `${getAppUrl()}/dashboard/invoices/${reminder.document.id}`,
      });
      await sendEmail({ to: email, ...mail });
    }
    await prisma.reminder.update({ where: { id: reminder.id }, data: { sentAt: new Date() } });
  }
}

async function runRecurring() {
  const due = await prisma.recurringInvoice.findMany({
    where: { status: "ACTIVE", nextRunAt: { lte: new Date() } },
    take: 20,
  });
  for (const item of due) {
    const next = new Date(item.nextRunAt);
    if (item.frequency === "WEEKLY") next.setUTCDate(next.getUTCDate() + 7);
    if (item.frequency === "MONTHLY") next.setUTCMonth(next.getUTCMonth() + 1);
    if (item.frequency === "QUARTERLY") next.setUTCMonth(next.getUTCMonth() + 3);
    if (item.frequency === "YEARLY") next.setUTCFullYear(next.getUTCFullYear() + 1);
    await prisma.recurringInvoice.update({ where: { id: item.id }, data: { nextRunAt: next } });
    await prisma.recurringInvoiceRun.create({
      data: { recurringInvoiceId: item.id, status: "queued" },
    });
  }
}

async function markOverdue() {
  await prisma.document.updateMany({
    where: {
      type: "INVOICE",
      deletedAt: null,
      dueDate: { lt: new Date() },
      status: { in: ["sent", "viewed", "partially_paid"] },
    },
    data: { status: "overdue" },
  });
}

async function tick() {
  await markOverdue();
  await sendDueReminders();
  await runRecurring();
}

if (process.argv.includes("--once")) {
  tick().then(() => prisma.$disconnect());
} else {
  console.info("worker started");
  setInterval(() => {
    tick().catch((error) => console.error(error));
  }, 60_000);
  tick().catch((error) => console.error(error));
}
