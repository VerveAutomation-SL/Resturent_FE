import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatsCardSkeleton } from "@/components/ui/skeletons";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  RefreshCw,
  FileBarChart,
  ChevronDown,
  ChevronRight,
  Package,
  Eye,
} from "lucide-react";
import { useNavigationRefresh } from "@/hooks/useNavigationRefresh";
import apiClient from "@/api/client";
import { useRouter } from "@tanstack/react-router";
import { toastHelpers } from "@/lib/toast-helpers";
import { formatCurrency } from "@/lib/utils";
import type { Order, ReportFilterParams } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { ReportFilters } from "./ReportFilters";

export function AdminReports() {
  const router = useRouter();

  // Auto-refresh data when navigating to this page
  const { manualRefresh, isRefreshing } = useNavigationRefresh([
    "salesReport",
    "ordersReport",
    "incomeReport",
    "analytics",
  ]);

  const [activeTab, setActiveTab] = useState<"analytics" | "reports">(
    "analytics"
  );
  const [selectedPeriod, setSelectedPeriod] = useState<
    "today" | "week" | "month"
  >("today");
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<ReportFilterParams>({
    startDate: "",
    endDate: "",
    orderType: "",
    status: "",
    minAmount: null,
    maxAmount: null,
    searchTerm: "",
  });
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const [showPreview, setShowPreview] = useState(false);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState<"pdf" | "excel" | null>(
    null
  );

  useEffect(() => {
    const decodedToken = apiClient.isAuthenticated();

    if (!decodedToken) {
      toastHelpers.sessionExpired();
      router.navigate({ to: "/login" });
    }
  }, []);

  // Prepare params for query
  const previewParams: ReportFilterParams = {
    ...filters,
    minAmount: filters.minAmount ? Number(filters.minAmount) : undefined,
    maxAmount: filters.maxAmount ? Number(filters.maxAmount) : undefined,
  };

  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ["analytics", selectedPeriod],
    queryFn: async () => {
      const res = await apiClient.getAnalytics(selectedPeriod);
      console.log("Analytics data:", res.data);
      return res.data;
    },
  });

  const {
    data: previewData,
    isLoading: previewLoading,
    refetch: refetchPreview,
  } = useQuery({
    queryKey: ["previewDetails", previewParams],
    queryFn: () =>
      apiClient.getPreviewDetails(previewParams).then((res) => {
        console.log("Preview data:", res.data);
        return res.data?.data;
      }),
    enabled: false, // Disabled by default, only run on manual trigger
  });

  const clearFilter = (key: keyof ReportFilterParams) => {
    handleFilterChange(key, "");
  };

  const isLoadingAny = isRefreshing || analyticsLoading;

  // small helpers for summary display
  const growthPercentage = analyticsData?.growthRate?.percentage;
  const growthDisplay =
    analyticsData?.growthRate?.formattedPercentage ??
    (growthPercentage != null ? `${growthPercentage}%` : "+0%");
  const growthClass =
    growthPercentage != null && growthPercentage >= 0
      ? "text-green-600"
      : "text-red-600";

  // Function to toggle order expansion
  const toggleOrderExpansion = (orderId: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const handleFilterChange = (key: keyof ReportFilterParams, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);

    // Update active filters
    const newActiveFilters = Object.entries(newFilters)
      .filter(([_, val]) => val !== "")
      .map(([key, _]) => key);
    setActiveFilters(newActiveFilters);
  };

  // Handle preview data
  const handlePreviewData = () => {
    setShowPreview(true);
    refetchPreview();
  };

  const formatDateTime = () => {
    const now = new Date();
    const date = now.toISOString().split("T")[0];
    return { date };
  };

  const handleExportPDF = async () => {
    try {
      setExportLoading("pdf");
      const pdfBlob = await apiClient.exportPdfReport(filters);
      const { date } = formatDateTime();
      const filename = `checkins_report_${date}.pdf`;
      downloadFile(pdfBlob, filename);
      setExportDropdownOpen(false);
      toastHelpers.success("PDF report exported successfully!");
    } catch (error) {
      toastHelpers.error("Failed to export PDF report");
      console.error("PDF export error:", error);
    } finally {
      setExportLoading(null);
    }
  };

  const downloadFile = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleExportExcel = async () => {
    try {
      setExportLoading("excel");
      const excelBlob = await apiClient.exportExcelReport(filters);
      const { date } = formatDateTime();
      const filename = `checkins_report_${date}.xlsx`;
      downloadFile(excelBlob, filename);
      setExportDropdownOpen(false);

      toastHelpers.success("Excel report exported successfully!");
    } catch (error) {
      toastHelpers.error("Failed to export Excel report");
      console.error("Excel export error:", error);
    } finally {
      setExportLoading(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="block sm:flex justify-between items-center transition-all duration-200">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Reports & Analytics
          </h1>
          <p className="text-muted-foreground">
            Comprehensive insights and data analysis of your restaurant
          </p>
        </div>

        <div className="flex h-15 gap-4 mt-4 sm:mt-0 relative">
          <Button
            variant="outline"
            size="sm"
            onClick={manualRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </span>
          </Button>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(value: any) => setActiveTab(value)}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileBarChart className="w-4 h-4" />
            Reports & Export
          </TabsTrigger>
        </TabsList>

        {/* Analytics Tab Content */}
        <TabsContent value="analytics" className="space-y-6 mt-6">
          {/* Period Selection for Analytics */}
          <div className="flex gap-2">
            <Button
              variant={selectedPeriod === "today" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedPeriod("today")}
            >
              Today
            </Button>
            <Button
              variant={selectedPeriod === "week" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedPeriod("week")}
            >
              This Week
            </Button>
            <Button
              variant={selectedPeriod === "month" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedPeriod("month")}
            >
              This Month
            </Button>
          </div>

          {/* Analytics Dashboard - Summary Stats */}
          <div className="relative">
            <div
              className={isLoadingAny ? "pointer-events-none opacity-50" : ""}
            >
              {isLoadingAny ? (
                <div className="grid gap-4 md:grid-cols-4">
                  {Array.from({ length: 4 }, (_, i) => (
                    <StatsCardSkeleton key={i} />
                  ))}
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Total Revenue
                      </CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatCurrency(
                          analyticsData?.totalRevenue?.amount || 0
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {analyticsData?.totalRevenue?.comparisonText}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Completed / Cancelled Orders
                      </CardTitle>
                      <ShoppingCart className="h-4 w-4 text-black" />
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col gap-2">
                        <div className="text-xl font-bold">
                          {analyticsData?.completedOrders || 0}
                          <span className="text-xs text-muted-foreground ml-2">
                            Completed
                          </span>
                        </div>
                        <div className="text-xl font-bold text-red-600">
                          {analyticsData?.cancelledOrders || 0}
                          <span className="text-xs text-muted-foreground ml-2">
                            Cancelled
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Average Order
                      </CardTitle>
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatCurrency(
                          analyticsData?.averageOrder?.amount || 0
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Per order value
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Growth Rate
                      </CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold ${growthClass}`}>
                        {growthDisplay}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Compared to previous period
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>

          {/* Analytics Data Visualization Section */}
          {!isLoadingAny && analyticsData?.data && (
            <div className="space-y-6">
              {/* Period Information */}
              <div className="text-center p-4 bg-muted/30 rounded-lg border">
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Analytics Period: {analyticsData?.period}
                </div>
                <div className="text-lg font-semibold">
                  {new Date(analyticsData.dateRange.start).toLocaleDateString(
                    "en-US",
                    {
                      weekday: "short",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    }
                  )}{" "}
                  -{" "}
                  {new Date(analyticsData.dateRange.end).toLocaleDateString(
                    "en-US",
                    {
                      weekday: "short",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    }
                  )}
                </div>
              </div>

              {/* Orders Table (Analytics Tab) */}
              <div className="border rounded-lg overflow-hidden">
                <div className="p-4 bg-muted/50 font-medium text-sm border-b">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <FileBarChart className="w-5 h-5" />
                    Orders ({analyticsData.data?.length || 0})
                  </h3>
                </div>
                <div className="relative">
                  <div className="max-h-[600px] overflow-y-auto">
                    <div className="grid grid-cols-7 gap-4 p-3 bg-white border-b font-medium text-sm sticky top-0 z-10 shadow-sm">
                      <div className="text-left">Order ID</div>
                      <div className="text-center">Type</div>
                      <div className="text-center">Status</div>
                      <div className="text-center">Items</div>
                      <div className="text-center">Amount</div>
                      <div className="text-center">Date & Time</div>
                      <div className="text-center">Actions</div>
                    </div>
                    {analyticsData.data && analyticsData.data.length > 0 ? (
                      analyticsData.data.map((order: Order, index: number) => {
                        const orderId = order.id || `order-${index}`;
                        const isExpanded = expandedOrders.has(orderId);

                        return (
                          <div key={orderId}>
                            {/* Main Order Row */}
                            <div className="grid grid-cols-7 gap-4 p-3 border-b text-sm hover:bg-muted/20 transition-colors bg-white">
                              <div className="font-mono text-xs text-left">
                                #{(order.id || "N/A").toString()}
                              </div>
                              <div className="text-center">
                                <Badge
                                  variant={
                                    order.order_type === "dine_in"
                                      ? "default"
                                      : order.order_type === "delivery"
                                        ? "secondary"
                                        : "outline"
                                  }
                                >
                                  {order.order_type?.replace("_", " ") || "N/A"}
                                </Badge>
                              </div>
                              <div className="text-center">
                                <Badge
                                  variant={
                                    order.status === "completed"
                                      ? "default"
                                      : order.status === "preparing"
                                        ? "secondary"
                                        : order.status === "cancelled"
                                          ? "destructive"
                                          : "outline"
                                  }
                                >
                                  {order.status || "N/A"}
                                </Badge>
                              </div>
                              <div className="text-center font-medium">
                                {order.OrderItems?.length || "N/A"}
                              </div>
                              <div className="text-center font-bold">
                                {formatCurrency(
                                  order.price || order.subtotal || 0
                                )}
                              </div>
                              <div className="text-center text-xs">
                                <div>
                                  {new Date(
                                    order.created_at
                                  ).toLocaleDateString()}
                                </div>
                                <div className="text-muted-foreground">
                                  {new Date(
                                    order.created_at
                                  ).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </div>
                              </div>
                              <div className="text-center">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleOrderExpansion(orderId)}
                                  className="h-6 w-6 p-0"
                                  disabled={
                                    !order.OrderItems ||
                                    order.OrderItems.length === 0
                                  }
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </div>

                            {/* Expanded Order Items */}
                            {isExpanded &&
                              order.OrderItems &&
                              order.OrderItems.length > 0 && (
                                <div className="bg-muted/10 border-b">
                                  <div className="p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                      <Package className="h-4 w-4 text-muted-foreground" />
                                      <h5 className="text-sm font-medium">
                                        Order Items
                                      </h5>
                                    </div>
                                    <div className="space-y-2">
                                      {order.OrderItems.map(
                                        (item, itemIndex) => (
                                          <div
                                            key={item.id || itemIndex}
                                            className="grid grid-cols-4 gap-4 text-xs p-2 bg-white rounded border"
                                          >
                                            <div className="font-medium">
                                              {item.Product?.name ||
                                                "Unknown Item"}
                                            </div>
                                            <div className="text-center">
                                              Qty: {item.quantity}
                                            </div>
                                            <div className="text-center">
                                              {formatCurrency(
                                                item.unit_price ||
                                                  item.price ||
                                                  0
                                              )}{" "}
                                              each
                                            </div>
                                            <div className="text-right font-medium">
                                              {formatCurrency(
                                                (item.unit_price ||
                                                  item.price ||
                                                  0) * item.quantity
                                              )}
                                            </div>
                                          </div>
                                        )
                                      )}
                                    </div>
                                    {order.notes && (
                                      <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                                        <div className="text-xs">
                                          <span className="font-medium text-yellow-800">
                                            Notes:{" "}
                                          </span>
                                          <span className="text-yellow-700">
                                            {order.notes}
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-8 text-center text-gray-500">
                        <div className="flex flex-col items-center gap-3">
                          <FileBarChart className="w-12 h-12 text-gray-400" />
                          <div>
                            <h3 className="text-lg font-medium text-gray-700 mb-1">
                              No Orders Found
                            </h3>
                            <p className="text-sm">
                              No order data available for the selected period.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Reports Tab Content */}
        <TabsContent value="reports" className="space-y-6 mt-6">
          {/* Report Filters */}
          <ReportFilters
            handleFilterChange={handleFilterChange}
            filters={filters}
            onPreviewData={handlePreviewData}
            activeFilters={activeFilters}
            clearFilter={clearFilter}
            loading={previewLoading}
            totalRecords={previewData?.length || 0}
            handleExportPDF={handleExportPDF}
            handleExportExcel={handleExportExcel}
            exportLoading={exportLoading}
            exportDropdownOpen={exportDropdownOpen}
            setExportDropdownOpen={setExportDropdownOpen}
            onRemoveAllFilters={() => {
              setFilters({
                startDate: "",
                endDate: "",
                orderType: "",
                status: "",
                minAmount: null,
                maxAmount: null,
                searchTerm: "",
              });
              setActiveFilters([]);
            }}
          />

          {/* Preview Section */}
          {showPreview && previewData && (
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-6 border">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                    Filtered Data Preview
                  </h2>
                </div>
                <span className="text-sm text-gray-500">
                  ({previewData ? previewData.length : 0} records found)
                </span>
              </div>

              {/* Quick Stats for Filtered Data */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-600 text-sm font-medium">
                        Filtered Orders
                      </p>
                      <p className="text-2xl font-bold text-blue-900">
                        {previewData.length}
                      </p>
                    </div>
                    <ShoppingCart className="w-8 h-8 text-blue-600" />
                  </div>
                </div>

                {/* <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-600 text-sm font-medium">
                        Total Value
                      </p>
                      <p className="text-2xl font-bold text-green-900">
                        {formatCurrency(
                          previewData.data.reduce(
                            (sum, order) =>
                              sum + (order.price || order.subtotal || 0),
                            0
                          )
                        )}
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-green-600" />
                  </div>
                </div> */}

                {/* <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-600 text-sm font-medium">
                        Average Order
                      </p>
                      <p className="text-2xl font-bold text-orange-900">
                        {formatCurrency(
                          analyticsData.data.length > 0
                            ? analyticsData.data.reduce(
                                (sum, order) =>
                                  sum + (order.price || order.subtotal || 0),
                                0
                              ) / analyticsData.data.length
                            : 0
                        )}
                      </p>
                    </div>
                    <BarChart3 className="w-8 h-8 text-orange-600" />
                  </div>
                </div> */}
              </div>

              <p className="text-sm text-gray-600 mb-4">
                Preview shows filtered results based on your selected criteria.
                Use the export options above for detailed reports.
              </p>
            </div>
          )}

          {/* Detailed Orders Table for Reports */}
          {previewData && (
            <div className="border rounded-lg overflow-hidden">
              <div className="p-4 bg-muted/50 font-medium text-sm border-b">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileBarChart className="w-5 h-5" />
                  Detailed Order Data ({previewData.length || 0} orders)
                </h3>
              </div>
              <div className="relative">
                <div className="max-h-[600px] overflow-y-auto">
                  <div className="grid grid-cols-7 gap-4 p-3 bg-white border-b font-medium text-sm sticky top-0 z-10 shadow-sm">
                    <div className="text-left">Order ID</div>
                    <div className="text-center">Type</div>
                    <div className="text-center">Status</div>
                    <div className="text-center">Items</div>
                    <div className="text-center">Amount</div>
                    <div className="text-center">Date & Time</div>
                    <div className="text-center">Actions</div>
                  </div>
                  {previewData && previewData.length > 0 ? (
                    previewData.map((order: Order, index: number) => {
                      const orderId = order.id || `order-${index}`;
                      const isExpanded = expandedOrders.has(orderId);

                      return (
                        <div key={orderId}>
                          {/* Main Order Row */}
                          <div className="grid grid-cols-7 gap-4 p-3 border-b text-sm hover:bg-muted/20 transition-colors bg-white">
                            <div className="font-mono text-xs text-left">
                              #{(order.id || "N/A").toString()}
                            </div>
                            <div className="text-center">
                              <Badge
                                variant={
                                  order.order_type === "dine_in"
                                    ? "default"
                                    : order.order_type === "delivery"
                                      ? "secondary"
                                      : "outline"
                                }
                              >
                                {order.order_type?.replace("_", " ") || "N/A"}
                              </Badge>
                            </div>
                            <div className="text-center">
                              <Badge
                                variant={
                                  order.status === "completed"
                                    ? "default"
                                    : order.status === "preparing"
                                      ? "secondary"
                                      : order.status === "cancelled"
                                        ? "destructive"
                                        : "outline"
                                }
                              >
                                {order.status || "N/A"}
                              </Badge>
                            </div>
                            <div className="text-center font-medium">
                              {order.OrderItems?.length || "N/A"}
                            </div>
                            <div className="text-center font-bold">
                              {formatCurrency(
                                order.price || order.subtotal || 0
                              )}
                            </div>
                            <div className="text-center text-xs">
                              <div>
                                {new Date(
                                  order.created_at
                                ).toLocaleDateString()}
                              </div>
                              <div className="text-muted-foreground">
                                {new Date(order.created_at).toLocaleTimeString(
                                  [],
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </div>
                            </div>
                            <div className="text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleOrderExpansion(orderId)}
                                className="h-6 w-6 p-0"
                                disabled={
                                  !order.OrderItems ||
                                  order.OrderItems.length === 0
                                }
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>

                          {/* Expanded Order Items */}
                          {isExpanded &&
                            order.OrderItems &&
                            order.OrderItems.length > 0 && (
                              <div className="bg-muted/10 border-b">
                                <div className="p-4">
                                  <div className="flex items-center gap-2 mb-3">
                                    <Package className="h-4 w-4 text-muted-foreground" />
                                    <h5 className="text-sm font-medium">
                                      Order Items
                                    </h5>
                                  </div>
                                  <div className="space-y-2">
                                    {order.OrderItems.map((item, itemIndex) => (
                                      <div
                                        key={item.id || itemIndex}
                                        className="grid grid-cols-4 gap-4 text-xs p-2 bg-white rounded border"
                                      >
                                        <div className="font-medium">
                                          {item.Product?.name || "Unknown Item"}
                                        </div>
                                        <div className="text-center">
                                          Qty: {item.quantity}
                                        </div>
                                        <div className="text-center">
                                          {formatCurrency(
                                            item.unit_price || item.price || 0
                                          )}{" "}
                                          each
                                        </div>
                                        <div className="text-right font-medium">
                                          {formatCurrency(
                                            (item.unit_price ||
                                              item.price ||
                                              0) * item.quantity
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  {order.notes && (
                                    <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                                      <div className="text-xs">
                                        <span className="font-medium text-yellow-800">
                                          Notes:{" "}
                                        </span>
                                        <span className="text-yellow-700">
                                          {order.notes}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-3">
                        <FileBarChart className="w-12 h-12 text-gray-400" />
                        <div>
                          <h3 className="text-lg font-medium text-gray-700 mb-1">
                            No Orders Found
                          </h3>
                          <p className="text-sm">
                            No order data available for the selected period.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
