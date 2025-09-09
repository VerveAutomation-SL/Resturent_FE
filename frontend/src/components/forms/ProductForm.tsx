import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useFieldArray } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
  TextInputField,
  TextareaField,
  PriceInputField,
  SelectField,
  NumberInputField,
  FormSubmitButton,
  SwitchField,
} from "@/components/forms/FormComponents";
import { Input } from "@/components/ui/input";
import {
  createProductSchema,
  updateProductSchema,
  type CreateProductData,
  type UpdateProductData,
} from "@/lib/form-schemas";
import { toastHelpers } from "@/lib/toast-helpers";
import apiClient from "@/api/client";
import type { Product } from "@/types";
import { X } from "lucide-react";

interface ProductFormProps {
  product?: Product; // If provided, we're editing; otherwise creating
  onSuccess?: () => void;
  onCancel?: () => void;
  mode?: "create" | "edit";
}

export function ProductForm({
  product,
  onSuccess,
  onCancel,
  mode = "create",
}: ProductFormProps) {
  const queryClient = useQueryClient();
  const isEditing = mode === "edit" && product;

  // Fetch categories for dropdown
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => apiClient.getCategories().then((res) => res.data),
  });

  // Fetch ingredients for ingredient selector
  const {
    data: ingredients = [],
    isLoading: isLoadingIngredients,
    isError: isErrorIngredients,
  } = useQuery({
    queryKey: ["ingredients"],
    queryFn: () =>
      apiClient.getIngredients().then((res: any) => {
        return res.data.ingredients;
      }),
  });

  // Create category options for select field
  const categoryOptions = categories.map((cat) => ({
    value: cat.id.toString(),
    label: cat.name,
  }));

  // Choose the appropriate schema and default values
  const schema = isEditing ? updateProductSchema : createProductSchema;
  const defaultValues = isEditing
    ? {
        id: product.id,
        name: product.name,
        description: product.description || "",
        price: product.price,
        category_id: product.category_id,
        image_url: product.image_url || "",
        is_available: (product as any).is_available ?? true,
        ingredients: (product as any).ingredients ?? [],
      }
    : {
        name: "",
        description: "",
        price: 0,
        category_id: categories[0]?.id || 1,
        image_url: "",
        is_available: true,
        ingredients: [],
      };

  // Use relaxed typing to avoid resolver generic mismatch with union schemas
  const form = useForm<any>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "ingredients",
  });

  // UI state for edit-mode bulk assignment
  const [showAssignIngredients, setShowAssignIngredients] = useState(false);

  const handleToggleAssign = (ingredientId: number) => {
    const current = (form.getValues() as any).ingredients || [];
    const existsIndex = current.findIndex(
      (i: any) => String(i.ingredient_id) === String(ingredientId)
    );

    if (existsIndex >= 0) {
      // remove
      // find the field-array index for that ingredient id
      const faIndex = fields.findIndex(
        (f) =>
          String(
            (form.getValues() as any).ingredients?.find(
              (it: any) => String(it.ingredient_id) === String(ingredientId)
            )?.ingredient_id
          ) === String(ingredientId)
      );
      // safer: remove by searching ingredients array index
      const ingredientsArray: any[] =
        (form.getValues() as any).ingredients || [];
      const idxToRemove = ingredientsArray.findIndex(
        (it) => String(it.ingredient_id) === String(ingredientId)
      );
      if (idxToRemove >= 0) remove(idxToRemove);
    } else {
      // append with default quantity
      append({ ingredient_id: ingredientId.toString(), quantity_required: 1 });
    }
  };

  // Local state for per-row search input and label tracking
  const [ingredientSearch, setIngredientSearch] = useState<
    Record<string, string>
  >({});
  const [ingredientLabels, setIngredientLabels] = useState<
    Record<string, string>
  >({});
  const [previewUrl, setPreviewUrl] = useState<string>(
    form.getValues("image_url") || ""
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Update preview URL when form image_url changes (for editing existing products)
  useEffect(() => {
    const imageUrl = form.getValues("image_url");
    if (imageUrl && imageUrl !== previewUrl) {
      setPreviewUrl(imageUrl);
    }
  }, [form.watch("image_url")]);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // When ingredients or fields change, populate labels for pre-filled ingredient ids
  useEffect(() => {
    if (!ingredients || ingredients.length === 0) return;
    const labels: Record<string, string> = {};
    fields.forEach((field, idx) => {
      const formIngredients = (form.getValues() as any)?.ingredients || [];
      const value = formIngredients[idx]?.ingredient_id;
      if (value) {
        const ing = ingredients.find(
          (x: any) => String(x.id) === String(value)
        );
        if (ing) labels[field.id] = ing.name;
      }
    });
    setIngredientLabels((s) => ({ ...s, ...labels }));
  }, [ingredients, fields]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateProductData) => apiClient.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toastHelpers.productCreated(form.getValues("name") ?? "");
      form.reset();
      onSuccess?.();
    },
    onError: (error) => {
      toastHelpers.apiError("Create product", error);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdateProductData) =>
      apiClient.updateProduct(data.id.toString(), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toastHelpers.apiSuccess("Update", `Product "${form.getValues("name")}"`);
      onSuccess?.();
    },
    onError: (error) => {
      toastHelpers.apiError("Update product", error);
    },
  });

  const onSubmit = async (data: CreateProductData | UpdateProductData) => {
    try {
      // Ensure numeric fields are normalized
      let payload = {
        ...data,
        price: (data as any).price,
        category_id: Number((data as any).category_id),
        ingredients: (data as any).ingredients?.map((ing: any) => ({
          ingredient_id: Number(ing.ingredient_id),
          quantity_required: Number(ing.quantity_required),
        })),
      };

      // If there's a new file to upload, upload it first
      if (selectedFile && !isEditing) {
        setIsUploadingImage(true);
        try {
          const response = await apiClient.uploadImage(selectedFile);
          const imageUrl = response.data.url;

          if (!imageUrl) {
            throw new Error("Upload failed - no image URL returned");
          }

          // Update payload with the uploaded image URL
          payload = { ...payload, image_url: imageUrl };

          // Clean up the blob URL and selected file
          if (previewUrl && previewUrl.startsWith("blob:")) {
            URL.revokeObjectURL(previewUrl);
          }
          setSelectedFile(null);
          setPreviewUrl(imageUrl);
        } catch (uploadError) {
          setIsUploadingImage(false);
          toastHelpers.apiError("Image upload", uploadError);
          return; // Don't proceed with product creation if image upload fails
        } finally {
          setIsUploadingImage(false);
        }
      }

      // Now proceed with product creation/update
      if (isEditing) {
        updateMutation.mutate(payload as UpdateProductData);
      } else {
        createMutation.mutate(payload as CreateProductData);
      }
    } catch (error) {
      console.error("Form submission error:", error);
      toastHelpers.apiError("Form submission", error);
    }
  };

  const isLoading =
    createMutation.isPending || updateMutation.isPending || isUploadingImage;

  if (categories.length === 0) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              You need to create at least one category before adding products.
            </p>
            <Button onClick={onCancel} variant="outline">
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-lg border-0">
      <CardHeader className="flex flex-row items-center justify-between border-b">
        <CardTitle className="text-2xl font-bold text-gray-900">
          {isEditing ? "Edit Product" : "Create New Product"}
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
              <div className="border-l-4 border-gray-500 pl-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Basic Information
                </h2>
              </div>
              <TextInputField
                control={form.control}
                name="name"
                label="Product Name"
                placeholder="Enter product name"
                description="The name that will appear on the menu"
              />

              <TextareaField
                control={form.control}
                name="description"
                label="Description"
                placeholder="Describe the product..."
                rows={3}
                description="Optional description for staff and customers"
              />

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Product Image
                </label>
                <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-1 hover:border-gray-400 transition-colors">
                  <input
                    id="product-image-input"
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-0"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      try {
                        // Store the selected file for later upload
                        setSelectedFile(file);

                        // Create local preview URL
                        const localPreviewUrl = URL.createObjectURL(file);
                        setPreviewUrl(localPreviewUrl);

                        // Clear the image_url field since we haven't uploaded yet
                        form.setValue("image_url", "");
                      } catch (err) {
                        console.error("File selection failed", err);
                        toastHelpers.apiError("File selection", err);
                      }
                    }}
                  />

                  {previewUrl ? (
                    // Show preview image in upload area
                    <div className="text-center">
                      <div className="relative inline-block">
                        <img
                          src={previewUrl}
                          alt="Product preview"
                          className="h-32 w-32 object-cover rounded-lg border-2 border-gray-200 shadow-sm mx-auto"
                        />
                      </div>
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-900">
                          {selectedFile
                            ? "Image ready for upload"
                            : "Image uploaded successfully"}
                        </p>
                        <p className="text-xs text-gray-500 mb-3">
                          {selectedFile
                            ? "Will be uploaded when you submit the form"
                            : "Current product image"}
                        </p>
                      </div>
                      <div className="flex gap-2 justify-center">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Trigger the specific file input by id so other clicks (like Remove) won't
                            // accidentally hit the invisible overlay input.
                            const fileInput = document.getElementById(
                              "product-image-input"
                            ) as HTMLInputElement | null;
                            fileInput?.click();
                          }}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 hover:border-blue-300 relative z-10"
                        >
                          Change Image
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Clean up blob URL if it exists
                            if (previewUrl && previewUrl.startsWith("blob:")) {
                              URL.revokeObjectURL(previewUrl);
                            }
                            // Clear image_url to empty string (matches schema expectations)
                            // and clear all image-related state
                            form.setValue("image_url", "");
                            setPreviewUrl("");
                            setSelectedFile(null);
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300 relative z-10"
                        >
                          Remove Image
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Show upload prompt when no image
                    <div className="text-center">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium text-gray-900 hover:text-gray-700">
                            Click to upload
                          </span>{" "}
                          or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, GIF up to 10MB
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Pricing & Details */}
            <div className="space-y-6">
              <div className="border-l-4 border-gray-500 pl-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Pricing & Details
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <PriceInputField
                  control={form.control}
                  name="price"
                  label="Price"
                  currency="$"
                  description="Product selling price"
                />
              </div>
            </div>

            {/* Category & Status */}
            <div className="space-y-6">
              <div className="border-l-4 border-gray-500 pl-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Category & Availability
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SelectField
                  control={form.control}
                  name="category_id"
                  label="Category"
                  options={categoryOptions}
                  placeholder="Select a category"
                  description="Product category for menu organization"
                />

                <SwitchField
                  control={form.control}
                  name="is_available"
                  label="Available"
                  description="If enabled the product will appear on the menu"
                />
              </div>
            </div>

            {/* Ingredients */}
            <div className="space-y-6">
              <div className="border-l-4 border-gray-500 pl-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Ingredients
                </h2>
              </div>
              <div className="flex items-center justify-between mb-4">
                <Button
                  type="button"
                  size="sm"
                  onClick={() =>
                    append({ ingredient_id: "", quantity_required: 0 })
                  }
                  disabled={isLoadingIngredients || ingredients.length === 0}
                >
                  {isLoadingIngredients ? "Loading..." : "Add Ingredient"}
                </Button>
                {isEditing && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setShowAssignIngredients((s) => !s)}
                    className="ml-2"
                  >
                    {showAssignIngredients
                      ? "Hide Assignments"
                      : "Assign Ingredients"}
                  </Button>
                )}
              </div>

              {isEditing && showAssignIngredients && (
                <div className="p-4 bg-white border border-gray-200 rounded-lg mb-4">
                  <p className="text-sm font-medium mb-2">
                    Toggle ingredients to assign/unassign
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {ingredients.map((ing: any) => {
                      const assigned = (
                        (form.getValues() as any).ingredients || []
                      ).some(
                        (it: any) => String(it.ingredient_id) === String(ing.id)
                      );
                      return (
                        <label
                          key={ing.id}
                          className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50"
                        >
                          <input
                            type="checkbox"
                            checked={assigned}
                            onChange={() => handleToggleAssign(ing.id)}
                          />
                          <span className="text-sm">{ing.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {isErrorIngredients && (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-800">
                    Failed to load ingredients. Please try again.
                  </p>
                </div>
              )}

              {!isLoadingIngredients && ingredients.length === 0 && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-800">
                    No ingredients available. Create ingredients first to add
                    them here.
                  </p>
                </div>
              )}

              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    <div className="grid grid-cols-12 gap-4 items-end">
                      <div className="col-span-7">
                        {/* Searchable ingredient selector */}
                        <div className="relative">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Ingredient
                          </label>
                          <Input
                            value={ingredientLabels[field.id] ?? ""}
                            onChange={(e) => {
                              const q = e.target.value;
                              setIngredientSearch((s) => ({
                                ...s,
                                [field.id]: q,
                              }));
                              // when user types, clear selected id
                              form.setValue(
                                `ingredients.${index}.ingredient_id`,
                                ""
                              );
                              setIngredientLabels((s) => ({
                                ...s,
                                [field.id]: q,
                              }));
                            }}
                            placeholder={
                              isLoadingIngredients
                                ? "Loading..."
                                : "Search ingredient..."
                            }
                            className="w-full"
                          />

                          {/* Suggestions */}
                          {ingredientSearch[field.id] && (
                            <ul className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-auto">
                              {ingredients
                                .filter((ing: any) =>
                                  ing.name
                                    .toLowerCase()
                                    .startsWith(
                                      ingredientSearch[field.id].toLowerCase()
                                    )
                                )
                                .slice(0, 50)
                                .map((ing: any) => (
                                  <li key={ing.id}>
                                    <button
                                      type="button"
                                      className="w-full text-left px-4 py-3 hover:bg-gray-50 hover:text-gray-900 transition-colors border-b border-gray-100 last:border-b-0"
                                      onClick={() => {
                                        // set selected id and label
                                        form.setValue(
                                          `ingredients.${index}.ingredient_id`,
                                          ing.id.toString()
                                        );
                                        setIngredientLabels((s) => ({
                                          ...s,
                                          [field.id]: ing.name,
                                        }));
                                        setIngredientSearch((s) => ({
                                          ...s,
                                          [field.id]: "",
                                        }));
                                      }}
                                    >
                                      {ing.name}
                                    </button>
                                  </li>
                                ))}
                            </ul>
                          )}
                        </div>
                      </div>

                      <div className="col-span-3">
                        <NumberInputField
                          control={form.control}
                          name={`ingredients.${index}.quantity_required` as any}
                          label="Quantity"
                          min={0}
                          step={0.01}
                        />
                      </div>

                      <div className="col-span-2 flex justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => remove(index)}
                          className="text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-gray-200"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <FormSubmitButton
                isLoading={isLoading}
                loadingText={
                  isUploadingImage
                    ? "Uploading image..."
                    : isEditing
                      ? "Updating..."
                      : "Creating..."
                }
                className="flex-1 bg-black hover:bg-gray-800 text-white font-medium py-3"
              >
                {isEditing ? "Update Product" : "Create Product"}
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
