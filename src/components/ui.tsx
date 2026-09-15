import Link from "next/link";
import { cn } from "@/lib/utils";
import { statusLabel, statusTone } from "@/lib/documents/status-label";
import type { ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export { statusLabel, statusTone };

const fieldControl =
  "w-full min-h-11 rounded-[10px] border border-line bg-white px-3.5 py-2.5 text-sm text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] outline-none transition placeholder:text-muted/65 focus:border-accent focus:ring-4 focus:ring-accent/15";

export function Button({
  className,
  variant = "primary",
  href,
  target,
  rel,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  href?: string;
  target?: string;
  rel?: string;
}) {
  const variants = {
    primary: "bg-accent text-white shadow-[var(--shadow-xs)] hover:bg-accent-hover active:translate-y-px",
    secondary: "bg-white text-ink border border-line hover:bg-accent-soft/70 hover:border-line-strong",
    ghost: "bg-transparent text-ink-soft hover:bg-bg-elevated hover:text-ink",
    danger: "bg-danger text-white hover:opacity-92",
  };
  const classes = cn(
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] px-4 py-2.5 text-sm font-medium transition duration-150 disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    className,
  );
  if (href) {
    if (props.disabled) {
      return <span className={cn(classes, "pointer-events-none opacity-50")}>{props.children}</span>;
    }
    const isAppPath = href.startsWith("/") && !href.startsWith("//") && !href.startsWith("/api/");
    if (isAppPath) {
      return (
        <Link href={href} className={classes} target={target} rel={rel}>
          {props.children}
        </Link>
      );
    }
    return (
      <a href={href} className={classes} target={target} rel={rel || (target === "_blank" ? "noreferrer" : undefined)}>
        {props.children}
      </a>
    );
  }
  return <button className={classes} {...props} />;
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldControl, className)} {...props} />;
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(fieldControl, "appearance-none pr-8", className)} {...props}>
      {children}
    </select>
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldControl, "min-h-24", className)} {...props} />;
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-[14px] border border-line bg-surface p-5 shadow-[var(--shadow-xs)]", className)}>
      {children}
    </div>
  );
}

export function Field({
  label,
  children,
  hint,
  error,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  error?: string;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[13px] font-medium text-ink-soft">{label}</span>
      {children}
      {hint && !error ? <span className="block text-xs leading-5 text-muted">{hint}</span> : null}
      {error ? (
        <span className="block text-xs text-danger" role="alert">
          {error}
        </span>
      ) : null}
    </label>
  );
}

export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="space-y-4">
      <div>
        <p className="text-sm font-semibold tracking-tight">{title}</p>
        {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
      </div>
      {children}
    </Card>
  );
}

const emptyIcons = {
  list: (
    <path d="M5 7h14M5 12h10M5 17h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  ),
  users: (
    <>
      <path d="M16 19v-1a3 3 0 0 0-3-3H7a3 3 0 0 0-3 3v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="10" cy="8" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M19 19v-1a3 3 0 0 0-2-2.83" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M15.5 5.08A3 3 0 0 1 15.5 10.9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),
  box: (
    <path
      d="M12 3 4 7.5v9L12 21l8-4.5v-9L12 3Zm0 9 8-4.5M12 12v9M12 12 4 7.5"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
  ),
  card: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3 10h18" stroke="currentColor" strokeWidth="1.8" />
    </>
  ),
};

