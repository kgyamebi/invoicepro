/** Online checkout is intentionally off. Invoicing still records cash, bank, and mobile money. */
export function paymentsHeld(env: NodeJS.ProcessEnv = process.env) {
  return env.PAYMENTS_REQUIRED === "false";
}

export const CHECKOUT_HELD_MESSAGE =
  "Online checkout is not available. Pay the seller directly; they will record the payment and issue a receipt.";
