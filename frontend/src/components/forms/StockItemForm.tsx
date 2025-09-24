import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { X } from "lucide-react";
import {
  TextInputField,
  NumberInputField,
  SelectField,
  FormSubmitButton,
  unitOptions,
} from "@/components/forms/FormComponents";
// apiClient and mutations are handled by parent component
import { toastHelpers } from "@/lib/toast-helpers";
import { InventoryIngredient } from "@/types";

// Stock item form schema - aligned with Sequelize Ingredient model
const stockItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  unit: z.string().min(1, "Unit is required"),
  // Use z.coerce.number() so string input from number fields is coerced to numbers
  quantity: z.coerce.number().min(0, "Quantity must be 0 or greater"),
  reserved_quantity: z.coerce
    .number()
    .min(0, "Reserved quantity must be 0 or greater"),
  low_stock_threshold: z.coerce
    .number()
    .min(0, "Low stock threshold must be 0 or greater"),
  cost_per_unit: z.coerce.number().min(0, "Cost per unit must be 0 or greater"),
  supplier: z.string().min(1, "Supplier is required"),
  supplier_contact: z.string().min(1, "Supplier contact is required"),
  last_restocked_at: z.string().nullable().optional(),
});

type StockItemFormData = z.infer<typeof stockItemSchema>;

interface StockItemFormProps {
  stockItem?: InventoryIngredient;
  onSuccess?: () => void; // kept for compatibility
  onCancel?: () => void;
  mode?: "create" | "edit";
  // handlers injected by parent
  createHandler?: (data: any) => void;
  updateHandler?: (id: number, data: any) => void;
  isSubmitting?: boolean;
}

