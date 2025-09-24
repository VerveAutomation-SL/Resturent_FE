import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
  TextInputField,
  SelectField,
  FormSubmitButton,
  roleOptions,
  userStatusOptions,
} from "@/components/forms/FormComponents";
import {
  createUserSchema,
  updateUserSchema,
  type CreateUserData,
  type UpdateUserData,
} from "@/lib/form-schemas";
import { toastHelpers } from "@/lib/toast-helpers";
import apiClient from "@/api/client";
import type { User } from "@/types";
import { X } from "lucide-react";

interface UserFormProps {
  user?: User; // If provided, we're editing; otherwise creating
  onSuccess?: () => void;
  onCancel?: () => void;
  mode?: "create" | "edit";
}

export function UserForm({
  user,
  onSuccess,
  onCancel,
  mode = "create",
}: UserFormProps) {
  const queryClient = useQueryClient();
  const isEditing = mode === "edit" && user;

  // Choose the appropriate schema and default values
  const schema = isEditing ? updateUserSchema : createUserSchema;
  const defaultValues = isEditing
    ? {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role as any,
        status: user.status as any,
        password: "", // Don't pre-fill password for editing
      }
    : {
        name: "",
        email: "",
        password: "",
        role: "admin" as const,
        status: "active" as const,
      };

  const form = useForm<CreateUserData | UpdateUserData>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateUserData) => apiClient.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toastHelpers.userCreated(`${form.getValues("name")}`);
      form.reset();
      onSuccess?.();
    },
    onError: (error) => {
      toastHelpers.apiError("Create user", error);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdateUserData) =>
      apiClient.updateUser(data.id.toString(), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toastHelpers.apiSuccess("Update", `User ${form.getValues("name")}`);
      onSuccess?.();
    },
    onError: (error) => {
      toastHelpers.apiError("Update user", error);
    },
  });

  const onSubmit = (data: CreateUserData | UpdateUserData) => {
    if (isEditing) {
      // Filter out empty password for updates
      const updateData = { ...data } as UpdateUserData;
      if (!updateData.password || updateData.password.trim() === "") {
        delete updateData.password;
      }
      updateMutation.mutate(updateData);
    } else {
      createMutation.mutate(data as CreateUserData);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{isEditing ? "Edit User" : "Create New User"}</CardTitle>
        {onCancel && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            disabled={isLoading}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextInputField
                control={form.control}
                name="name"
                label="Name"
                placeholder="Enter name"
                autoComplete="name"
              />
            </div>

            {/* Account Information */}
            <div className="space-y-4">
              <TextInputField
                control={form.control}
                name="email"
                label="Email Address"
                type="email"
                placeholder="Enter email address"
                autoComplete="email"
              />

              <TextInputField
                control={form.control}
                name="password"
                label={
                  isEditing
                    ? "New Password (leave blank to keep current)"
                    : "Password"
                }
                type="password"
                placeholder={
                  isEditing
                    ? "Enter new password or leave blank"
                    : "Enter password"
                }
                autoComplete={isEditing ? "new-password" : "new-password"}
                description={
                  isEditing
                    ? "Leave blank to keep the current password"
                    : "Minimum 6 characters"
                }
              />
            </div>

            {/* Role Selection */}
            <SelectField
              control={form.control}
              name="role"
              label="Role"
              placeholder="Select user role"
              options={roleOptions}
              description="Determines what features the user can access"
            />

            {/* Status Selection */}
            <SelectField
              control={form.control}
              name="status"
              label="Status"
              placeholder="Select user status"
              options={userStatusOptions}
              description="Controls whether the user can log in and access the system"
            />

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <FormSubmitButton
                isLoading={isLoading}
                loadingText={isEditing ? "Updating..." : "Creating..."}
                className="flex-1"
              >
                {isEditing ? "Update User" : "Create User"}
              </FormSubmitButton>

              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isLoading}
                  className="flex-1"
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
