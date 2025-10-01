import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/api/client";
import { useNavigationRefresh } from "@/hooks/useNavigationRefresh";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatsCardSkeleton } from "@/components/ui/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DollarSign,
  ShoppingCart,
  Users,
  Table,
  TrendingUp,
  Plus,
  BarChart3,
  RefreshCw,
} from "lucide-react";
import { useRouter } from "@tanstack/react-router";
import { toastHelpers } from "@/lib/toast-helpers";
import { formatCurrency } from "@/lib/utils";

interface IncomeBreakdownItem {
  period: string;
  orders: number;
  gross: number;
  service_charge: number;
  net: number;
}

function IncomeReportSkeleton({ isMobile }: { isMobile: boolean }) {
  return (
    <Card className="w-full mb-6">
      <CardHeader>
        <div
          className={`${isMobile ? "space-y-3" : "flex items-center justify-between"}`}
        >
          <div>
            <CardTitle
              className={`flex items-center gap-2 ${isMobile ? "text-lg" : ""}`}
            >
              <Skeleton className={`${isMobile ? "h-4 w-4" : "h-5 w-5"}`} />
              <Skeleton className="h-6 w-32" />
            </CardTitle>
            <CardDescription className={isMobile ? "text-sm" : ""}>
              <Skeleton className="h-4 w-48 mt-2" />
            </CardDescription>
          </div>
          <div className={`flex gap-1 ${isMobile ? "w-full" : "gap-2"}`}>
            <Skeleton className={`${isMobile ? "flex-1 h-8" : "h-8 w-16"}`} />
            <Skeleton className={`${isMobile ? "flex-1 h-8" : "h-8 w-16"}`} />
            <Skeleton className={`${isMobile ? "flex-1 h-8" : "h-8 w-16"}`} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary skeleton */}
        <div
          className={`grid gap-${isMobile ? "3" : "4"} ${isMobile ? "grid-cols-2" : "md:grid-cols-4"} mb-6`}
        >
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="text-center">
              <Skeleton
                className={`mx-auto mb-2 ${isMobile ? "h-5 w-16" : "h-8 w-20"}`}
              />
              <Skeleton
                className={`mx-auto ${isMobile ? "h-3 w-20" : "h-4 w-24"}`}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function QuickActionSkeleton({ isMobile }: { isMobile: boolean }) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className={`text-center ${isMobile ? "py-4" : ""}`}>
        <Skeleton
          className={`mx-auto mb-2 ${isMobile ? "h-6 w-6" : "h-8 w-8"}`}
        />
        <Skeleton
          className={`mx-auto mb-2 ${isMobile ? "h-4 w-24" : "h-5 w-32"}`}
        />
        <Skeleton className={`mx-auto ${isMobile ? "h-3 w-32" : "h-4 w-48"}`} />
      </CardHeader>
    </Card>
  );
}

