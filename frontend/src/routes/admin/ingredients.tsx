import { createFileRoute } from "@tanstack/react-router";
import { AdminIngredientsManagement } from "@/components/admin/AdminIngredientsManagement";

export const Route = createFileRoute("/admin/ingredients")({
  component: AdminIngredientsManagement,
});
