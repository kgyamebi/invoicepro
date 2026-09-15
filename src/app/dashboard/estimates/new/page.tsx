import { DocumentEditor } from "@/components/document-editor";

export default function NewEstimatePage() {
  return (
    <div>
      <h1 className="mb-4 text-3xl font-semibold">Create estimate</h1>
      <DocumentEditor type="ESTIMATE" />
    </div>
  );
}
