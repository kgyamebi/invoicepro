import { Document, Image, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { labelForDocumentType, type DocumentTypeKey } from "@/lib/documents/types";
import {
  compactAddress,
  formatPdfMoney,
  formatPdfQuantity,
  isZeroMoney,
  pdfKind,
  pdfStatusColors,
  pdfStatusText,
  pdfTheme,
} from "@/lib/pdf/theme";

export type PdfDocument = {
  type: DocumentTypeKey;
  number: string;
  status: string;
  issueDate: string;
  dueDate?: string | null;
  expiryDate?: string | null;
  currencyCode: string;
  notes?: string | null;
  terms?: string | null;
  paymentTerms?: string | null;
  subtotal: string;
  taxTotal: string;
  shippingAmount: string;
  documentDiscountAmount: string;
  otherChargesAmount?: string;
  grandTotal: string;
  amountPaid: string;
  balanceDue: string;
  templateKey: string;
  footerText?: string | null;
  customer?: {
    name: string;
    company?: string | null;
    email?: string | null;
    phone?: string | null;
    addressLine1?: string | null;
    city?: string | null;
    countryCode?: string | null;
  } | null;
  business: {
    name: string;
    email?: string | null;
    phone?: string | null;
    addressLine1?: string | null;
    city?: string | null;
    countryCode?: string;
    taxId?: string | null;
    website?: string | null;
    paymentInstructions?: string | null;
    logoPath?: string | null;
  };
  items: {
    name: string;
    description?: string | null;
    category?: string | null;
    quantity: string;
    unit: string;
    unitPrice: string;
    lineTotal: string;
    discountAmount?: string | null;
  }[];
  sellerPayMethods?: {
    label: string;
    accountName?: string | null;
    accountNumber?: string | null;
    bankName?: string | null;
    provider?: string | null;
    instructions?: string | null;
    displayOnDocuments: boolean;
  }[];
  pageSize?: "A4" | "LETTER";
  platformBrand?: string | null;
};

const layout = StyleSheet.create({
  page: {
    fontSize: 9.5,
    fontFamily: "Helvetica",
    color: "#0A2540",
    backgroundColor: "#FFFFFF",
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 24 },
  logo: { width: 58, height: 58, marginBottom: 10, objectFit: "contain" },
  businessName: { fontSize: 16, fontFamily: "Helvetica-Bold", letterSpacing: 0.12, maxWidth: 280 },
  muted: { color: "#697386", marginTop: 2.5, fontSize: 8.5, lineHeight: 1.35 },
  kicker: {
    fontSize: 8,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    textAlign: "right",
    fontFamily: "Helvetica-Bold",
  },
  number: { fontSize: 22, fontFamily: "Helvetica-Bold", textAlign: "right", marginTop: 4, letterSpacing: -0.35 },
  pill: {
    marginTop: 8,
    alignSelf: "flex-end",
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 11,
    fontSize: 8,
    letterSpacing: 0.7,
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
  },
  meta: { flexDirection: "row", borderWidth: 1, borderColor: "#E6EBF1", borderRadius: 6, overflow: "hidden" },
  metaCell: { flex: 1, paddingVertical: 8, paddingHorizontal: 12, borderRightWidth: 1, borderRightColor: "#E6EBF1" },
  metaCellLast: { flex: 1, paddingVertical: 8, paddingHorizontal: 12 },
  metaLabel: {
    fontSize: 7.5,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    color: "#697386",
    fontFamily: "Helvetica-Bold",
  },
  metaValue: { marginTop: 3, fontSize: 10, fontFamily: "Helvetica-Bold" },
  parties: { flexDirection: "row", gap: 16 },
  party: { flex: 1, padding: 12, borderWidth: 1, borderColor: "#E6EBF1", borderRadius: 6 },
  partyLabel: {
    fontSize: 7.5,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    color: "#697386",
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
  },
  partyName: { fontSize: 11, fontFamily: "Helvetica-Bold" },
  tableHead: { flexDirection: "row", paddingVertical: 8, paddingHorizontal: 10 },
  tableRow: { flexDirection: "row", paddingVertical: 8, paddingHorizontal: 10, borderBottomWidth: 0.75, borderBottomColor: "#E6EBF1" },
  colDesc: { width: "44%" },
  colQty: { width: "14%", textAlign: "right" },
  colPrice: { width: "21%", textAlign: "right" },
  colTotal: { width: "21%", textAlign: "right" },
  headText: { fontSize: 7.5, letterSpacing: 0.9, textTransform: "uppercase", fontFamily: "Helvetica-Bold" },
  itemName: { fontSize: 9.5, fontFamily: "Helvetica-Bold" },
  summaryWrap: { marginTop: 14, flexDirection: "row", gap: 16, alignItems: "flex-start" },
  hero: { flex: 1, padding: 14, borderRadius: 7 },
  heroLabel: { fontSize: 8, letterSpacing: 1.3, textTransform: "uppercase", fontFamily: "Helvetica-Bold" },
  heroAmount: { marginTop: 6, fontSize: 20, fontFamily: "Helvetica-Bold", letterSpacing: -0.4 },
  heroHint: { marginTop: 5, fontSize: 8.5 },
  totals: { width: 248 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3.5 },
  grandRow: { flexDirection: "row", justifyContent: "space-between", paddingTop: 8, marginTop: 5, borderTopWidth: 1.5 },
  section: { marginTop: 12 },
  notesRow: { marginTop: 12, flexDirection: "row", gap: 16 },
  sectionTitle: {
    fontSize: 8,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
    color: "#697386",
    marginBottom: 6,
  },
  body: { fontSize: 9, lineHeight: 1.45, color: "#1A3352" },
  payCard: { marginTop: 6, padding: 10, borderWidth: 1, borderColor: "#E6EBF1", borderRadius: 6 },
  payLabel: { fontSize: 9.5, fontFamily: "Helvetica-Bold" },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 22,
    color: "#697386",
    fontSize: 8,
    borderTopWidth: 0.75,
    borderTopColor: "#E6EBF1",
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

function PdfDoc({ data }: { data: PdfDocument }) {
  const theme = pdfTheme(data.templateKey);
  const kind = pdfKind(data.type);
  const money = (value: string) => formatPdfMoney(value, data.currencyCode);
  const status = pdfStatusColors(data.status, theme);
  const paidInFull =
    kind === "receipt" || (kind === "invoice" && isZeroMoney(data.balanceDue) && !isZeroMoney(data.amountPaid));
  const pad = theme.pagePadding;
  const sellerFrom = compactAddress([
    data.business.addressLine1,
    data.business.city,
    data.business.countryCode,
    data.business.phone,
    data.business.email,
    data.business.website,
    data.business.taxId ? `Tax ID ${data.business.taxId}` : null,
  ]);
  const billTo = compactAddress([
    data.customer?.company && data.customer?.name ? data.customer.name : null,
    data.customer?.addressLine1,
    data.customer?.city,
    data.customer?.countryCode,
    data.customer?.email,
    data.customer?.phone,
  ]);
  const payMethods = (data.sellerPayMethods || []).filter((method) => method.displayOnDocuments);
  const heroLabel = kind === "receipt" || paidInFull ? "Amount received" : kind === "invoice" ? "Amount due" : "Total";
  const heroValue =
    kind === "receipt" || paidInFull
      ? data.amountPaid && !isZeroMoney(data.amountPaid)
        ? data.amountPaid
        : data.grandTotal
      : kind === "invoice"
        ? data.balanceDue
        : data.grandTotal;
  const heroHint =
    kind === "receipt" || paidInFull
      ? "Paid in full — thank you"
      : data.dueDate
        ? `Due ${data.dueDate}`
        : data.expiryDate
          ? `Valid until ${data.expiryDate}`
          : null;
  const metaMid =
    kind === "invoice"
      ? { label: "Due", value: data.dueDate || "—" }
      : kind === "quote"
        ? { label: "Valid until", value: data.expiryDate || "—" }
        : { label: "Receipt date", value: data.issueDate || "—" };

  return (
    <Document
      title={`${labelForDocumentType(data.type)} ${data.number}`}
      author={data.business.name}
      subject={`${labelForDocumentType(data.type)} ${data.number} for ${data.customer?.company || data.customer?.name || "customer"}`}
      creator="InvoiceFlow"
      producer="InvoiceFlow"
    >
      <Page
        size={data.pageSize || "A4"}
        style={[
          layout.page,
          {
            paddingTop: pad,
            paddingHorizontal: theme.leftRail ? pad + 10 : pad,
            paddingBottom: 62,
            fontSize: theme.compact ? 9 : 9.5,
          },
        ]}
        wrap
      >
        <View style={[layout.footer, { left: theme.leftRail ? pad + 10 : pad, right: pad }]} fixed>
          <Text>
            {data.footerText || data.platformBrand || data.business.name}
            {data.business.taxId ? `  ·  Tax ID ${data.business.taxId}` : ""}
          </Text>
          <Text render={({ pageNumber, totalPages }) => `${data.number}  ·  Page ${pageNumber} of ${totalPages}`} />
        </View>
        {theme.leftRail ? (
          <View
            style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 8, backgroundColor: theme.accent }}
            fixed
          />
        ) : null}

        {kind === "receipt" || paidInFull ? (
          <View
            style={{
              position: "absolute",
              top: 210,
              right: 36,
              opacity: 0.08,
              transform: "rotate(-16deg)",
            }}
            fixed
          >
            <Text style={{ fontSize: 54, fontFamily: "Helvetica-Bold", color: theme.success, letterSpacing: 6 }}>PAID</Text>
          </View>
        ) : null}

        <View style={layout.header}>
          <View>
            {data.business.logoPath ? <Image src={data.business.logoPath} style={layout.logo} /> : null}
            <Text style={[layout.businessName, { color: theme.ink }]}>{data.business.name}</Text>
            {sellerFrom.map((line) => (
              <Text key={line} style={layout.muted}>
                {line}
              </Text>
            ))}
          </View>
          <View>
            <Text style={[layout.kicker, { color: theme.accent }]}>{labelForDocumentType(data.type)}</Text>
            <Text style={[layout.number, { color: theme.ink }]}>{data.number}</Text>
            <Text style={[layout.pill, { backgroundColor: status.bg, color: status.fg }]}>{pdfStatusText(data.status)}</Text>
          </View>
        </View>

        {theme.ruleHeight > 0 ? (
          <View style={{ marginTop: 14, marginBottom: 14, height: theme.ruleHeight, backgroundColor: theme.accent }} />
        ) : (
          <View style={{ marginTop: 14, marginBottom: 14 }} />
        )}

        <View style={layout.meta}>
          <View style={layout.metaCell}>
            <Text style={layout.metaLabel}>Issued</Text>
            <Text style={layout.metaValue}>{data.issueDate || "—"}</Text>
          </View>
          <View style={layout.metaCell}>
            <Text style={layout.metaLabel}>{metaMid.label}</Text>
            <Text style={layout.metaValue}>{metaMid.value}</Text>
          </View>
          <View style={layout.metaCellLast}>
            <Text style={layout.metaLabel}>Currency</Text>
            <Text style={layout.metaValue}>{data.currencyCode}</Text>
          </View>
        </View>

        <View style={[layout.parties, { marginTop: theme.compact ? 10 : 14 }]}>
          <View style={[layout.party, { backgroundColor: theme.partyFill ? theme.surface : "#FFFFFF" }]}>
            <Text style={layout.partyLabel}>From</Text>
            <Text style={layout.partyName}>{data.business.name}</Text>
            {data.business.email ? <Text style={layout.muted}>{data.business.email}</Text> : null}
            {data.business.phone ? <Text style={layout.muted}>{data.business.phone}</Text> : null}
          </View>
          <View style={[layout.party, { backgroundColor: theme.partyFill ? theme.surface : "#FFFFFF" }]}>
            <Text style={layout.partyLabel}>{kind === "receipt" ? "Received from" : "Bill to"}</Text>
            <Text style={layout.partyName}>{data.customer?.company || data.customer?.name || "Customer"}</Text>
            {billTo.map((line) => (
              <Text key={line} style={layout.muted}>
                {line}
              </Text>
            ))}
          </View>
        </View>

        <View
          style={[
            layout.tableHead,
            {
              marginTop: theme.compact ? 12 : 16,
              backgroundColor: theme.filledTableHeader ? theme.tableHeader : theme.accentSoft,
              color: theme.filledTableHeader ? "#FFFFFF" : theme.ink,
            },
          ]}
        >
          <Text style={[layout.colDesc, layout.headText]}>Description</Text>
          <Text style={[layout.colQty, layout.headText]}>Qty</Text>
          <Text style={[layout.colPrice, layout.headText]}>Unit price</Text>
          <Text style={[layout.colTotal, layout.headText]}>Amount</Text>
        </View>
        {data.items.map((item, index) => (
          <View
            key={`${item.name}-${index}`}
            style={[layout.tableRow, { backgroundColor: index % 2 === 1 ? theme.surface : "#FFFFFF" }]}
            wrap={false}
          >
            <View style={layout.colDesc}>
              <Text style={layout.itemName}>{item.category ? `${item.category} · ${item.name}` : item.name}</Text>
              {item.description ? <Text style={layout.muted}>{item.description}</Text> : null}
              {item.discountAmount && !isZeroMoney(item.discountAmount) ? (
                <Text style={layout.muted}>Line discount {money(item.discountAmount)}</Text>
              ) : null}
            </View>
            <Text style={layout.colQty}>{formatPdfQuantity(item.quantity, item.unit)}</Text>
            <Text style={layout.colPrice}>{money(item.unitPrice)}</Text>
            <Text style={[layout.colTotal, { fontFamily: "Helvetica-Bold" }]}>{money(item.lineTotal)}</Text>
          </View>
        ))}

        <View style={layout.summaryWrap} wrap={false}>
          <View
            style={[
              layout.hero,
              {
                backgroundColor: paidInFull ? theme.successSoft : theme.accentSoft,
                borderWidth: 1,
                borderColor: paidInFull ? theme.success : theme.accent,
              },
            ]}
          >
            <Text style={[layout.heroLabel, { color: paidInFull ? theme.success : theme.accent }]}>{heroLabel}</Text>
            <Text style={[layout.heroAmount, { color: paidInFull ? theme.success : theme.ink }]}>{money(heroValue)}</Text>
            {heroHint ? (
              <Text style={[layout.heroHint, { color: paidInFull ? theme.success : theme.muted }]}>{heroHint}</Text>
            ) : null}
          </View>
          <View style={layout.totals}>
            <View style={layout.totalRow}>
              <Text>Subtotal</Text>
              <Text>{money(data.subtotal)}</Text>
            </View>
            {!isZeroMoney(data.documentDiscountAmount) ? (
              <View style={layout.totalRow}>
                <Text>Discount</Text>
                <Text>-{money(data.documentDiscountAmount)}</Text>
              </View>
            ) : null}
            {!isZeroMoney(data.taxTotal) ? (
              <View style={layout.totalRow}>
                <Text>Tax</Text>
                <Text>{money(data.taxTotal)}</Text>
              </View>
            ) : null}
            {!isZeroMoney(data.shippingAmount) ? (
              <View style={layout.totalRow}>
                <Text>Delivery</Text>
                <Text>{money(data.shippingAmount)}</Text>
              </View>
            ) : null}
            {data.otherChargesAmount && !isZeroMoney(data.otherChargesAmount) ? (
              <View style={layout.totalRow}>
                <Text>Other charges</Text>
                <Text>{money(data.otherChargesAmount)}</Text>
              </View>
            ) : null}
            <View style={[layout.grandRow, { borderTopColor: theme.accent }]}>
              <Text style={{ fontFamily: "Helvetica-Bold" }}>Total</Text>
              <Text style={{ fontFamily: "Helvetica-Bold" }}>{money(data.grandTotal)}</Text>
            </View>
            {kind === "invoice" || kind === "receipt" ? (
              <>
                <View style={layout.totalRow}>
                  <Text>Amount paid</Text>
                  <Text>{money(data.amountPaid)}</Text>
                </View>
                {!paidInFull ? (
                  <View style={layout.totalRow}>
                    <Text style={{ fontFamily: "Helvetica-Bold" }}>Balance due</Text>
                    <Text style={{ fontFamily: "Helvetica-Bold" }}>{money(data.balanceDue)}</Text>
                  </View>
                ) : null}
              </>
            ) : null}
          </View>
        </View>

        {kind === "invoice" && !paidInFull ? (
          <View style={layout.section}>
            <Text style={layout.sectionTitle}>How to pay</Text>
            {data.paymentTerms ? <Text style={layout.body}>Payment terms: {data.paymentTerms}</Text> : null}
            {payMethods.map((method) => (
              <View key={method.label} style={layout.payCard} wrap={false}>
                <Text style={layout.payLabel}>{method.label}</Text>
                {method.bankName ? <Text style={layout.muted}>{method.bankName}</Text> : null}
                {method.provider ? <Text style={layout.muted}>{method.provider}</Text> : null}
                {method.accountName ? <Text style={layout.body}>{method.accountName}</Text> : null}
                {method.accountNumber ? <Text style={layout.body}>{method.accountNumber}</Text> : null}
                {method.instructions ? <Text style={layout.muted}>{method.instructions}</Text> : null}
              </View>
            ))}
            {data.business.paymentInstructions ? (
              <Text style={[layout.body, { marginTop: 8 }]}>{data.business.paymentInstructions}</Text>
            ) : null}
            {!data.paymentTerms && !payMethods.length && !data.business.paymentInstructions ? (
              <Text style={layout.body}>
                Pay the seller by cash, bank transfer, or mobile money. They will record the payment and issue a receipt.
              </Text>
            ) : null}
          </View>
        ) : null}

        {kind === "receipt" ? (
          <View style={layout.section} wrap={false}>
            <Text style={layout.sectionTitle}>Acknowledgement</Text>
            <Text style={layout.body}>
              This receipt confirms payment of {money(data.amountPaid && !isZeroMoney(data.amountPaid) ? data.amountPaid : data.grandTotal)} toward {data.number}. Keep it for your records.
            </Text>
          </View>
        ) : null}

        {data.notes || data.terms ? (
          <View style={layout.notesRow}>
            {data.notes ? (
              <View style={{ flex: 1 }}>
                <Text style={layout.sectionTitle}>Notes</Text>
                <Text style={layout.body}>{data.notes}</Text>
              </View>
            ) : null}
            {data.terms ? (
              <View style={{ flex: 1 }}>
                <Text style={layout.sectionTitle}>Terms</Text>
                <Text style={layout.body}>{data.terms}</Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </Page>
    </Document>
  );
}

export async function renderDocumentPdf(data: PdfDocument) {
  return renderToBuffer(<PdfDoc data={data} />);
}