export function EmptyState({
  title,
  description,
  action,
  actionHref,
  actionLabel,
  icon = "list",
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  actionHref?: string;
  actionLabel?: string;
  icon?: keyof typeof emptyIcons;
}) {
  const cta = action ?? (actionHref && actionLabel ? <Button href={actionHref}>{actionLabel}</Button> : null);
  return (
    <Card className="py-14 text-center md:py-16">
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-accent shadow-[var(--shadow-xs)]">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          {emptyIcons[icon]}
        </svg>
      </div>
      <p className="text-lg font-semibold tracking-tight">{title}</p>
      {description ? <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">{description}</p> : null}
      {cta ? <div className="mt-6 flex justify-center">{cta}</div> : null}
    </Card>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger";
}) {
  const map = {
    neutral: "bg-accent-soft text-accent",
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
    danger: "bg-danger-soft text-danger",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.05em]",
        map[tone],
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

/** Instantly recognizable invoice payment statuses */
export function PaymentStatusBadge({ status }: { status: string }) {
  const value = status.toLowerCase();
  const tip =
    value === "paid"
      ? "Balance cleared — payment recorded or settled"
      : value === "partially_paid"
        ? "Customer has paid part of the balance"
        : value === "overdue"
          ? "Due date passed with an unpaid balance"
          : value === "draft"
            ? "Not yet shared with the customer"
            : "Invoice still has an unpaid balance";
  const badge =
    value === "paid" ? (
      <Badge tone="success">Paid</Badge>
    ) : value === "partially_paid" ? (
      <Badge tone="warning">Partially paid</Badge>
    ) : value === "overdue" ? (
      <Badge tone="danger">Overdue</Badge>
    ) : ["cancelled", "rejected"].includes(value) ? (
      <Badge tone="danger">{statusLabel(status)}</Badge>
    ) : (
      <Badge tone={statusTone(status)}>{statusLabel(status)}</Badge>
    );
  return <span title={tip}>{badge}</span>;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">{eyebrow}</p>
        ) : null}
        <h1 className="mt-1 text-[1.75rem] font-semibold tracking-tight text-ink md:text-[2rem]">{title}</h1>
        {description ? <div className="mt-1.5 max-w-2xl text-sm leading-6 text-muted">{description}</div> : null}
      </div>
      {actions ? <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:shrink-0 sm:justify-end">{actions}</div> : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "neutral",
  delta,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "success" | "warning" | "danger";
  delta?: string;
}) {
  const accent = {
    neutral: "from-accent/[0.07]",
    success: "from-success/[0.1]",
    warning: "from-warning/[0.1]",
    danger: "from-danger/[0.1]",
  };
  return (
    <Card className={cn("relative overflow-hidden bg-gradient-to-br to-white p-5", accent[tone])}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{label}</p>
        {delta ? <span className="text-[11px] font-medium text-muted">{delta}</span> : null}
      </div>
      <p className="mt-3 text-[1.65rem] font-semibold tracking-tight tabular-nums md:text-[1.75rem]">{value}</p>
      {hint ? <p className="mt-2 text-xs leading-5 text-muted">{hint}</p> : null}
    </Card>
  );
}

export function MoneyRow({ label, value, emphasize }: { label: string; value: string; emphasize?: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-6 text-sm",
        emphasize && "border-t border-line pt-3 text-base font-semibold",
      )}
    >
      <span className={emphasize ? "text-ink" : "text-muted"}>{label}</span>
      <span className="money tabular-nums">{value}</span>
    </div>
  );
}

export function FinancialSummary({
  title = "Financial summary",
  rows,
  totalLabel = "Total",
  totalValue,
  footer,
}: {
  title?: string;
  rows: { label: string; value: string }[];
  totalLabel?: string;
  totalValue: string;
  footer?: React.ReactNode;
}) {
  return (
    <Card className="bg-gradient-to-br from-accent-soft/80 via-white to-white">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{title}</p>
      <div className="mt-4 space-y-3">
        {rows.map((row) => (
          <MoneyRow key={row.label} label={row.label} value={row.value} />
        ))}
        <MoneyRow label={totalLabel} value={totalValue} emphasize />
      </div>
      {footer ? <div className="mt-5">{footer}</div> : null}
    </Card>
  );
}

export function Banner({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "success" | "danger" | "warning";
}) {
  const map = {
    neutral: "bg-accent-soft text-accent",
    success: "bg-success-soft text-success",
    danger: "bg-danger-soft text-danger",
    warning: "bg-warning-soft text-warning",
  };
  return (
    <div
      role={tone === "danger" ? "alert" : tone === "success" ? "status" : undefined}
      className={cn("rounded-[10px] px-3.5 py-2.5 text-sm leading-5", map[tone])}
    >
      {children}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-[10px] bg-line/80", className)} />;
}

export function FilterChip({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-h-11 rounded-full border px-3.5 py-2 text-xs font-medium transition md:min-h-0 md:py-1.5",
        active
          ? "border-accent bg-accent text-white"
          : "border-line bg-white text-muted hover:border-line-strong hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}
