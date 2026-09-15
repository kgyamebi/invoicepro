import { getAppName } from "@/lib/utils";

export function Logo({ className = "" }: { className?: string }) {
  const name = getAppName();
  return (
    <span className={`inline-flex items-center gap-2 font-semibold tracking-tight ${className}`}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white text-sm">IF</span>
      {name}
    </span>
  );
}
