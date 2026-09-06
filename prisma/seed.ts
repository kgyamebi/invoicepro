import { PrismaClient } from "@prisma/client";
import { COUNTRIES } from "../src/lib/countries";
import { CURRENCIES } from "../src/lib/money/currency";
import { TEMPLATES } from "../src/lib/documents/types";

const prisma = new PrismaClient();

const plans = [
  {
    key: "free",
    name: "Free",
    description: "10 documents each month with the essentials.",
    sortOrder: 0,
    documentLimit: 10,
    aiLimit: 0,
    userLimit: 1,
    businessLimit: 1,
    features: { whatsapp: false, emailShare: false, reports: false, ai: false, recurring: false, inventory: false, teams: false, multiBusiness: false, api: false },
    prices: [{ currencyCode: "USD", interval: "MONTHLY" as const, amount: "0" }],
  },
  {
    key: "starter",
    name: "Starter",
    description: "100 documents, WhatsApp sharing and custom branding.",
    sortOrder: 1,
    documentLimit: 100,
    aiLimit: 0,
    userLimit: 1,
    businessLimit: 1,
    features: { whatsapp: true, emailShare: true, reports: false, ai: false, recurring: false, inventory: false, teams: false, multiBusiness: false, api: false },
    prices: [
      { currencyCode: "USD", interval: "MONTHLY" as const, amount: "1.99" },
      { currencyCode: "USD", interval: "YEARLY" as const, amount: "19" },
      { currencyCode: "GHS", interval: "MONTHLY" as const, amount: "20" },
    ],
  },
  {
    key: "pro",
    name: "Pro",
    description: "500 documents, AI assistant, reminders and reports.",
    sortOrder: 2,
    documentLimit: 500,
    aiLimit: 100,
    userLimit: 1,
    businessLimit: 1,
    features: { whatsapp: true, emailShare: true, reports: true, ai: true, recurring: true, inventory: true, teams: false, multiBusiness: false, api: false },
    prices: [
      { currencyCode: "USD", interval: "MONTHLY" as const, amount: "3.99" },
      { currencyCode: "USD", interval: "YEARLY" as const, amount: "39" },
      { currencyCode: "GHS", interval: "MONTHLY" as const, amount: "45" },
    ],
  },
  {
    key: "business",
    name: "Business",
    description: "2,000 documents, teams and multiple businesses.",
    sortOrder: 3,
    documentLimit: 2000,
    aiLimit: 400,
    userLimit: 8,
    businessLimit: 5,
    features: { whatsapp: true, emailShare: true, reports: true, ai: true, recurring: true, inventory: true, teams: true, multiBusiness: true, api: false },
    prices: [
      { currencyCode: "USD", interval: "MONTHLY" as const, amount: "7.99" },
      { currencyCode: "USD", interval: "YEARLY" as const, amount: "79" },
      { currencyCode: "GHS", interval: "MONTHLY" as const, amount: "90" },
    ],
  },
  {
    key: "unlimited",
    name: "Unlimited",
    description: "Fair-use unlimited documents, API access and priority processing.",
    sortOrder: 4,
    documentLimit: null,
    fairUseCap: 20000,
    aiLimit: 1000,
    userLimit: 25,
    businessLimit: 20,
    features: { whatsapp: true, emailShare: true, reports: true, ai: true, recurring: true, inventory: true, teams: true, multiBusiness: true, api: true },
    prices: [
      { currencyCode: "USD", interval: "MONTHLY" as const, amount: "12.99" },
      { currencyCode: "USD", interval: "YEARLY" as const, amount: "129" },
    ],
  },
];

const creditPacks = [
  { credits: 100, amount: "9" },
  { credits: 500, amount: "29" },
  { credits: 1000, amount: "49" },
];

