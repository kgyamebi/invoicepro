import { DocumentEditor } from "@/components/document-editor";

export default function NewInvoicePage() {
  return (
    <div>
      <h1 className="mb-4 text-3xl font-semibold">Create invoice</h1>
      <DocumentEditor type="INVOICE" />
    </div>
  );
}
