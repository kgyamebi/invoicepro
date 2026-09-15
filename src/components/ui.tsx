import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes } from "react";

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger" }) {
  const variants = {
    primary: "bg-accent text-white hover:bg-accent-hover",
    secondary: "bg-white text-ink border border-line hover:bg-accent-soft",
    ghost: "bg-transparent text-ink hover:bg-accent-soft",
    danger: "bg-danger text-white hover:opacity-90",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-accent",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-accent",
        className,
      )}
      {...props}
    />
  );
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("rounded-2xl border border-line bg-surface p-5 shadow-[0_1px_2px_rgba(18,20,26,0.04)]", className)}>{children}</div>;
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm text-muted">{label}</span>
      {children}
    </label>
  );
}

export function EmptyState({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <Card className="text-center py-14">
      <p className="text-lg font-medium">{title}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </Card>
  );
}

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "success" | "warning" | "danger" }) {
  const map = {
    neutral: "bg-accent-soft text-accent",
    success: "bg-green-50 text-success",
    warning: "bg-amber-50 text-warning",
    danger: "bg-red-50 text-danger",
  };
  return <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize", map[tone])}>{children}</span>;
}

export function statusTone(status: string): "neutral" | "success" | "warning" | "danger" {
  if (["paid", "accepted", "issued"].includes(status)) return "success";
  if (["overdue", "rejected", "cancelled"].includes(status)) return "danger";
  if (["partially_paid", "sent", "viewed", "expired"].includes(status)) return "warning";
  return "neutral";
}
