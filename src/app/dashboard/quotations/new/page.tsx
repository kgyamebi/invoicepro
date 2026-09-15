import { DocumentEditor } from "@/components/document-editor";

export default function NewQuotationPage() {
  return (
    <div>
      <h1 className="mb-4 text-3xl font-semibold">Create quotation</h1>
      <DocumentEditor type="QUOTATION" />
    </div>
  );
}
