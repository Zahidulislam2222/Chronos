// Presentation constraints; server validation remains authoritative.
export const formLimits = {
  contactName: 100,
  contactEmail: 100,
  contactSubject: 200,
  contactMessage: 5000,
} as const;

// Provider-owned hosted Checkout origin, fixed as a redirect security boundary.
export const stripeCheckoutOrigin = "https://checkout.stripe.com";
