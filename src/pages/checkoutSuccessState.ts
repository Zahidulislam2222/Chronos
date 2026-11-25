// What the Stripe return page can honestly say. "unpaid" needs the store's own answer;
// being signed out, still loading or a failed check must not read as a failed payment.
export type CheckoutSuccessState = "missing" | "checking" | "signIn" | "unknown" | "paid" | "unpaid";

export interface CheckoutSuccessInput {
  hasSession: boolean;
  authLoading: boolean;
  signedIn: boolean;
  /** The first check is running (no answer yet). Background re-checks do not count. */
  checking: boolean;
  failed: boolean;
  /** The store's answer: `paid` from the verify call, `undefined` before it answers. */
  paid: unknown;
}

export function checkoutSuccessState(input: CheckoutSuccessInput): CheckoutSuccessState {
  if (!input.hasSession) return "missing";
  if (input.authLoading) return "checking";
  if (!input.signedIn) return "signIn";
  if (input.checking) return "checking";
  if (input.failed) return "unknown";
  if (input.paid === true) return "paid";
  if (input.paid === false) return "unpaid";
  return input.paid === undefined ? "checking" : "unknown";
}
