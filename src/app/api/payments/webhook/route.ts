import { POST as billingWebhook } from "../../billing/webhook/[provider]/route";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const provider = url.searchParams.get("provider") || "paystack";
  return billingWebhook(request, { params: Promise.resolve({ provider }) });
}
