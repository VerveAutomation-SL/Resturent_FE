import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Search,
  Package,
  Tag,
  Edit,
  Trash2,
  Table,
  Grid3X3,
  DollarSign,
  RefreshCw,
} from "lucide-react";
import apiClient from "@/api/client";
import { toastHelpers } from "@/lib/toast-helpers";
import { ProductForm } from "@/components/forms/ProductForm";
import { CategoryForm } from "@/components/forms/CategoryForm";
import { AdminMenuTable } from "@/components/admin/AdminMenuTable";
import { AdminCategoriesTable } from "@/components/admin/AdminCategoriesTable";
import { PaginationControlsComponent } from "@/components/ui/pagination-controls";
import { usePagination } from "@/hooks/usePagination";
// Skeleton components removed - using inline skeletons in this component
import { InlineLoading } from "@/components/ui/loading-spinner";
import type { Product, Category } from "@/types";
import { useRouter } from "@tanstack/react-router";
import { useNavigationRefresh } from "@/hooks/useNavigationRefresh";

type DisplayMode = "table" | "cards";
type ActiveTab = "products" | "categories";

export function AdminMenuManagement() {
  const router = useRouter();

  // Auto-refresh data when navigating to this page
  const { manualRefresh, isRefreshing } = useNavigationRefresh([
    "admin-categories",
    "admin-products",
  ]);

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
  const [activeTab, setActiveTab] = useState<ActiveTab>("products");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [debouncedCategorySearch, setDebouncedCategorySearch] = useState("");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showCreateProductForm, setShowCreateProductForm] = useState(false);
  const [showCreateCategoryForm, setShowCreateCategoryForm] = useState(false);
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

  // Pagination hooks
  const productsPagination = usePagination({
    initialPage: 1,
    initialPageSize: 10,
    total: 0,
  });

  const categoriesPagination = usePagination({
    initialPage: 1,
    initialPageSize: 10,
    total: 0,
  });

  // Debounce product search
  useEffect(() => {
    if (searchTerm !== debouncedSearch) {
      setIsSearching(true);
    }
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      productsPagination.goToFirstPage();
      setIsSearching(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, debouncedSearch]);

  // Debounce category search
  useEffect(() => {
    if (categorySearch !== debouncedCategorySearch) {
      setIsSearching(true);
    }
    const timer = setTimeout(() => {
      setDebouncedCategorySearch(categorySearch);
      categoriesPagination.goToFirstPage();
      setIsSearching(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [categorySearch, debouncedCategorySearch]);

  // Fetch products with pagination
  const { data: productsData, isLoading: isLoadingProducts } = useQuery({
    queryKey: [
      "admin-products",
      productsPagination.page,
      productsPagination.pageSize,
      debouncedSearch,
    ],
    queryFn: () =>
      apiClient
        .getAdminProducts({
          page: productsPagination.page,
          per_page: productsPagination.pageSize,
          search: debouncedSearch || undefined,
        })
        .then((res: any) => res.data.products),
  });

  // Fetch categories with pagination
  const { data: categoriesData, isLoading: isLoadingCategories } = useQuery({
    queryKey: [
      "admin-categories",
      categoriesPagination.page,
      categoriesPagination.pageSize,
      debouncedCategorySearch,
    ],
    queryFn: () =>
      apiClient
        .getCategories({
          page: categoriesPagination.page,
          per_page: categoriesPagination.pageSize,
          search: debouncedCategorySearch || undefined,
        })
        .then((res: any) => res.data),
  });

  // Show loading screen when backend is called (not cache fetch)
  const isLoadingAny = isRefreshing || isLoadingCategories || isLoadingProducts;

  // Extract data and pagination info
  const products = Array.isArray(productsData)
    ? productsData
    : (productsData as any)?.data || [];
  const productsPaginationInfo = (productsData as any)?.pagination || {
    total: 0,
  };

  const categories = Array.isArray(categoriesData)
    ? categoriesData
    : (categoriesData as any)?.data || [];
  const categoriesPaginationInfo = (categoriesData as any)?.pagination || {
    total: 0,
  };

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: (id: string) => apiClient.deleteProduct(id),
    onSuccess: (_, productId) => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toastHelpers.productDeleted(productId);
    },
    onError: (error: any) => {
      toastHelpers.apiError("Delete product", error);
    },
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => apiClient.deleteCategory(id),
    onSuccess: (_, categoryId) => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      toastHelpers.apiSuccess("Delete category", categoryId);
    },
    onError: (error: any) => {
      toastHelpers.apiError("Delete category", error);
    },
  });

  const handleFormSuccess = () => {
    setShowCreateProductForm(false);
    setShowCreateCategoryForm(false);
    setEditingProduct(null);
    setEditingCategory(null);
  };

  const handleCancelForm = () => {
    setShowCreateProductForm(false);
    setShowCreateCategoryForm(false);
    setEditingProduct(null);
    setEditingCategory(null);
  };

  const handleDeleteProduct = (product: Product) => {
    if (confirm(`Are you sure you want to delete "${product.name}"?`)) {
      deleteProductMutation.mutate(product.id.toString());
    }
  };

  const handleDeleteCategory = (category: Category) => {
    if (confirm(`Are you sure you want to delete "${category.name}"?`)) {
      deleteCategoryMutation.mutate(category.id.toString());
    }
  };

  // Show form if creating or editing
  if (showCreateProductForm || editingProduct) {
    return (
      <div className={isMobile ? "p-4" : "p-8"}>
        <ProductForm
          product={editingProduct || undefined}
          mode={editingProduct ? "edit" : "create"}
          onSuccess={handleFormSuccess}
          onCancel={handleCancelForm}
        />
      </div>
    );
  }

  if (showCreateCategoryForm || editingCategory) {
    return (
      <div className={isMobile ? "p-4" : "p-6"}>
        <CategoryForm
          category={editingCategory || undefined}
          mode={editingCategory ? "edit" : "create"}
          onSuccess={handleFormSuccess}
          onCancel={handleCancelForm}
        />
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
            Menu Management
          </h2>
          <p className={`text-muted-foreground ${isMobile ? "text-sm" : ""}`}>
            {isMobile
              ? "Manage products & categories"
              : "Manage your restaurant's products and categories"}
          </p>
        </div>
        {!isMobile && (
          <div className="flex items-center space-x-4">
            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={manualRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </Button>

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
                <Grid3X3 className="h-4 w-4 mr-1" />
                Cards
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as ActiveTab)}
        className="w-full"
      >
        <div
          className={`${isMobile ? "space-y-3" : "flex items-center justify-between"}`}
        >
          <TabsList
            className={`${isMobile ? "grid grid-cols-2 w-full" : "grid w-[400px] grid-cols-2"}`}
          >
            <TabsTrigger
              value="products"
              className={`gap-2 ${isMobile ? "text-sm" : ""}`}
            >
              <Package className={isMobile ? "h-3 w-3" : "h-4 w-4"} />
              Products ({products.length || 0})
            </TabsTrigger>
            <TabsTrigger
              value="categories"
              className={`gap-2 ${isMobile ? "text-sm" : ""}`}
            >
              <Tag className={isMobile ? "h-3 w-3" : "h-4 w-4"} />
              Categories ({categories.length || 0})
            </TabsTrigger>
          </TabsList>

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
                <Grid3X3 className="h-3 w-3 mr-1" />
                Cards
              </Button>
            </div>
          )}
        </div>

        {/* Search and Add Button - Always visible */}
        <div className="mt-6">
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
                      activeTab === "products"
                        ? isMobile
                          ? "Search products..."
                          : "Search products by name, category, or description..."
                        : isMobile
                          ? "Search categories..."
                          : "Search categories by name or description..."
                    }
                    value={
                      activeTab === "products" ? searchTerm : categorySearch
                    }
                    onChange={(e) =>
                      activeTab === "products"
                        ? setSearchTerm(e.target.value)
                        : setCategorySearch(e.target.value)
                    }
                    className={isMobile ? "pl-8 text-sm" : "pl-8"}
                  />
                  {isSearching && (
                    <div className="absolute right-2 top-2.5">
                      <InlineLoading size="sm" />
                    </div>
                  )}
                </div>
                <Button
                  onClick={() =>
                    activeTab === "products"
                      ? setShowCreateProductForm(true)
                      : setShowCreateCategoryForm(true)
                  }
                  className={`gap-2 ${isMobile ? "w-full text-sm" : ""}`}
                  size={isMobile ? "sm" : "default"}
                >
                  <Plus className={isMobile ? "h-3 w-3" : "h-4 w-4"} />
                  {activeTab === "products"
                    ? isMobile
                      ? "Add Product"
                      : "Add Product"
                    : isMobile
                      ? "Add Category"
                      : "Add Category"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Content area with skeletons when loading */}
          {isLoadingAny ? (
            <div className="space-y-6 mt-6">
              {/* Products/Categories skeleton grid */}
              {activeTab === "products" ? (
                displayMode === "cards" ? (
                  <div
                    className={`grid gap-${isMobile ? "3" : "4"} ${isMobile ? "grid-cols-1 sm:grid-cols-2" : "md:grid-cols-2 lg:grid-cols-3"}`}
                  >
                    {[...Array(6)].map((_, i) => (
                      <Card
                        key={i}
                        className="hover:shadow-md transition-shadow"
                      >
                        <CardContent
                          className={isMobile ? "pt-4 pb-4" : "pt-6"}
                        >
                          <div
                            className={`${isMobile ? "space-y-3" : "flex items-start justify-between"}`}
                          >
                            <div
                              className={`flex ${isMobile ? "flex-col space-y-3" : "items-center space-x-3"} flex-1`}
                            >
                              {/* Product image skeleton */}
                              <div
                                className={`rounded-lg bg-muted/60 animate-pulse ${isMobile ? "h-20 w-20 mx-auto" : "h-12 w-12"}`}
                              />

                              {/* Product content skeleton */}
                              <div
                                className={`min-w-0 flex-1 ${isMobile ? "text-center" : ""} space-y-2`}
                              >
                                <div
                                  className={`h-5 bg-muted/60 rounded animate-pulse ${isMobile ? "w-24 mx-auto" : "w-32"}`}
                                />
                                <div
                                  className={`h-4 bg-muted/40 rounded animate-pulse ${isMobile ? "w-32 mx-auto" : "w-48"}`}
                                />
                                <div
                                  className={`h-6 bg-muted/50 rounded animate-pulse ${isMobile ? "w-16 mx-auto" : "w-20"}`}
                                />
                              </div>
                            </div>

                            {/* Action buttons skeleton */}
                            <div
                              className={`flex ${isMobile ? "justify-center space-x-2 w-full" : "flex-col space-y-1 ml-2"}`}
                            >
                              <div
                                className={`bg-muted/50 animate-pulse rounded ${isMobile ? "h-8 flex-1" : "h-8 w-8"}`}
                              />
                              <div
                                className={`bg-muted/40 animate-pulse rounded ${isMobile ? "h-8 flex-1" : "h-8 w-8"}`}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  // Table skeleton
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        {/* Table header skeleton */}
                        <div className="grid grid-cols-5 gap-4 p-4 bg-muted/30 rounded-lg">
                          <div className="h-4 bg-muted/60 rounded animate-pulse" />
                          <div className="h-4 bg-muted/60 rounded animate-pulse" />
                          <div className="h-4 bg-muted/60 rounded animate-pulse" />
                          <div className="h-4 bg-muted/60 rounded animate-pulse" />
                          <div className="h-4 bg-muted/60 rounded animate-pulse" />
                        </div>

                        {/* Table rows skeleton */}
                        {[...Array(4)].map((_, i) => (
                          <div
                            key={i}
                            className="grid grid-cols-5 gap-4 p-4 border-b"
                          >
                            <div className="flex items-center space-x-2">
                              <div className="h-8 w-8 bg-muted/60 rounded animate-pulse" />
                              <div className="h-4 w-24 bg-muted/50 rounded animate-pulse" />
                            </div>
                            <div className="h-4 bg-muted/40 rounded animate-pulse" />
                            <div className="h-5 w-16 bg-muted/50 rounded animate-pulse" />
                            <div className="h-6 w-20 bg-muted/60 rounded animate-pulse" />
                            <div className="flex space-x-1">
                              <div className="h-8 w-8 bg-muted/40 rounded animate-pulse" />
                              <div className="h-8 w-8 bg-muted/40 rounded animate-pulse" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )
              ) : (
                // Categories skeleton
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 bg-muted/60 rounded animate-pulse" />
                            <div className="space-y-2">
                              <div className="h-5 w-32 bg-muted/60 rounded animate-pulse" />
                              <div className="h-4 w-48 bg-muted/40 rounded animate-pulse" />
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <div className="h-8 w-8 bg-muted/40 rounded animate-pulse" />
                            <div className="h-8 w-8 bg-muted/40 rounded animate-pulse" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Pagination skeleton */}
              <div className="flex justify-center">
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-16 bg-muted/40 rounded animate-pulse" />
                  <div className="h-8 w-8 bg-muted/50 rounded animate-pulse" />
                  <div className="h-8 w-8 bg-muted/50 rounded animate-pulse" />
                  <div className="h-8 w-8 bg-muted/40 rounded animate-pulse" />
                  <div className="h-8 w-16 bg-muted/40 rounded animate-pulse" />
                </div>
              </div>
            </div>
          ) : (
            <>
              <TabsContent
                value="products"
                className={`space-y-${isMobile ? "4" : "6"}`}
              >
                {/* Products List */}
                <div className="space-y-4">
                  {displayMode === "table" ? (
                    <AdminMenuTable
                      data={products}
                      categories={categories}
                      onEdit={setEditingProduct}
                      onDelete={handleDeleteProduct}
                      isLoading={isLoadingProducts}
                    />
                  ) : products.length === 0 ? (
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center py-8">
                          <Package className="mx-auto h-12 w-12 text-gray-400" />
                          <h3 className="mt-2 text-sm font-medium text-gray-900">
                            No products
                          </h3>
                          <p className="mt-1 text-sm text-gray-500">
                            {searchTerm
                              ? "No products match your search."
                              : "Get started by adding your first product."}
                          </p>
                          {!searchTerm && (
                            <div className="mt-6">
                              <Button
                                onClick={() => setShowCreateProductForm(true)}
                                className="gap-2"
                              >
                                <Plus className="h-4 w-4" />
                                Add Product
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div
                      className={`grid gap-${isMobile ? "3" : "4"} ${isMobile ? "grid-cols-1 sm:grid-cols-2" : "md:grid-cols-2 lg:grid-cols-3"}`}
                    >
                      {products.map((product: Product) => (
                        <Card
                          key={product.id}
                          className="hover:shadow-md transition-shadow"
                        >
                          <CardContent
                            className={isMobile ? "pt-4 pb-4" : "pt-6"}
                          >
                            <div
                              className={`${isMobile ? "space-y-3" : "flex items-start justify-between"}`}
                            >
                              <div
                                className={`flex ${isMobile ? "flex-col space-y-3" : "items-center space-x-3"} flex-1`}
                              >
                                <div className="flex-shrink-0">
                                  {product.image_url ? (
                                    <img
                                      src={product.image_url}
                                      alt={product.name}
                                      className={`rounded-lg object-cover ${isMobile ? "h-20 w-20 mx-auto" : "h-12 w-12"}`}
                                    />
                                  ) : (
                                    <div
                                      className={`rounded-lg bg-gradient-to-r from-orange-400 to-pink-500 flex items-center justify-center ${isMobile ? "h-20 w-20 mx-auto" : "h-12 w-12"}`}
                                    >
                                      <Package
                                        className={`text-white ${isMobile ? "h-8 w-8" : "h-6 w-6"}`}
                                      />
                                    </div>
                                  )}
                                </div>
                                <div
                                  className={`min-w-0 flex-1 ${isMobile ? "text-center" : ""}`}
                                >
                                  <h3
                                    className={`font-medium text-gray-900 ${isMobile ? "text-sm" : ""} ${isMobile ? "" : "truncate"}`}
                                  >
                                    {product.name}
                                  </h3>
                                  <p
                                    className={`text-gray-500 line-clamp-2 ${isMobile ? "text-xs mt-1" : "text-sm"}`}
                                  >
                                    {product.description || "No description"}
                                  </p>
                                  <div
                                    className={`flex items-center gap-2 mt-2 ${isMobile ? "justify-center" : ""}`}
                                  >
                                    <Badge
                                      variant="outline"
                                      className={`text-green-600 ${isMobile ? "text-xs" : ""}`}
                                    >
                                      <DollarSign
                                        className={`mr-1 ${isMobile ? "w-2 h-2" : "w-3 h-3"}`}
                                      />
                                      {product.price}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              <div
                                className={`flex ${isMobile ? "justify-center space-x-2 w-full" : "flex-col space-y-1 ml-2"}`}
                              >
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingProduct(product)}
                                  className={
                                    isMobile
                                      ? "flex-1 gap-1 text-xs"
                                      : "h-8 w-8 p-0"
                                  }
                                >
                                  <Edit
                                    className={isMobile ? "h-3 w-3" : "h-4 w-4"}
                                  />
                                  {isMobile && "Edit"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteProduct(product)}
                                  className={`text-red-600 hover:text-red-700 hover:border-red-300 ${isMobile ? "flex-1 gap-1 text-xs" : "h-8 w-8 p-0"}`}
                                >
                                  <Trash2
                                    className={isMobile ? "h-3 w-3" : "h-4 w-4"}
                                  />
                                  {isMobile && "Delete"}
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* Products Pagination */}
                  {products.length > 0 && (
                    <div className="mt-6 space-y-4">
                      {isLoadingAny && (
                        <div className="flex justify-center">
                          <InlineLoading text="Updating products..." />
                        </div>
                      )}
                      <PaginationControlsComponent
                        pagination={productsPagination}
                        total={productsPaginationInfo.total || products.length}
                      />
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Categories Tab */}
              <TabsContent
                value="categories"
                className={`space-y-${isMobile ? "4" : "6"}`}
              >
                {/* Categories List */}
                <div className="space-y-4">
                  {categories.length === 0 ? (
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center py-8">
                          <Tag className="mx-auto h-12 w-12 text-gray-400" />
                          <h3 className="mt-2 text-sm font-medium text-gray-900">
                            No categories
                          </h3>
                          <p className="mt-1 text-sm text-gray-500">
                            {categorySearch
                              ? "No categories match your search."
                              : "Get started by adding your first category."}
                          </p>
                          {!categorySearch && (
                            <div className="mt-6">
                              <Button
                                onClick={() => setShowCreateCategoryForm(true)}
                                className="gap-2"
                              >
                                <Plus className="h-4 w-4" />
                                Add Category
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <AdminCategoriesTable
                      data={categories}
                      onEdit={setEditingCategory}
                      onDelete={handleDeleteCategory}
                      isLoading={isLoadingCategories}
                    />
                  )}

                  {/* Categories Pagination */}
                  {categories.length > 0 && (
                    <div className="mt-6 space-y-4">
                      {isLoadingAny && (
                        <div className="flex justify-center">
                          <InlineLoading text="Updating categories..." />
                        </div>
                      )}
                      <PaginationControlsComponent
                        pagination={categoriesPagination}
                        total={
                          categoriesPaginationInfo.total || categories.length
                        }
                      />
                    </div>
                  )}
                </div>
              </TabsContent>
            </>
          )}
        </div>
      </Tabs>
    </div>
  );
}
