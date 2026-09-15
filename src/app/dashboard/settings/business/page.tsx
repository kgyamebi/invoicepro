import { getActiveContext } from "@/server/tenant";
import { SettingsForm } from "./ui";

export default async function BusinessSettingsPage() {
  const context = await getActiveContext();
  return (
    <div>
      <h1 className="mb-4 text-3xl font-semibold">Business settings</h1>
      <SettingsForm business={context.business} />
    </div>
  );
}
