import { inflateSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { renderDocumentPdf } from "@/lib/pdf/render";
import {
  compactAddress,
  formatPdfMoney,
  formatPdfQuantity,
  isZeroMoney,
  pdfFilename,
  pdfKind,
  pdfStatusText,
  pdfTheme,
} from "@/lib/pdf/theme";

function pdfPlaintext(buffer: Uint8Array) {
  const raw = Buffer.from(buffer).toString("latin1");
  const inflated = [...raw.matchAll(/stream\r?\n([\s\S]*?)\nendstream/g)].map((match) => {
    try {
      return inflateSync(Buffer.from(match[1], "latin1")).toString("latin1");
    } catch {
      return "";
    }
  });
  const content = inflated.join("\n");
  const decoded = [...content.matchAll(/<([0-9A-Fa-f]+)>/g)]
    .map((match) => Buffer.from(match[1], "hex").toString("latin1"))
    .join("");
  return `${raw}\n${decoded}`;
}

function sampleInvoice() {
  return {
    type: "INVOICE" as const,
    number: "INV-1001",
    status: "sent",
    issueDate: "01/09/2026",
    dueDate: "15/09/2026",
    currencyCode: "GHS",
    notes: "Thank you for your business.",
    terms: "Goods remain ours until paid.",
    paymentTerms: "Net 14",
    subtotal: "1000.00",
    taxTotal: "150.00",
    shippingAmount: "0.00",
    documentDiscountAmount: "50.00",
    otherChargesAmount: "0.00",
    grandTotal: "1100.00",
    amountPaid: "0.00",
    balanceDue: "1100.00",
    templateKey: "classic",
    customer: {
      name: "Ama Mensah",
      company: "Harbor Goods",
      email: "ama@example.com",
      phone: "+233200000000",
      addressLine1: "12 Independence Ave",
      city: "Accra",
      countryCode: "GH",
    },
    business: {
      name: "Northline Studio",
      email: "hello@northline.example",
      phone: "+233111111111",
      addressLine1: "8 Oxford Street",
      city: "Accra",
      countryCode: "GH",
      taxId: "C0001234567",
      website: "https://northline.example",
      paymentInstructions: "Use the invoice number as the transfer reference.",
    },
    items: [
      {
        name: "Brand system",
        description: "Identity, invoice templates, and print specs",
        quantity: "1.00",
        unit: "job",
        unitPrice: "1000.00",
        lineTotal: "1000.00",
      },
    ],
    sellerPayMethods: [
      {
        label: "Bank transfer",
        bankName: "GCB",
        accountName: "Northline Studio",
        accountNumber: "1234567890",
        displayOnDocuments: true,
      },
    ],
  };
}

describe("pdf helpers", () => {
  it("uses ISO currency codes for glyphs Helvetica cannot draw", () => {
    expect(formatPdfMoney("1200.5", "GHS")).toBe("GHS 1,200.50");
    expect(formatPdfMoney("99", "USD")).toBe("$99.00");
  });

  it("formats quantities without trailing zeros on whole numbers", () => {
    expect(formatPdfQuantity("2.00", "pcs")).toBe("2 pcs");
    expect(formatPdfQuantity("1.5", "hrs")).toBe("1.5 hrs");
  });

  it("treats empty money as zero", () => {
    expect(isZeroMoney("0.00")).toBe(true);
    expect(isZeroMoney("0.01")).toBe(false);
  });

  it("varies layout by template", () => {
    expect(pdfTheme("classic").filledTableHeader).toBe(true);
    expect(pdfTheme("minimal").filledTableHeader).toBe(false);
    expect(pdfTheme("modern").leftRail).toBe(true);
    expect(pdfTheme("corporate").accent).toBe("#0A2540");
  });

  it("labels invoice vs receipt and humanizes status", () => {
    expect(pdfKind("INVOICE")).toBe("invoice");
    expect(pdfKind("RECEIPT")).toBe("receipt");
    expect(pdfStatusText("partially_paid")).toBe("Partially paid");
    expect(pdfFilename("INVOICE", "INV-1001")).toBe("invoice-INV-1001.pdf");
  });

  it("compacts address lines", () => {
    expect(compactAddress(["Accra", " ", null, "GH"])).toEqual(["Accra", "GH"]);
  });
});

describe("document pdf renderer", () => {
  it("renders a valid invoice PDF with an amount-due layout", async () => {
    const buffer = await renderDocumentPdf(sampleInvoice());
    const text = pdfPlaintext(buffer);
    const compact = text.replace(/\s+/g, "").toLowerCase();
    expect(text.startsWith("%PDF-")).toBe(true);
    expect(text).toContain("/Count 1");
    expect(text).toContain("INV-1001");
    expect(compact).toContain("amountdue");
    expect(compact).toContain("howtopay");
    expect(compact).toContain("harborgoods");
  });

  it("renders a receipt as paid rather than as an unpaid invoice", async () => {
    const buffer = await renderDocumentPdf({
      ...sampleInvoice(),
      type: "RECEIPT",
      number: "REC-88",
      status: "issued",
      amountPaid: "1100.00",
      balanceDue: "0.00",
      templateKey: "minimal",
    });
    const text = pdfPlaintext(buffer);
    const compact = text.replace(/\s+/g, "").toLowerCase();
    expect(text.startsWith("%PDF-")).toBe(true);
    expect(text).toContain("/Count 1");
    expect(text).toContain("REC-88");
    expect(compact).toContain("amountreceived");
    expect(compact).toContain("acknowledgement");
    expect(compact).not.toContain("howtopay");
  });
});