export function AdminDashboard() {
  const router = useRouter();

  const [selectedPeriod, setSelectedPeriod] = useState<
    "today" | "week" | "month"
  >("today");
  const [isMobile, setIsMobile] = useState(false);

  const { manualRefresh, isRefreshing } = useNavigationRefresh([
    "dashboardStats",
    "incomeReport",
  ]);

  useEffect(() => {
    const decodedToken = apiClient.isAuthenticated();

    if (!decodedToken) {
      toastHelpers.sessionExpired();
      router.navigate({ to: "/login" });
    }
  }, []);

  // Responsive breakpoint detection
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: () =>
      apiClient.getDashboardStats().then((res) => {
        // console.log("Dashboard Stats:", res.data);
        return res.data;
      }),
  });

  // Fetch income report
  const { data: income, isLoading: incomeLoading } = useQuery({
    queryKey: ["incomeReport", selectedPeriod],
    queryFn: () =>
      apiClient.getIncomeReport(selectedPeriod).then((res) => res.data),
  });

  // Show loading screen when backend is called (not cache fetch)
  const isLoadingAny = incomeLoading || statsLoading || isRefreshing;

  return (
    <div
      className={`${isMobile ? "p-4" : "p-6"} space-y-${isMobile ? "4" : "6"}`}
    >
      {/* Header */}
      <div
        className={`${isMobile ? "space-y-3" : "flex items-center justify-between"}`}
      >
        <div>
          <h1
            className={`font-bold tracking-tight ${isMobile ? "text-2xl" : "text-3xl"}`}
          >
            Admin Dashboard
          </h1>
          <p className={`text-muted-foreground ${isMobile ? "text-sm" : ""}`}>
            {isMobile
              ? "Restaurant management"
              : "Manage your restaurant operations and monitor performance"}
          </p>
        </div>
        <Button
          variant="outline"
          size={isMobile ? "sm" : "default"}
          onClick={manualRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`${isMobile ? "h-3 w-3" : "h-4 w-4"}`} />
          {!isMobile && (isRefreshing ? "Refreshing..." : "Refresh")}
        </Button>
      </div>

      <div className="relative min-h-[400px]">
        <div
          className={
            isLoadingAny && !isRefreshing
              ? "pointer-events-none opacity-50"
              : ""
          }
        >
          {/* Stats Cards */}
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            {isLoadingAny ? (
              Array.from({ length: 4 }, (_, i) => <StatsCardSkeleton key={i} />)
            ) : (
              <>
                <Card>
                  <CardHeader
                    className={`flex flex-row items-center justify-between space-y-0 ${isMobile ? "pb-1" : "pb-2"}`}
                  >
                    <CardTitle
                      className={`font-medium ${isMobile ? "text-xs" : "text-sm"}`}
                    >
                      Today's Orders
                    </CardTitle>
                    <ShoppingCart
                      className={`text-muted-foreground ${isMobile ? "h-3 w-3" : "h-4 w-4"}`}
                    />
                  </CardHeader>
                  <CardContent className={isMobile ? "pt-1" : ""}>
                    <div
                      className={`font-bold ${isMobile ? "text-lg" : "text-2xl"}`}
                    >
                      {stats?.todaysOrders.count ?? 0}
                    </div>
                    <p
                      className={`text-muted-foreground ${isMobile ? "text-xs" : "text-xs"}`}
                    >
                      {stats?.todaysOrders.comparisonText ?? 0}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader
                    className={`flex flex-row items-center justify-between space-y-0 ${isMobile ? "pb-1" : "pb-2"}`}
                  >
                    <CardTitle
                      className={`font-medium ${isMobile ? "text-xs" : "text-sm"}`}
                    >
                      Today's Revenue
                    </CardTitle>
                    <DollarSign
                      className={`text-muted-foreground ${isMobile ? "h-3 w-3" : "h-4 w-4"}`}
                    />
                  </CardHeader>
                  <CardContent className={isMobile ? "pt-1" : ""}>
                    <div
                      className={`font-bold ${isMobile ? "text-lg" : "text-2xl"}`}
                    >
                      {formatCurrency(stats?.todaysRevenue.amount ?? 0)}
                    </div>
                    <p
                      className={`text-muted-foreground ${isMobile ? "text-xs" : "text-xs"}`}
                    >
                      {stats?.todaysRevenue.comparisonText ?? 0}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader
                    className={`flex flex-row items-center justify-between space-y-0 ${isMobile ? "pb-1" : "pb-2"}`}
                  >
                    <CardTitle
                      className={`font-medium ${isMobile ? "text-xs" : "text-sm"}`}
                    >
                      Active Orders
                    </CardTitle>
                    <Users
                      className={`text-muted-foreground ${isMobile ? "h-3 w-3" : "h-4 w-4"}`}
                    />
                  </CardHeader>
                  <CardContent className={isMobile ? "pt-1" : ""}>
                    <div
                      className={`font-bold ${isMobile ? "text-lg" : "text-2xl"}`}
                    >
                      {stats?.activeOrders ?? 0}
                    </div>
                    <p
                      className={`text-muted-foreground ${isMobile ? "text-xs" : "text-xs"}`}
                    >
                      Currently being processed
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader
                    className={`flex flex-row items-center justify-between space-y-0 ${isMobile ? "pb-1" : "pb-2"}`}
                  >
                    <CardTitle
                      className={`font-medium ${isMobile ? "text-xs" : "text-sm"}`}
                    >
                      Occupied Tables
                    </CardTitle>
                    <Table
                      className={`text-muted-foreground ${isMobile ? "h-3 w-3" : "h-4 w-4"}`}
                    />
                  </CardHeader>
                  <CardContent className={isMobile ? "pt-1" : ""}>
                    <div
                      className={`font-bold ${isMobile ? "text-lg" : "text-2xl"}`}
                    >
                      {stats?.occupiedTables ?? 0}
                    </div>
                    <p
                      className={`text-muted-foreground ${isMobile ? "text-xs" : "text-xs"}`}
                    >
                      Tables currently in use
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Income Report */}
          {isLoadingAny ? (
            <IncomeReportSkeleton isMobile={isMobile} />
          ) : (
            <Card className="w-full mb-6">
              <CardHeader>
                <div
                  className={`${isMobile ? "space-y-3" : "flex items-center justify-between"}`}
                >
                  <div>
                    <CardTitle
                      className={`flex items-center gap-2 ${isMobile ? "text-lg" : ""}`}
                    >
                      <TrendingUp
                        className={`${isMobile ? "h-4 w-4" : "h-5 w-5"}`}
                      />
                      Income Report
                    </CardTitle>
                    <CardDescription className={isMobile ? "text-sm" : ""}>
                      {isMobile
                        ? "Revenue breakdown"
                        : "Detailed breakdown of revenue and performance"}
                    </CardDescription>
                  </div>
                  <div
                    className={`flex gap-1 ${isMobile ? "w-full" : "gap-2"}`}
                  >
                    <Button
                      variant={
                        selectedPeriod === "today" ? "default" : "outline"
                      }
                      size={isMobile ? "sm" : "sm"}
                      onClick={() => setSelectedPeriod("today")}
                      className={isMobile ? "flex-1 text-xs" : ""}
                    >
                      Today
                    </Button>
                    <Button
                      variant={
                        selectedPeriod === "week" ? "default" : "outline"
                      }
                      size={isMobile ? "sm" : "sm"}
                      onClick={() => setSelectedPeriod("week")}
                      className={isMobile ? "flex-1 text-xs" : ""}
                    >
                      Week
                    </Button>
                    <Button
                      variant={
                        selectedPeriod === "month" ? "default" : "outline"
                      }
                      size={isMobile ? "sm" : "sm"}
                      onClick={() => setSelectedPeriod("month")}
                      className={isMobile ? "flex-1 text-xs" : ""}
                    >
                      Month
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {income ? (
                  <div className="space-y-6">
                    {/* Summary */}
                    <div
                      className={`grid gap-${isMobile ? "3" : "4"} ${isMobile ? "grid-cols-2" : "md:grid-cols-4"}`}
                    >
                      <div className="text-center">
                        <div
                          className={`font-bold text-blue-600 ${isMobile ? "text-lg" : "text-2xl"}`}
                        >
                          {income.summary.totalOrders}
                        </div>
                        <div
                          className={`text-muted-foreground ${isMobile ? "text-xs" : "text-sm"}`}
                        >
                          Total Orders
                        </div>
                      </div>
                      <div className="text-center">
                        <div
                          className={`font-bold text-green-600 ${isMobile ? "text-lg" : "text-2xl"}`}
                        >
                          {formatCurrency(income.summary.grossIncome)}
                        </div>
                        <div
                          className={`text-muted-foreground ${isMobile ? "text-xs" : "text-sm"}`}
                        >
                          Gross Income
                        </div>
                      </div>
                      <div className="text-center">
                        <div
                          className={`font-bold text-purple-600 ${isMobile ? "text-lg" : "text-2xl"}`}
                        >
                          {formatCurrency(
                            income.summary.serviceChargeCollected
                          )}
                        </div>
                        <div
                          className={`text-muted-foreground ${isMobile ? "text-xs" : "text-sm"}`}
                        >
                          Service Charge Collected
                        </div>
                      </div>
                      <div className="text-center">
                        <div
                          className={`font-bold text-orange-600 ${isMobile ? "text-lg" : "text-2xl"}`}
                        >
                          {formatCurrency(income.summary.netIncome)}
                        </div>
                        <div
                          className={`text-muted-foreground ${isMobile ? "text-xs" : "text-sm"}`}
                        >
                          Net Income
                        </div>
                      </div>
                    </div>

                    {/* Breakdown Table */}
                    {income.breakdown && income.breakdown.length > 0 && (
                      <div className="border rounded-lg overflow-x-auto">
                        {isMobile ? (
                          // Mobile: Stack layout for better readability
                          <div className="space-y-2 p-3">
                            {income.breakdown
                              .slice(0, 5) // Show fewer items on mobile
                              .map(
                                (item: IncomeBreakdownItem, index: number) => (
                                  <div
                                    key={index}
                                    className="border rounded-lg p-3 space-y-2"
                                  >
                                    <div className="font-medium text-sm">
                                      {new Date(
                                        item.period
                                      ).toLocaleDateString()}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                      <div>
                                        <div className="text-muted-foreground">
                                          Orders
                                        </div>
                                        <div className="font-medium">
                                          {item.orders}
                                        </div>
                                      </div>
                                      <div>
                                        <div className="text-muted-foreground">
                                          Gross
                                        </div>
                                        <div className="font-medium">
                                          {formatCurrency(item.gross)}
                                        </div>
                                      </div>
                                      <div>
                                        <div className="text-muted-foreground">
                                          Service Charge
                                        </div>
                                        <div className="font-medium">
                                          {formatCurrency(item.service_charge)}
                                        </div>
                                      </div>
                                      <div>
                                        <div className="text-muted-foreground">
                                          Net
                                        </div>
                                        <div className="font-medium">
                                          {formatCurrency(item.net)}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )
                              )}
                          </div>
                        ) : (
                          // Desktop: Table layout
                          <>
                            <div className="grid grid-cols-5 gap-4 p-4 bg-muted/50 font-medium text-sm">
                              <div>Period</div>
                              <div className="text-center">Orders</div>
                              <div className="text-center">Gross</div>
                              <div className="text-center">Service Charge</div>
                              <div className="text-center">Net</div>
                            </div>
                            {income.breakdown
                              .slice(0, 10)
                              .map(
                                (item: IncomeBreakdownItem, index: number) => (
                                  <div
                                    key={index}
                                    className="grid grid-cols-5 gap-4 p-4 border-t text-sm"
                                  >
                                    <div className="font-medium">
                                      {new Date(
                                        item.period
                                      ).toLocaleDateString()}
                                    </div>
                                    <div className="text-center">
                                      {item.orders}
                                    </div>
                                    <div className="text-center">
                                      {formatCurrency(item.gross)}
                                    </div>
                                    <div className="text-center">
                                      {formatCurrency(item.service_charge)}
                                    </div>
                                    <div className="text-center font-medium">
                                      {formatCurrency(item.net)}
                                    </div>
                                  </div>
                                )
                              )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No income data available
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <div
            className={`grid gap-${isMobile ? "3" : "4"} ${isMobile ? "grid-cols-1 sm:grid-cols-2" : "md:grid-cols-2 lg:grid-cols-4"}`}
          >
            {isLoadingAny ? (
              Array.from({ length: 4 }, (_, i) => (
                <QuickActionSkeleton key={i} isMobile={isMobile} />
              ))
            ) : (
              <>
                <Card
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => router.navigate({ to: "/admin/menu" })}
                >
                  <CardHeader
                    className={`text-center ${isMobile ? "py-4" : ""}`}
                  >
                    <Plus
                      className={`mx-auto text-blue-600 ${isMobile ? "h-6 w-6" : "h-8 w-8"}`}
                    />
                    <CardTitle className={isMobile ? "text-base" : "text-lg"}>
                      Manage Menu
                    </CardTitle>
                    <CardDescription className={isMobile ? "text-xs" : ""}>
                      {isMobile
                        ? "Add, edit menu items"
                        : "Add, edit, or remove menu items and categories"}
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => router.navigate({ to: "/admin/tables" })}
                >
                  <CardHeader
                    className={`text-center ${isMobile ? "py-4" : ""}`}
                  >
                    <Table
                      className={`mx-auto text-green-600 ${isMobile ? "h-6 w-6" : "h-8 w-8"}`}
                    />
                    <CardTitle className={isMobile ? "text-base" : "text-lg"}>
                      Manage Tables
                    </CardTitle>
                    <CardDescription className={isMobile ? "text-xs" : ""}>
                      {isMobile
                        ? "Configure dining tables"
                        : "Configure dining tables and seating arrangements"}
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => router.navigate({ to: "/admin/staff" })}
                >
                  <CardHeader
                    className={`text-center ${isMobile ? "py-4" : ""}`}
                  >
                    <Users
                      className={`mx-auto text-purple-600 ${isMobile ? "h-6 w-6" : "h-8 w-8"}`}
                    />
                    <CardTitle className={isMobile ? "text-base" : "text-lg"}>
                      Manage Staff
                    </CardTitle>
                    <CardDescription className={isMobile ? "text-xs" : ""}>
                      {isMobile
                        ? "Add, edit staff accounts"
                        : "Add, edit staff accounts and manage permissions"}
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => router.navigate({ to: "/admin/reports" })}
                >
                  <CardHeader
                    className={`text-center ${isMobile ? "py-4" : ""}`}
                  >
                    <BarChart3
                      className={`mx-auto text-orange-600 ${isMobile ? "h-6 w-6" : "h-8 w-8"}`}
                    />
                    <CardTitle className={isMobile ? "text-base" : "text-lg"}>
                      View Reports
                    </CardTitle>
                    <CardDescription className={isMobile ? "text-xs" : ""}>
                      {isMobile
                        ? "Analytics and reports"
                        : "Detailed analytics and performance reports"}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
