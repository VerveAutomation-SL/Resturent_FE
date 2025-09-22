import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  UserPlus,
  Trash2,
  Search,
  Mail,
  Calendar,
  Shield,
  Edit,
  Table,
  Users,
} from "lucide-react";
import apiClient from "@/api/client";
import { toastHelpers } from "@/lib/toast-helpers";
import { UserForm } from "@/components/forms/UserForm";
import { AdminStaffTable } from "@/components/admin/AdminStaffTable";
import { PaginationControlsComponent } from "@/components/ui/pagination-controls";
import { usePagination } from "@/hooks/usePagination";
import { UserListSkeleton } from "@/components/ui/skeletons";
import { InlineLoading } from "@/components/ui/loading-spinner";
import type { User } from "@/types";
import { useRouter } from "node_modules/@tanstack/react-router/dist/esm/useRouter";

type DisplayMode = "table" | "cards";

export function AdminStaffManagement() {
  const router = useRouter();

  useEffect(() => {
    console.log("Loading user from JWT token...");
    const decodedToken = apiClient.isAuthenticated();

    if (decodedToken) {
      console.log("Decoded token User:", decodedToken);
    } else {
      toastHelpers.sessionExpired();
      router.navigate({ to: "/login" });
    }
  }, []);

  const [displayMode, setDisplayMode] = useState<DisplayMode>("table");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const queryClient = useQueryClient();

  // Responsive breakpoint detection
  useEffect(() => {
    const checkScreenSize = () => {
      const isMobileSize = window.innerWidth < 768;
      setIsMobile(isMobileSize);
      // Auto switch to cards view on mobile
      if (isMobileSize && displayMode === "table") {
        setDisplayMode("cards");
      }
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, [displayMode]);

  // Pagination hook
  const pagination = usePagination({
    initialPage: 1,
    initialPageSize: 10,
    total: 0,
  });

  // Debounce search term
  useEffect(() => {
    if (searchTerm !== debouncedSearch) {
      setIsSearching(true);
    }
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      pagination.goToFirstPage();
      setIsSearching(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, debouncedSearch]);

  // Fetch users with pagination
  const {
    data: usersData,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["users", pagination.page, pagination.pageSize, debouncedSearch],
    queryFn: () => apiClient.getUsers().then((res: any) => res.data),
  });

  // Extract data and pagination info
  const users = Array.isArray(usersData)
    ? usersData
    : (usersData as any)?.data || [];
  const paginationInfo = (usersData as any)?.pagination || { total: 0 };

  // Delete user mutation (keep existing functionality)
  const deleteUserMutation = useMutation({
    mutationFn: ({ id }: { id: string; username: string }) =>
      apiClient.deleteUser(id),
    onSuccess: (_, { username: deletedUsername }) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toastHelpers.userDeleted(deletedUsername);
    },
    onError: (error: any) => {
      toastHelpers.apiError("Delete user", error);
    },
  });

  const handleFormSuccess = () => {
    setShowCreateForm(false);
    setEditingUser(null);
  };

  const handleCancelForm = () => {
    setShowCreateForm(false);
    setEditingUser(null);
  };

  const handleDeleteUser = (user: User) => {
    const displayName = `${user.name} with ${user.email}`;
    if (confirm(`Are you sure you want to delete ${displayName}?`)) {
      deleteUserMutation.mutate({
        id: user.id.toString(),
        username: displayName,
      });
    }
  };

  // Data is already filtered on the server side
  const filteredUsers = users;

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800 hover:bg-red-200";
      case "manager":
        return "bg-purple-100 text-purple-800 hover:bg-purple-200";
      case "server":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      case "counter":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case "kitchen":
        return "bg-orange-100 text-orange-800 hover:bg-orange-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };

  // Show form if creating or editing
  if (showCreateForm || editingUser) {
    return (
      <div className={isMobile ? "p-4" : "p-6"}>
        <UserForm
          user={editingUser || undefined}
          mode={editingUser ? "edit" : "create"}
          onSuccess={handleFormSuccess}
          onCancel={handleCancelForm}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        className={`${isMobile ? "p-4" : "p-6"} space-y-${isMobile ? "4" : "6"}`}
      >
        {/* Header Skeleton */}
        <div
          className={`${isMobile ? "space-y-3" : "flex items-center justify-between"}`}
        >
          <div className="space-y-2">
            <div
              className={`bg-muted animate-pulse rounded-md ${isMobile ? "h-6 w-36" : "h-8 w-48"}`}
            />
            <div
              className={`bg-muted animate-pulse rounded-md ${isMobile ? "h-3 w-48" : "h-4 w-72"}`}
            />
          </div>
          {!isMobile && (
            <div className="h-10 w-24 bg-muted animate-pulse rounded-md" />
          )}
        </div>

        {/* Search and Controls Skeleton */}
        <div
          className={`${isMobile ? "space-y-3" : "flex items-center justify-between gap-4"}`}
        >
          <div
            className={`bg-muted animate-pulse rounded-md ${isMobile ? "h-8 w-full" : "h-10 w-full max-w-sm"}`}
          />
        </div>

        {/* User List Skeleton */}
        <UserListSkeleton count={pagination.pageSize} />
      </div>
    );
  }

  return (
    <div
      className={`${isMobile ? "p-4" : "p-6"} space-y-${isMobile ? "4" : "6"}`}
    >
      {/* Header */}
      <div
        className={`${isMobile ? "space-y-3" : "flex items-center justify-between"}`}
      >
        <div>
          <h2
            className={`font-bold tracking-tight ${isMobile ? "text-2xl" : "text-3xl"}`}
          >
            Staff Management
          </h2>
          <p className={`text-muted-foreground ${isMobile ? "text-sm" : ""}`}>
            {isMobile
              ? "Manage staff & permissions"
              : "Manage your restaurant staff and their permissions"}
          </p>
        </div>
        {!isMobile && (
          <div className="flex items-center space-x-4">
            {/* View Toggle */}
            <div className="flex items-center bg-muted rounded-lg p-1">
              <Button
                variant={displayMode === "table" ? "default" : "ghost"}
                size="sm"
                onClick={() => setDisplayMode("table")}
                className="px-3"
              >
                <Table className="h-4 w-4 mr-1" />
                Table
              </Button>
              <Button
                variant={displayMode === "cards" ? "default" : "ghost"}
                size="sm"
                onClick={() => setDisplayMode("cards")}
                className="px-3"
              >
                <Users className="h-4 w-4 mr-1" />
                Cards
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Search and Add Staff */}
      <Card>
        <CardContent className={isMobile ? "pt-4 pb-4" : "pt-6"}>
          <div
            className={`${isMobile ? "space-y-3" : "flex items-center justify-between gap-4"}`}
          >
            <div className="relative flex-1">
              <Search
                className={`absolute left-2 top-2.5 text-muted-foreground ${isMobile ? "h-3 w-3" : "h-4 w-4"}`}
              />
              <Input
                placeholder={
                  isMobile
                    ? "Search staff..."
                    : "Search by name, email, or role..."
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={isMobile ? "pl-8 text-sm" : "pl-8"}
              />
              {isSearching && (
                <div className="absolute right-2 top-2.5">
                  <InlineLoading size="sm" />
                </div>
              )}
            </div>

            <div
              className={`flex ${isMobile ? "gap-2" : "items-center space-x-4"}`}
            >
              {/* Mobile View Toggle */}
              {isMobile && (
                <div className="flex items-center bg-muted rounded-lg p-1">
                  <Button
                    variant={displayMode === "table" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setDisplayMode("table")}
                    className="px-3 text-xs"
                  >
                    <Table className="h-3 w-3 mr-1" />
                    Table
                  </Button>
                  <Button
                    variant={displayMode === "cards" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setDisplayMode("cards")}
                    className="px-3 text-xs"
                  >
                    <Users className="h-3 w-3 mr-1" />
                    Cards
                  </Button>
                </div>
              )}

              <Button
                onClick={() => setShowCreateForm(true)}
                className={`gap-2 ${isMobile ? "text-sm" : ""}`}
                size={isMobile ? "sm" : "default"}
              >
                <UserPlus className={isMobile ? "h-3 w-3" : "h-4 w-4"} />
                {isMobile ? "Add Staff" : "Add Staff"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Staff List */}
      <div className="space-y-4">
        {displayMode === "table" ? (
          <AdminStaffTable
            data={filteredUsers}
            onEdit={setEditingUser}
            onDelete={handleDeleteUser}
            isLoading={isLoading}
          />
        ) : filteredUsers.length === 0 ? (
          <Card>
            <CardContent className={isMobile ? "pt-4" : "pt-6"}>
              <div className="text-center py-8">
                <UserPlus
                  className={`mx-auto text-gray-400 ${isMobile ? "h-8 w-8" : "h-12 w-12"}`}
                />
                <h3
                  className={`mt-2 font-medium text-gray-900 ${isMobile ? "text-sm" : "text-sm"}`}
                >
                  No staff members
                </h3>
                <p
                  className={`mt-1 text-gray-500 ${isMobile ? "text-xs" : "text-sm"}`}
                >
                  {searchTerm
                    ? "No staff members match your search."
                    : "Get started by adding a new staff member."}
                </p>
                {!searchTerm && (
                  <div className="mt-6">
                    <Button
                      onClick={() => setShowCreateForm(true)}
                      className="gap-2"
                      size={isMobile ? "sm" : "default"}
                    >
                      <UserPlus className={isMobile ? "h-3 w-3" : "h-4 w-4"} />
                      Add New Staff
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className={`grid gap-${isMobile ? "3" : "4"}`}>
            {filteredUsers.map((user: User) => (
              <Card key={user.id} className="hover:shadow-md transition-shadow">
                <CardContent className={isMobile ? "pt-4 pb-4" : "pt-6"}>
                  <div
                    className={`${isMobile ? "space-y-4" : "flex items-center justify-between"}`}
                  >
                    <div
                      className={`flex items-center space-x-4 ${isMobile ? "justify-center" : ""}`}
                    >
                      <div className="flex-shrink-0">
                        <div
                          className={`rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center ${isMobile ? "h-10 w-10" : "h-12 w-12"}`}
                        >
                          <span
                            className={`font-semibold text-white ${isMobile ? "text-xs" : "text-sm"}`}
                          >
                            {user.name[0]}
                          </span>
                        </div>
                      </div>
                      <div
                        className={`min-w-0 flex-1 ${isMobile ? "text-center" : ""}`}
                      >
                        <h3
                          className={`font-medium text-gray-900 ${isMobile ? "text-sm" : ""}`}
                        >
                          {user.name}
                        </h3>
                        <div
                          className={`flex items-center gap-2 mt-1 ${isMobile ? "justify-center flex-wrap" : ""}`}
                        >
                          <Mail className={isMobile ? "h-3 w-3" : "h-4 w-4"} />
                          <p
                            className={`text-gray-500 ${isMobile ? "text-xs" : "text-sm"}`}
                          >
                            {user.email}
                          </p>
                        </div>
                        {user.created_at && (
                          <div
                            className={`flex items-center gap-2 mt-1 ${isMobile ? "justify-center" : ""}`}
                          >
                            <Calendar
                              className={isMobile ? "h-3 w-3" : "h-4 w-4"}
                            />
                            <p
                              className={`text-gray-500 ${isMobile ? "text-xs" : "text-sm"}`}
                            >
                              Joined{" "}
                              {new Date(user.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                        <div
                          className={`flex items-center gap-2 mt-2 ${isMobile ? "justify-center" : ""}`}
                        >
                          <Shield
                            className={isMobile ? "h-3 w-3" : "h-4 w-4"}
                          />
                          <Badge
                            className={`${getRoleBadgeColor(user.role)} ${isMobile ? "text-xs" : ""}`}
                          >
                            {user.role}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div
                      className={`flex ${isMobile ? "justify-center space-x-2 w-full" : "flex-col space-y-2 ml-4"}`}
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingUser(user)}
                        className={isMobile ? "flex-1 gap-1 text-xs" : "gap-1"}
                      >
                        <Edit className={isMobile ? "h-3 w-3" : "h-4 w-4"} />
                        {isMobile ? "Edit" : "Edit"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteUser(user)}
                        className={`text-red-600 hover:text-red-700 hover:border-red-300 ${isMobile ? "flex-1 gap-1 text-xs" : "gap-1"}`}
                      >
                        <Trash2 className={isMobile ? "h-3 w-3" : "h-4 w-4"} />
                        {isMobile ? "Delete" : "Delete"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {filteredUsers.length > 0 && (
          <div className={`${isMobile ? "mt-4 space-y-3" : "mt-6 space-y-4"}`}>
            {isFetching && !isLoading && (
              <div className="flex justify-center">
                <InlineLoading text="Updating staff..." />
              </div>
            )}
            <PaginationControlsComponent
              pagination={pagination}
              total={paginationInfo.total || filteredUsers.length}
            />
          </div>
        )}
      </div>
    </div>
  );
}