const articles = [
  {
    slug: "how-to-create-an-invoice",
    title: "How to Create an Invoice",
    excerpt: "A clear invoice gets you paid faster. Here is a practical structure any small business can use.",
    tags: ["invoices"],
    content:
      "An invoice should tell a customer exactly what they bought, what they owe, and how to pay. Include your business name, customer details, a unique invoice number, the date, a due date, line items with quantities and prices, tax if it applies, and payment instructions. Keep the numbering sequential so you can find documents later. Send the invoice the same day the work is done whenever you can.",
  },
  {
    slug: "how-to-create-a-quotation",
    title: "How to Create a Quotation",
    excerpt: "A quotation is a priced offer. Treat it as a sales document, not a rough guess.",
    tags: ["quotations"],
    content:
      "A quotation should list the proposed work, quantities, unit prices, taxes, delivery, validity date, and terms. Give the customer a clear expiry date so prices do not linger forever. If the customer accepts, convert the same items into an invoice instead of retyping them. That keeps prices consistent and creates a paper trail.",
  },
  {
    slug: "invoice-vs-quotation",
    title: "Invoice vs Quotation",
    excerpt: "One is an offer. The other is a request for payment. Mixing them up causes disputes.",
    tags: ["guides"],
    content:
      "A quotation is sent before work is agreed. It can expire, be accepted, or be rejected. An invoice is sent after you are ready to collect payment. A receipt confirms money already received. Use quotations to win the job, invoices to collect, and receipts to close the loop.",
  },
  {
    slug: "how-to-create-an-invoice-in-ghana",
    title: "How to Create an Invoice in Ghana",
    excerpt: "Ghanaian sellers need clear cedis amounts, Mobile Money details, and a number the customer can reply to on WhatsApp.",
    tags: ["ghana", "invoices"],
    content:
      "Start with your business name and a GH₵ total. Add MTN MoMo or Telecel Cash details only if you actually accept those methods. Include a due date and a WhatsApp number the customer can confirm payment on. If you charge VAT, show the tax name and rate you are registered to collect — do not copy a rate from a blog post.",
  },
  {
    slug: "how-to-invoice-a-customer",
    title: "How to Invoice a Customer",
    excerpt: "The fastest path from finished work to paid work is a short, complete invoice.",
    tags: ["invoices"],
    content:
      "Confirm the customer name, list every item, show the total in their currency, state when payment is due, and tell them how to pay. Then send it on the channel they already use — often WhatsApp or email. Follow up once before the due date and again if it becomes overdue.",
  },
  {
    slug: "how-to-send-an-invoice-on-whatsapp",
    title: "How to Send an Invoice on WhatsApp",
    excerpt: "Most small-business customers will open WhatsApp before they open email.",
    tags: ["whatsapp"],
    content:
      "Create the invoice, generate a secure view link, and send a short message with the document number, total, and due date. Ask the customer to reply with the payment reference. Do not rely on WhatsApp as your only record — keep the invoice in your document history.",
  },
  {
    slug: "how-to-create-a-professional-quotation",
    title: "How to Create a Professional Quotation",
    excerpt: "Professional does not mean complicated. It means complete, priced, and easy to accept.",
    tags: ["quotations"],
    content:
      "Use your logo, a clean item table, and a validity date. Separate materials, labour, and transport if you are in construction. State what is excluded. Add payment terms such as 50% to start and the balance on completion. Then give the customer one-tap accept and reject actions.",
  },
  {
    slug: "how-to-calculate-vat-on-an-invoice",
    title: "How to Calculate VAT on an Invoice",
    excerpt: "VAT is a configured rate, not a guess. Exclusive and inclusive tax are not the same.",
    tags: ["tax"],
    content:
      "If tax is exclusive, add rate × taxable amount. If tax is inclusive, the tax already sits inside the price and must be extracted. Round using your currency rules. Never let a chatbot invent a tax rate — use the rate your business is registered to charge.",
  },
  {
    slug: "how-to-track-unpaid-invoices",
    title: "How to Track Unpaid Invoices",
    excerpt: "Outstanding and overdue are different problems. Track both.",
    tags: ["payments"],
    content:
      "Outstanding is any unpaid balance that is not yet late. Overdue is a balance past the due date. Record partial payments so the remaining balance stays accurate. Remind before the due date, on the due date, and a few days after. Always keep the conversation tied to the invoice number.",
  },
  {
    slug: "how-to-create-construction-quotations",
    title: "How to Create Construction Quotations",
    excerpt: "Construction quotes fail when labour, materials and transport are mixed into one vague line.",
    tags: ["construction"],
    content:
      "Split the quote into materials, labour, equipment, transport and installation. Show quantities for materials such as bags of cement or numbers of fittings. Add a validity date because material prices move. Convert the accepted quotation into an invoice so the site team and the accounts trail stay aligned.",
  },
  {
    slug: "how-to-create-wholesale-invoices",
    title: "How to Create Wholesale Invoices",
    excerpt: "Wholesalers need speed, repeat customers, and product codes more than fancy design.",
    tags: ["wholesale"],
    content:
      "Keep SKUs on every line. Use the product catalogue so prices stay consistent. Duplicate the last invoice for regular buyers and change quantities. Record partial payments common in wholesale relationships and keep a running customer balance.",
  },
  {
    slug: "invoice-numbering-best-practices",
    title: "Invoice Numbering Best Practices",
    excerpt: "Unique numbers prevent disputes and make audits boring — which is the goal.",
    tags: ["invoices"],
    content:
      "Use a prefix, then a padded sequence: INV-000001. Some businesses reset yearly: INV-2026-0001. Never reuse a number, even for a cancelled invoice. Keep quotation and receipt prefixes different so customers can tell documents apart.",
  },
];

