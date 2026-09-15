"use client";

import { Button } from "@/components/ui";
import { useRouter } from "next/navigation";

export function AcceptActions({ token }: { token: string }) {
  const router = useRouter();
  async function act(action: "accept" | "reject") {
    await fetch(`/api/shared/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    router.refresh();
  }
  return (
    <div className="flex gap-2">
      <Button type="button" onClick={() => act("accept")}>
        Accept Quotation
      </Button>
      <Button type="button" variant="secondary" onClick={() => act("reject")}>
        Reject Quotation
      </Button>
    </div>
  );
}
