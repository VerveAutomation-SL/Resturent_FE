import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCardSkeleton } from "@/components/ui/skeletons";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  FileBarChart,
  ChevronDown,
  ChevronRight,
  Package,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { Order } from "@/types";

interface AdminAnalyticsDashboardProps {
  selectedPeriod: "today" | "week" | "month";
  setSelectedPeriod: (period: "today" | "week" | "month") => void;
  isLoadingAny: boolean;
  analyticsData: any;
  expandedOrders: Set<string>;
  toggleOrderExpansion: (orderId: string) => void;
  growthClass: string;
  growthDisplay: string;
}

export const AdminAnalyticsDashboard: React.FC<
  AdminAnalyticsDashboardProps
> = ({
  selectedPeriod,
  setSelectedPeriod,
  isLoadingAny,
  analyticsData,
  expandedOrders,
  toggleOrderExpansion,
  growthClass,
  growthDisplay,
}) => {
  return (
    <>
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
        <div className={isLoadingAny ? "pointer-events-none opacity-50" : ""}>
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
                            {formatCurrency(order.price || order.subtotal || 0)}
                          </div>
                          <div className="text-center text-xs">
                            <div>
                              {new Date(order.created_at).toLocaleDateString()}
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
                                          (item.unit_price || item.price || 0) *
                                            item.quantity
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
        </div>
      )}
    </>
  );
};
