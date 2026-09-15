const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  sent: "Sent",
  viewed: "Viewed",
  paid: "Paid",
  partially_paid: "Partially paid",
  overdue: "Overdue",
  accepted: "Accepted",
  rejected: "Rejected",
  cancelled: "Cancelled",
  issued: "Issued",
  expired: "Expired",
  pending: "Pending",
  processing: "Processing",
  failed: "Failed",
  queued: "Queued",
  active: "Active",
  paused: "Paused",
};

export function statusTone(status: string): "neutral" | "success" | "warning" | "danger" {
  const value = status.toLowerCase();
  if (["paid", "accepted", "issued"].includes(value)) return "success";
  if (["overdue", "rejected", "cancelled"].includes(value)) return "danger";
  if (["partially_paid", "sent", "viewed", "expired"].includes(value)) return "warning";
  return "neutral";
}

export function statusLabel(status: string) {
  const value = status.trim().toLowerCase();
  if (STATUS_LABELS[value]) return STATUS_LABELS[value];
  return status.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}
