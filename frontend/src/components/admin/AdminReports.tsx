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
} from "lucide-react";
import { useNavigationRefresh } from "@/hooks/useNavigationRefresh";
import apiClient from "@/api/client";
import { useRouter } from "@tanstack/react-router";
import { toastHelpers } from "@/lib/toast-helpers";
import { formatCurrency } from "@/lib/utils";
import type { Order } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

// Simple loading state component
function LoadingState() {
  return (
    <div className="flex justify-center items-center py-8">
      <span className="text-muted-foreground">Loading...</span>
    </div>
  );
}

export function AdminReports() {
  const router = useRouter();

  // Auto-refresh data when navigating to this page
  const { manualRefresh, isRefreshing } = useNavigationRefresh([
    "salesReport",
    "ordersReport",
    "incomeReport",
    "analytics",
  ]);

  const [activeTab, setActiveTab] = useState<"sales" | "orders" | "analytics">(
    "sales"
  );
  const [selectedPeriod, setSelectedPeriod] = useState<
    "today" | "week" | "month"
  >("today");
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  useEffect(() => {
    const decodedToken = apiClient.isAuthenticated();

    if (!decodedToken) {
      toastHelpers.sessionExpired();
      router.navigate({ to: "/login" });
    }
  }, []);

  // Real API calls for reports data
  const {
    data: salesData,
    isLoading: salesLoading,
    error: salesError,
  } = useQuery({
    queryKey: ["salesReport", selectedPeriod],
    queryFn: () =>
      apiClient.getSalesReport(selectedPeriod).then((res) => {
        console.log("Sales data:", res.data);
        return res.data;
      }),
  });

  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ["analytics", selectedPeriod],
    queryFn: async () => {
      const res = await apiClient.getAnalytics(selectedPeriod);
      // console.log("Analytics data:", res.data);
      return res.data;
    },
  });

  const isLoadingAny = isRefreshing || analyticsLoading || salesLoading;

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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Reports & Analytics
          </h1>
          <p className="text-muted-foreground">
            Detailed insights into your restaurant performance
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={manualRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
          {/* <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Calendar className="w-4 h-4 mr-2" />
            Custom Range
          </Button> */}
        </div>
      </div>

      {/* Period Selection */}
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

      {/* Main Content Area */}
      <div className="relative">
        <div className={isLoadingAny ? "pointer-events-none opacity-50" : ""}>
          {/* Summary Stats */}
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
                    {formatCurrency(analyticsData?.totalRevenue?.amount || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {selectedPeriod === "today"
                      ? "Today"
                      : `This ${selectedPeriod}`}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Orders
                  </CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analyticsData?.totalOrders?.count || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {selectedPeriod === "today"
                      ? "Today"
                      : `This ${selectedPeriod}`}
                  </p>
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
                    {formatCurrency(analyticsData?.averageOrder?.amount || 0)}
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

          {/* Reports Tabs */}
          <div className="mt-6">
            <Tabs
              value={activeTab}
              onValueChange={(value: any) => setActiveTab(value)}
            >
              <TabsList>
                {isLoadingAny ? (
                  <div className="flex gap-2 px-2 py-1">
                    <div className="h-9 w-32 bg-muted/40 rounded animate-pulse" />
                    <div className="h-9 w-36 bg-muted/30 rounded animate-pulse" />
                    <div className="h-9 w-24 bg-muted/30 rounded animate-pulse" />
                  </div>
                ) : (
                  <>
                    <TabsTrigger value="sales">Sales Report</TabsTrigger>
                  </>
                )}
              </TabsList>

              {/* Enhanced spacing and skeleton loading */}
              <div className="mt-6">
                <div className="mt-6" />
                {isLoadingAny && (
                  <div className="space-y-8">
                    {/* Report Card Skeleton */}
                    <div className="bg-white rounded-lg border">
                      <div className="p-6 border-b">
                        <div className="flex items-center gap-2">
                          <div className="bg-muted animate-pulse rounded h-5 w-5" />
                          <div className="bg-muted animate-pulse rounded h-6 w-48" />
                        </div>
                      </div>
                      <div className="p-6 space-y-6">
                        {/* Period selector skeleton */}
                        <div className="flex gap-2">
                          <div className="bg-muted animate-pulse rounded h-8 w-20" />
                          <div className="bg-muted animate-pulse rounded h-8 w-20" />
                          <div className="bg-muted animate-pulse rounded h-8 w-20" />
                        </div>

                        {/* Table skeleton */}
                        <div className="space-y-4">
                          <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
                            <div className="bg-muted animate-pulse rounded h-4" />
                            <div className="bg-muted animate-pulse rounded h-4" />
                            <div className="bg-muted animate-pulse rounded h-4" />
                          </div>
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className="grid grid-cols-3 gap-4 p-4 border-b"
                            >
                              <div className="bg-muted animate-pulse rounded h-4" />
                              <div className="bg-muted animate-pulse rounded h-4" />
                              <div className="bg-muted animate-pulse rounded h-4" />
                            </div>
                          ))}
                        </div>

                        {/* Chart skeleton */}
                        <div className="bg-muted animate-pulse rounded-lg h-64 w-full" />
                      </div>
                    </div>
                  </div>
                )}

                <div className={isLoadingAny ? "hidden" : ""}>
                  {/* Sales Report Tab */}
                  <TabsContent value="sales" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BarChart3 className="h-5 w-5" />
                          Sales Report - {selectedPeriod}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {salesLoading ? (
                          <LoadingState />
                        ) : salesError ? (
                          <div className="text-center py-8 text-red-600">
                            Error loading sales data:{" "}
                            {(salesError as any).message}
                          </div>
                        ) : salesData && salesData.data.length > 0 ? (
                          <div className="space-y-6">
                            {/* Period Information */}
                            <div className="text-center p-4 bg-muted/30 rounded-lg border">
                              <div className="text-sm font-medium text-muted-foreground mb-1">
                                Report Period: {salesData.period}
                              </div>
                              <div className="text-lg font-semibold">
                                {new Date(
                                  salesData.dateRange.start
                                ).toLocaleDateString("en-US", {
                                  weekday: "short",
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}{" "}
                                -{" "}
                                {new Date(
                                  salesData.dateRange.end
                                ).toLocaleDateString("en-US", {
                                  weekday: "short",
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </div>
                            </div>

                            {/* Detailed Orders Table */}
                            <div className="border rounded-lg overflow-hidden">
                              <div className="p-4 bg-muted/50 font-medium text-sm border-b">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                  <FileBarChart className="w-5 h-5" />
                                  Order Details ({salesData.data.length} orders)
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
                                    <div className="text-center">
                                      Date & Time
                                    </div>
                                    <div className="text-center">Actions</div>
                                  </div>
                                  {salesData.data.map(
                                    (order: Order, index: number) => {
                                      const orderId =
                                        order.id || `order-${index}`;
                                      const isExpanded =
                                        expandedOrders.has(orderId);

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
                                                    : order.order_type ===
                                                        "delivery"
                                                      ? "secondary"
                                                      : "outline"
                                                }
                                              >
                                                {order.order_type?.replace(
                                                  "_",
                                                  " "
                                                ) || "N/A"}
                                              </Badge>
                                            </div>
                                            <div className="text-center">
                                              <Badge
                                                variant={
                                                  order.status === "completed"
                                                    ? "default"
                                                    : order.status ===
                                                        "preparing"
                                                      ? "secondary"
                                                      : order.status ===
                                                          "cancelled"
                                                        ? "destructive"
                                                        : "outline"
                                                }
                                              >
                                                {order.status || "N/A"}
                                              </Badge>
                                            </div>
                                            <div className="text-center font-medium">
                                              {order.OrderItems?.length ||
                                                "N/A"}
                                            </div>
                                            <div className="text-center font-bold">
                                              {formatCurrency(
                                                order.price ||
                                                  order.subtotal ||
                                                  0
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
                                                onClick={() =>
                                                  toggleOrderExpansion(orderId)
                                                }
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
                                                          key={
                                                            item.id || itemIndex
                                                          }
                                                          className="grid grid-cols-4 gap-4 text-xs p-2 bg-white rounded border"
                                                        >
                                                          <div className="font-medium">
                                                            {item.Product
                                                              ?.name ||
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
                                                                0) *
                                                                item.quantity
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
                                    }
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Order Status Summary */}
                            <div className="border rounded-lg p-4">
                              <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5" />
                                Order Status Breakdown
                              </h4>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {(() => {
                                  const statusCounts = salesData.data.reduce(
                                    (acc: any, order) => {
                                      const status = order.status || "unknown";
                                      acc[status] = (acc[status] || 0) + 1;
                                      return acc;
                                    },
                                    {}
                                  );

                                  return Object.entries(statusCounts).map(
                                    ([status, count]: [string, any]) => (
                                      <div
                                        key={status}
                                        className="text-center p-3 bg-muted/30 rounded-lg"
                                      >
                                        <div className="text-sm text-muted-foreground capitalize mb-1">
                                          {status}
                                        </div>
                                        <div className="text-2xl font-bold">
                                          {count}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          {(
                                            (count / salesData.data.length) *
                                            100
                                          ).toFixed(1)}
                                          %
                                        </div>
                                      </div>
                                    )
                                  );
                                })()}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            No sales data available for this period
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </div>
              </div>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