export function StockItemForm({
  stockItem,
  onCancel,
  mode = "create",
  // New handlers passed from parent
  createHandler,
  updateHandler,
  isSubmitting,
}: StockItemFormProps & {
  createHandler?: (data: any) => void;
  updateHandler?: (id: number, data: any) => void;
  isSubmitting?: boolean;
}) {
  const isEditing = mode === "edit" && stockItem;

  // Default values for the form - using backend field names
  const defaultValues = isEditing
    ? {
        name: stockItem.name,
        unit: stockItem.unit,
        quantity: stockItem.quantity,
        reserved_quantity: stockItem.reserved_quantity,
        low_stock_threshold: stockItem.low_stock_threshold,
        cost_per_unit: stockItem.cost_per_unit,
        supplier: stockItem.supplier,
        supplier_contact: stockItem.supplier_contact,
        last_restocked_at: stockItem.last_restocked_at || null,
      }
    : {
        name: "",
        unit: "",
        quantity: 0,
        reserved_quantity: 0,
        low_stock_threshold: 0,
        cost_per_unit: 0,
        supplier: "",
        supplier_contact: "",
        last_restocked_at: null,
      };

  const form = useForm<StockItemFormData>({
    resolver: zodResolver(stockItemSchema),
    defaultValues,
  });

  // Unit -> step mapping
  const unitStepMap: Record<string, number> = {
    pcs: 1,
    piece: 1,
    pieces: 1,
    dozen: 1, // step=1 (UI shows dozens as unit; conversion to pcs should happen on server or separate flow)
    kg: 0.01,
    g: 1,
    lb: 0.001,
    oz: 0.001,
    l: 0.001,
    ml: 1,
    boxes: 1,
    cans: 1,
    bottles: 1,
    bags: 1,
    rolls: 1,
    sheets: 1,
    units: 1,
    default: 0.001,
  };

  const selectedUnit = form.watch("unit") || "pcs";
  const numericStep = unitStepMap[selectedUnit] ?? unitStepMap.default;

  // createHandler/updateHandler passed from parent will be used instead of local mutations

  const onSubmit = async (data: StockItemFormData) => {
    try {
      // Map directly to backend Ingredient model fields
      const payload = {
        name: data.name,
        unit: data.unit,
        quantity: Number(data.quantity),
        reserved_quantity: Number(data.reserved_quantity),
        low_stock_threshold: Number(data.low_stock_threshold),
        cost_per_unit: Number(data.cost_per_unit),
        supplier: data.supplier,
        supplier_contact: data.supplier_contact,
        last_restocked_at: data.last_restocked_at,
      };

      if (isEditing) {
        if (updateHandler && stockItem) updateHandler(stockItem.id, payload);
      } else {
        if (createHandler) createHandler(payload);
      }
    } catch (error) {
      console.error("Form submission error:", error);
      toastHelpers.apiError("Form submission", error);
    }
  };

  const isLoading = isSubmitting ?? false;

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-lg border-0">
      <CardHeader className="flex flex-row items-center justify-between border-b">
        <CardTitle className="text-2xl font-bold text-gray-900">
          {isEditing ? "Edit Ingredient" : "Add New Ingredient"}
        </CardTitle>
        {onCancel && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            disabled={isLoading}
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Basic Information */}
            <div className="space-y-6">
              <div className="border-l-4 border-blue-500 pl-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Ingredient Information
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TextInputField
                  control={form.control}
                  name="name"
                  label="Ingredient Name"
                  placeholder="Enter ingredient name"
                  description="The name of the ingredient"
                />

                <SelectField
                  control={form.control}
                  name="unit"
                  label="Unit of Measurement"
                  options={unitOptions}
                  placeholder="Select unit"
                  description="How this ingredient is measured"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TextInputField
                  control={form.control}
                  name="supplier"
                  label="Supplier"
                  placeholder="Enter supplier name"
                  description="Primary supplier for this ingredient"
                />
              </div>

              <TextInputField
                control={form.control}
                name="supplier_contact"
                label="Supplier Contact"
                placeholder="Contact information (phone, email, etc.)"
                description="How to contact the supplier"
              />
            </div>

            {/* Stock & Inventory */}
            <div className="space-y-6">
              <div className="border-l-4 border-green-500 pl-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Stock & Pricing
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <NumberInputField
                  control={form.control}
                  name="quantity"
                  label="Current Quantity"
                  min={0}
                  step={numericStep}
                  description="Current quantity in stock"
                />

                <NumberInputField
                  control={form.control}
                  name="reserved_quantity"
                  label="Reserved Quantity"
                  min={0}
                  step={numericStep}
                  description="Quantity reserved for pending orders"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <NumberInputField
                  control={form.control}
                  name="low_stock_threshold"
                  label="Low Stock Threshold"
                  min={0}
                  step={numericStep}
                  description="Alert when quantity drops below this level"
                />

                {/* critical_stock_threshold removed - using only low_stock_threshold for alerts */}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <NumberInputField
                  control={form.control}
                  name="cost_per_unit"
                  label="Cost Per Unit (Rs)"
                  min={0}
                  step={0.01}
                  description="Cost per unit from supplier"
                />
              </div>
            </div>

            {/* Additional Details */}
            <div className="space-y-6">
              <div className="border-l-4 border-purple-500 pl-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Additional Details
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-sm text-gray-600">
                  <strong>Last Restocked:</strong>{" "}
                  {isEditing && stockItem.last_restocked_at
                    ? new Date(stockItem.last_restocked_at).toLocaleDateString()
                    : "Never"}
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Created:</strong>{" "}
                  {isEditing
                    ? new Date(stockItem.created_at).toLocaleDateString()
                    : "New item"}
                </div>
              </div>

              {isEditing && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="text-sm text-gray-600">
                    <strong>Last Updated:</strong>{" "}
                    {new Date(stockItem.updated_at).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-gray-600">
                    <strong>Updated At:</strong>{" "}
                    {new Date(stockItem.updated_at).toLocaleTimeString()}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <FormSubmitButton
                isLoading={isLoading}
                loadingText={isEditing ? "Updating..." : "Creating..."}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3"
              >
                {isEditing ? "Update Ingredient" : "Create Ingredient"}
              </FormSubmitButton>

              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isLoading}
                  className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-3"
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
