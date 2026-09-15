import { Card } from "@/components/ui";
import { TEMPLATES } from "@/lib/documents/types";

export default function TemplatesPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold">Templates</h1>
      <div className="grid gap-3 md:grid-cols-3">
        {TEMPLATES.map((template) => (
          <Card key={template.key}>
            <p className="font-medium">{template.name}</p>
            <p className="mt-1 text-sm text-muted">Available on documents. Layout stays PDF-safe.</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