async function main() {
  for (const currency of Object.values(CURRENCIES)) {
    await prisma.currency.upsert({
      where: { code: currency.code },
      update: currency,
      create: currency,
    });
  }

  for (const country of COUNTRIES) {
    await prisma.country.upsert({
      where: { code: country.code },
      update: {
        name: country.name,
        defaultCurrency: country.defaultCurrency,
        defaultLocale: country.defaultLocale,
        dateFormat: country.dateFormat,
      },
      create: {
        code: country.code,
        name: country.name,
        defaultCurrency: country.defaultCurrency,
        defaultLocale: country.defaultLocale,
        dateFormat: country.dateFormat,
      },
    });
  }

  for (const template of TEMPLATES) {
    await prisma.documentTemplate.upsert({
      where: { key: template.key },
      update: { name: template.name, isActive: true },
      create: { key: template.key, name: template.name, description: template.name, isSystem: true },
    });
  }

  const flags = [
    ["ai", "AI assistant", false],
    ["inventory", "Inventory tracking", true],
    ["recurring_invoices", "Recurring invoices", true],
    ["reminders", "Payment reminders", true],
    ["teams", "Team accounts", true],
    ["multiple_businesses", "Multiple businesses", true],
    ["api", "Public API", false],
    ["advanced_reports", "Advanced reports", true],
  ] as const;
  for (const [key, description, enabled] of flags) {
    await prisma.featureFlag.upsert({
      where: { key },
      update: { description },
      create: { key, description, enabled },
    });
  }

  await prisma.appSetting.upsert({
    where: { key: "app" },
    update: {},
    create: {
      key: "app",
      value: {
        name: process.env.APP_NAME || "InvoiceFlow",
        primaryColor: "#0F3D3E",
      },
    },
  });

  for (const plan of plans) {
    const saved = await prisma.plan.upsert({
      where: { key: plan.key },
      update: {
        name: plan.name,
        description: plan.description,
        sortOrder: plan.sortOrder,
        documentLimit: plan.documentLimit,
        aiLimit: plan.aiLimit,
        userLimit: plan.userLimit,
        businessLimit: plan.businessLimit,
        fairUseCap: "fairUseCap" in plan ? plan.fairUseCap : null,
        features: plan.features,
      },
      create: {
        key: plan.key,
        name: plan.name,
        description: plan.description,
        sortOrder: plan.sortOrder,
        documentLimit: plan.documentLimit,
        aiLimit: plan.aiLimit,
        userLimit: plan.userLimit,
        businessLimit: plan.businessLimit,
        fairUseCap: "fairUseCap" in plan ? plan.fairUseCap : null,
        features: plan.features,
      },
    });
    for (const price of plan.prices) {
      await prisma.planPrice.upsert({
        where: {
          planId_currencyCode_interval_creditAmount: {
            planId: saved.id,
            currencyCode: price.currencyCode,
            interval: price.interval,
            creditAmount: 0,
          },
        },
        update: { amount: price.amount },
        create: {
          planId: saved.id,
          currencyCode: price.currencyCode,
          interval: price.interval,
          amount: price.amount,
          creditAmount: 0,
        },
      });
    }
  }

  const starter = await prisma.plan.findUniqueOrThrow({ where: { key: "starter" } });
  for (const pack of creditPacks) {
    await prisma.planPrice.upsert({
      where: {
        planId_currencyCode_interval_creditAmount: {
          planId: starter.id,
          currencyCode: "USD",
          interval: "ONE_TIME",
          creditAmount: pack.credits,
        },
      },
      update: { amount: pack.amount },
      create: {
        planId: starter.id,
        currencyCode: "USD",
        interval: "ONE_TIME",
        amount: pack.amount,
        creditAmount: pack.credits,
      },
    });
  }

  const guides = await prisma.blogCategory.upsert({
    where: { slug: "guides" },
    update: {},
    create: { slug: "guides", name: "Guides" },
  });
  for (const article of articles) {
    await prisma.blogArticle.upsert({
      where: { slug: article.slug },
      update: {
        title: article.title,
        excerpt: article.excerpt,
        content: article.content,
        tags: article.tags,
        seoTitle: article.title,
        seoDescription: article.excerpt,
        status: "PUBLISHED",
        publishedAt: new Date(),
        categoryId: guides.id,
      },
      create: {
        slug: article.slug,
        title: article.title,
        excerpt: article.excerpt,
        content: article.content,
        tags: article.tags,
        seoTitle: article.title,
        seoDescription: article.excerpt,
        status: "PUBLISHED",
        publishedAt: new Date(),
        categoryId: guides.id,
      },
    });
  }

  await prisma.paymentProviderConfig.upsert({
    where: { key: "stripe" },
    update: { isEnabled: Boolean(process.env.STRIPE_SECRET_KEY) },
    create: { key: "stripe", isEnabled: Boolean(process.env.STRIPE_SECRET_KEY), countries: ["US", "GB", "CA", "AU", "DE", "FR"], settings: {} },
  });
  await prisma.paymentProviderConfig.upsert({
    where: { key: "paystack" },
    update: { isEnabled: Boolean(process.env.PAYSTACK_SECRET_KEY) },
    create: { key: "paystack", isEnabled: Boolean(process.env.PAYSTACK_SECRET_KEY), countries: ["NG", "GH", "ZA", "KE"], settings: {} },
  });
  await prisma.paymentProviderConfig.upsert({
    where: { key: "flutterwave" },
    update: { isEnabled: Boolean(process.env.FLUTTERWAVE_SECRET_KEY) },
    create: { key: "flutterwave", isEnabled: Boolean(process.env.FLUTTERWAVE_SECRET_KEY), countries: ["NG", "GH", "KE", "ZA"], settings: {} },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
