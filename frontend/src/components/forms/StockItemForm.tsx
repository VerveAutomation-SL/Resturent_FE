import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { X } from "lucide-react";
import {
  TextInputField,
  NumberInputField,
  SelectField,
  SwitchField,
  FormSubmitButton,
  unitOptions,
} from "@/components/forms/FormComponents";
import apiClient from "@/api/client";
import { toastHelpers } from "@/lib/toast-helpers";
import { InventoryIngredient } from "@/types";

// Stock item form schema - aligned with Sequelize Ingredient model
const stockItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  unit: z.string().min(1, "Unit is required"),
  quantity: z.number().min(0, "Quantity must be 0 or greater"),
  reserved_quantity: z
    .number()
    .min(0, "Reserved quantity must be 0 or greater"),
  low_stock_threshold: z
    .number()
    .min(0, "Low stock threshold must be 0 or greater"),
  critical_stock_threshold: z
    .number()
    .min(0, "Critical stock threshold must be 0 or greater"),
  cost_per_unit: z.number().min(0, "Cost per unit must be 0 or greater"),
  supplier: z.string().min(1, "Supplier is required"),
  supplier_contact: z.string().min(1, "Supplier contact is required"),
  last_restocked_at: z.string().nullable().optional(),
  auto_reorder: z.boolean().default(false),
  reorder_quantity: z.number().min(0, "Reorder quantity must be 0 or greater"),
});

type StockItemFormData = z.infer<typeof stockItemSchema>;

interface StockItemFormProps {
  stockItem?: InventoryIngredient;
  onSuccess?: () => void;
  onCancel?: () => void;
  mode?: "create" | "edit";
}

export function StockItemForm({
  stockItem,
  onSuccess,
  onCancel,
  mode = "create",
}: StockItemFormProps) {
  const queryClient = useQueryClient();
  const isEditing = mode === "edit" && stockItem;

  // Default values for the form - using backend field names
  const defaultValues = isEditing
    ? {
        name: stockItem.name,
        unit: stockItem.unit,
        quantity: stockItem.quantity,
        reserved_quantity: stockItem.reserved_quantity,
        low_stock_threshold: stockItem.low_stock_threshold,
        critical_stock_threshold: stockItem.critical_stock_threshold,
        cost_per_unit: stockItem.cost_per_unit,
        supplier: stockItem.supplier,
        supplier_contact: stockItem.supplier_contact,
        last_restocked_at: stockItem.last_restocked_at || null,
        auto_reorder: stockItem.auto_reorder,
        reorder_quantity: stockItem.reorder_quantity,
      }
    : {
        name: "",
        unit: "",
        quantity: 0,
        reserved_quantity: 0,
        low_stock_threshold: 0,
        critical_stock_threshold: 0,
        cost_per_unit: 0,
        supplier: "",
        supplier_contact: "",
        last_restocked_at: null,
        auto_reorder: false,
        reorder_quantity: 0,
      };

  const form = useForm<StockItemFormData>({
    resolver: zodResolver(stockItemSchema),
    defaultValues,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: StockItemFormData) => apiClient.createIngredient(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-items"] });
      queryClient.invalidateQueries({ queryKey: ["ingredients"] });
      queryClient.invalidateQueries({ queryKey: ["ingredient-stats"] });
      toastHelpers.apiSuccess(
        "Create",
        `Ingredient "${form.getValues("name")}" created successfully`
      );
      form.reset();
      onSuccess?.();
    },
    onError: (error) => {
      toastHelpers.apiError("Create ingredient", error);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: StockItemFormData) =>
      apiClient.updateIngredient(stockItem!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-items"] });
      queryClient.invalidateQueries({ queryKey: ["ingredients"] });
      queryClient.invalidateQueries({ queryKey: ["ingredient-stats"] });
      toastHelpers.apiSuccess(
        "Update",
        `Ingredient "${form.getValues("name")}" updated successfully`
      );
      onSuccess?.();
    },
    onError: (error) => {
      toastHelpers.apiError("Update ingredient", error);
    },
  });

  const onSubmit = async (data: StockItemFormData) => {
    try {
      // Map directly to backend Ingredient model fields
      const payload = {
        name: data.name,
        unit: data.unit,
        quantity: Number(data.quantity),
        reserved_quantity: Number(data.reserved_quantity),
        low_stock_threshold: Number(data.low_stock_threshold),
        critical_stock_threshold: Number(data.critical_stock_threshold),
        cost_per_unit: Number(data.cost_per_unit),
        supplier: data.supplier,
        supplier_contact: data.supplier_contact,
        last_restocked_at: data.last_restocked_at,
        auto_reorder: data.auto_reorder,
        reorder_quantity: Number(data.reorder_quantity),
      };

      if (isEditing) {
        updateMutation.mutate(payload);
      } else {
        createMutation.mutate(payload);
      }
    } catch (error) {
      console.error("Form submission error:", error);
      toastHelpers.apiError("Form submission", error);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

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
                  step={0.001}
                  description="Current quantity in stock"
                />

                <NumberInputField
                  control={form.control}
                  name="reserved_quantity"
                  label="Reserved Quantity"
                  min={0}
                  step={0.001}
                  description="Quantity reserved for pending orders"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <NumberInputField
                  control={form.control}
                  name="low_stock_threshold"
                  label="Low Stock Threshold"
                  min={0}
                  step={0.001}
                  description="Alert when quantity drops below this level"
                />

                <NumberInputField
                  control={form.control}
                  name="critical_stock_threshold"
                  label="Critical Stock Threshold"
                  min={0}
                  step={0.001}
                  description="Critical alert when quantity drops below this level"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <NumberInputField
                  control={form.control}
                  name="cost_per_unit"
                  label="Cost Per Unit ($)"
                  min={0}
                  step={0.01}
                  description="Cost per unit from supplier"
                />
              </div>

              <SwitchField
                control={form.control}
                name="auto_reorder"
                label="Auto Reorder"
                description="Automatically reorder when low stock threshold is reached"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <NumberInputField
                  control={form.control}
                  name="reorder_quantity"
                  label="Reorder Quantity"
                  min={0}
                  step={0.001}
                  description="Quantity to reorder when auto-reorder is triggered"
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
