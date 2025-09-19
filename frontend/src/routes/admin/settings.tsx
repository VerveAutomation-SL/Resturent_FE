import { createFileRoute } from "@tanstack/react-router";
import { AdminSettings } from "@/components/admin/AdminSettings";

export const Route = createFileRoute("/admin/settings")({
  component: () => (
    <div className="space-y-8">
      <AdminSettings />
    </div>
  ),
});
