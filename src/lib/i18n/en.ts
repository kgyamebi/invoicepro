export const en = {
  app: {
    tagline: "Professional invoices, quotations and receipts — without the expensive software.",
    altTagline: "Create professional business documents in seconds.",
  },
  auth: {
    login: "Log in",
    register: "Create account",
    forgot: "Forgot password",
    reset: "Reset password",
    verify: "Verify email",
  },
  dashboard: {
    title: "Dashboard",
    sales: "Sales",
    paid: "Paid",
    outstanding: "Outstanding",
    overdue: "Overdue",
    quotations: "Quotations",
    accepted: "Accepted",
  },
  empty: {
    invoices: "Create your first invoice in under a minute.",
    customers: "Add your first customer.",
    products: "Add products to speed up invoicing.",
  },
  errors: {
    generic: "Something went wrong. Please try again.",
    pdf: "Something went wrong while generating your PDF. Please try again.",
    payment: "Your payment could not be verified.",
    limit: "You've reached your monthly document limit.",
    forbidden: "You do not have access to this resource.",
  },
};

export type Messages = typeof en;
