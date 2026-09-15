import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { formatMoney } from "@/lib/money/currency";
import { labelForDocumentType, type DocumentTypeKey } from "@/lib/documents/types";

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
  grandTotal: string;
  amountPaid: string;
  balanceDue: string;
  templateKey: string;
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
  };
  items: {
    name: string;
    description?: string | null;
    category?: string | null;
    quantity: string;
    unit: string;
    unitPrice: string;
    lineTotal: string;
  }[];
  sellerPayMethods?: {
    label: string;
    accountName?: string | null;
    accountNumber?: string | null;
    bankName?: string | null;
    provider?: string | null;
    displayOnDocuments: boolean;
  }[];
};

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: "Helvetica", color: "#12141A" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  brand: { fontSize: 18, fontFamily: "Helvetica-Bold", color: "#0F3D3E" },
  muted: { color: "#5C6370", marginTop: 2 },
  title: { fontSize: 22, fontFamily: "Helvetica-Bold", textAlign: "right" },
  box: { marginTop: 16, padding: 10, border: "1pt solid #E6E4DE" },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#0F3D3E",
    color: "#fff",
    padding: 6,
    marginTop: 20,
  },
  tableRow: { flexDirection: "row", padding: 6, borderBottom: "1pt solid #E6E4DE" },
  colDesc: { width: "40%" },
  colQty: { width: "12%", textAlign: "right" },
  colPrice: { width: "24%", textAlign: "right" },
  colTotal: { width: "24%", textAlign: "right" },
  totals: { marginTop: 16, marginLeft: "50%" },
  footer: { position: "absolute", bottom: 24, left: 36, right: 36, color: "#5C6370", fontSize: 9 },
});

function PdfDoc({ data }: { data: PdfDocument }) {
  const money = (value: string) => formatMoney(value, data.currencyCode);
  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>{data.business.name}</Text>
            {data.business.addressLine1 ? <Text style={styles.muted}>{data.business.addressLine1}</Text> : null}
            {data.business.city ? <Text style={styles.muted}>{data.business.city}</Text> : null}
            {data.business.phone ? <Text style={styles.muted}>{data.business.phone}</Text> : null}
            {data.business.email ? <Text style={styles.muted}>{data.business.email}</Text> : null}
            {data.business.taxId ? <Text style={styles.muted}>Tax ID: {data.business.taxId}</Text> : null}
          </View>
          <View>
            <Text style={styles.title}>{labelForDocumentType(data.type)}</Text>
            <Text style={styles.muted}>{data.number}</Text>
            <Text style={styles.muted}>Date: {data.issueDate}</Text>
            {data.dueDate ? <Text style={styles.muted}>Due: {data.dueDate}</Text> : null}
            {data.expiryDate ? <Text style={styles.muted}>Valid until: {data.expiryDate}</Text> : null}
          </View>
        </View>

        <View style={styles.box}>
          <Text style={{ fontFamily: "Helvetica-Bold" }}>Bill to</Text>
          <Text>{data.customer?.company || data.customer?.name || "Customer"}</Text>
          {data.customer?.name && data.customer?.company ? <Text>{data.customer.name}</Text> : null}
          {data.customer?.addressLine1 ? <Text>{data.customer.addressLine1}</Text> : null}
          {data.customer?.email ? <Text>{data.customer.email}</Text> : null}
          {data.customer?.phone ? <Text>{data.customer.phone}</Text> : null}
        </View>

        <View style={styles.tableHeader} fixed>
          <Text style={styles.colDesc}>Item</Text>
          <Text style={styles.colQty}>Qty</Text>
          <Text style={styles.colPrice}>Price</Text>
          <Text style={styles.colTotal}>Total</Text>
        </View>
        {data.items.map((item, index) => (
          <View key={`${item.name}-${index}`} style={styles.tableRow} wrap={false}>
            <View style={styles.colDesc}>
              <Text>{item.category ? `${item.category}: ${item.name}` : item.name}</Text>
              {item.description ? <Text style={styles.muted}>{item.description}</Text> : null}
            </View>
            <Text style={styles.colQty}>
              {item.quantity} {item.unit}
            </Text>
            <Text style={styles.colPrice}>{money(item.unitPrice)}</Text>
            <Text style={styles.colTotal}>{money(item.lineTotal)}</Text>
          </View>
        ))}

        <View style={styles.totals}>
          <View style={styles.row}>
            <Text>Subtotal</Text>
            <Text>{money(data.subtotal)}</Text>
          </View>
          {Number(data.documentDiscountAmount) > 0 ? (
            <View style={styles.row}>
              <Text>Discount</Text>
              <Text>-{money(data.documentDiscountAmount)}</Text>
            </View>
          ) : null}
          {Number(data.taxTotal) > 0 ? (
            <View style={styles.row}>
              <Text>Tax</Text>
              <Text>{money(data.taxTotal)}</Text>
            </View>
          ) : null}
          {Number(data.shippingAmount) > 0 ? (
            <View style={styles.row}>
              <Text>Delivery</Text>
              <Text>{money(data.shippingAmount)}</Text>
            </View>
          ) : null}
          <View style={styles.row}>
            <Text style={{ fontFamily: "Helvetica-Bold" }}>Total</Text>
            <Text style={{ fontFamily: "Helvetica-Bold" }}>{money(data.grandTotal)}</Text>
          </View>
          {data.type === "INVOICE" || data.type === "RECEIPT" ? (
            <>
              <View style={styles.row}>
                <Text>Paid</Text>
                <Text>{money(data.amountPaid)}</Text>
              </View>
              <View style={styles.row}>
                <Text>Balance due</Text>
                <Text>{money(data.balanceDue)}</Text>
              </View>
            </>
          ) : null}
        </View>

        {data.paymentTerms ? <Text style={{ marginTop: 16 }}>Payment terms: {data.paymentTerms}</Text> : null}
        {data.notes ? <Text style={{ marginTop: 8 }}>{data.notes}</Text> : null}
        {data.terms ? <Text style={{ marginTop: 8 }}>{data.terms}</Text> : null}
        {data.sellerPayMethods
          ?.filter((method) => method.displayOnDocuments)
          .map((method) => (
            <Text key={method.label} style={{ marginTop: 4 }}>
              {method.label}
              {method.bankName ? ` · ${method.bankName}` : ""}
              {method.provider ? ` · ${method.provider}` : ""}
              {method.accountName ? ` · ${method.accountName}` : ""}
              {method.accountNumber ? ` · ${method.accountNumber}` : ""}
            </Text>
          ))}
        {data.business.paymentInstructions ? (
          <Text style={{ marginTop: 8 }}>{data.business.paymentInstructions}</Text>
        ) : null}

        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `${data.business.name} · ${data.number} · Page ${pageNumber} of ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}

export async function renderDocumentPdf(data: PdfDocument) {
  return renderToBuffer(<PdfDoc data={data} />);
}
