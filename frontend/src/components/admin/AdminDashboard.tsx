import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/api/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  ShoppingCart,
  Users,
  Table,
  TrendingUp,
  Plus,
  BarChart3,
} from "lucide-react";

interface IncomeBreakdownItem {
  period: string;
  orders: number;
  gross: number;
  tax: number;
  net: number;
}

export function AdminDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState<
    "today" | "week" | "month"
  >("today");
  const [isMobile, setIsMobile] = useState(false);

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
        console.log("Dashboard Stats:", res.data);
        return res.data;
      }),
  });

  // Fetch income report
  const { data: income, isLoading: incomeLoading } = useQuery({
    queryKey: ["incomeReport", selectedPeriod],
    queryFn: () =>
      apiClient.getIncomeReport(selectedPeriod).then((res) => res.data),
  });
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
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
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
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
            <div className={`font-bold ${isMobile ? "text-lg" : "text-2xl"}`}>
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
            <div className={`font-bold ${isMobile ? "text-lg" : "text-2xl"}`}>
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
            <div className={`font-bold ${isMobile ? "text-lg" : "text-2xl"}`}>
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
            <div className={`font-bold ${isMobile ? "text-lg" : "text-2xl"}`}>
              {stats?.occupiedTables ?? 0}
            </div>
            <p
              className={`text-muted-foreground ${isMobile ? "text-xs" : "text-xs"}`}
            >
              Tables currently in use
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Income Report */}
      <Card className="w-full">
        <CardHeader>
          <div
            className={`${isMobile ? "space-y-3" : "flex items-center justify-between"}`}
          >
            <div>
              <CardTitle
                className={`flex items-center gap-2 ${isMobile ? "text-lg" : ""}`}
              >
                <TrendingUp className={`${isMobile ? "h-4 w-4" : "h-5 w-5"}`} />
                Income Report
              </CardTitle>
              <CardDescription className={isMobile ? "text-sm" : ""}>
                {isMobile
                  ? "Revenue breakdown"
                  : "Detailed breakdown of revenue and performance"}
              </CardDescription>
            </div>
            <div className={`flex gap-1 ${isMobile ? "w-full" : "gap-2"}`}>
              <Button
                variant={selectedPeriod === "today" ? "default" : "outline"}
                size={isMobile ? "sm" : "sm"}
                onClick={() => setSelectedPeriod("today")}
                className={isMobile ? "flex-1 text-xs" : ""}
              >
                Today
              </Button>
              <Button
                variant={selectedPeriod === "week" ? "default" : "outline"}
                size={isMobile ? "sm" : "sm"}
                onClick={() => setSelectedPeriod("week")}
                className={isMobile ? "flex-1 text-xs" : ""}
              >
                Week
              </Button>
              <Button
                variant={selectedPeriod === "month" ? "default" : "outline"}
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
          {incomeLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : income ? (
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
                    className={`font-bold text-orange-600 ${isMobile ? "text-lg" : "text-2xl"}`}
                  >
                    {formatCurrency(income.summary.taxCollected)}
                  </div>
                  <div
                    className={`text-muted-foreground ${isMobile ? "text-xs" : "text-sm"}`}
                  >
                    Tax Collected
                  </div>
                </div>
                <div className="text-center">
                  <div
                    className={`font-bold text-purple-600 ${isMobile ? "text-lg" : "text-2xl"}`}
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
                        .map((item: IncomeBreakdownItem, index: number) => (
                          <div
                            key={index}
                            className="border rounded-lg p-3 space-y-2"
                          >
                            <div className="font-medium text-sm">
                              {new Date(item.period).toLocaleDateString()}
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <div className="text-muted-foreground">
                                  Orders
                                </div>
                                <div className="font-medium">{item.orders}</div>
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
                                <div className="text-muted-foreground">Tax</div>
                                <div className="font-medium">
                                  {formatCurrency(item.tax)}
                                </div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Net</div>
                                <div className="font-medium">
                                  {formatCurrency(item.net)}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    // Desktop: Table layout
                    <>
                      <div className="grid grid-cols-5 gap-4 p-4 bg-muted/50 font-medium text-sm">
                        <div>Period</div>
                        <div className="text-center">Orders</div>
                        <div className="text-center">Gross</div>
                        <div className="text-center">Tax</div>
                        <div className="text-center">Net</div>
                      </div>
                      {income.breakdown
                        .slice(0, 10)
                        .map((item: IncomeBreakdownItem, index: number) => (
                          <div
                            key={index}
                            className="grid grid-cols-5 gap-4 p-4 border-t text-sm"
                          >
                            <div className="font-medium">
                              {new Date(item.period).toLocaleDateString()}
                            </div>
                            <div className="text-center">{item.orders}</div>
                            <div className="text-center">
                              {formatCurrency(item.gross)}
                            </div>
                            <div className="text-center">
                              {formatCurrency(item.tax)}
                            </div>
                            <div className="text-center font-medium">
                              {formatCurrency(item.net)}
                            </div>
                          </div>
                        ))}
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

      {/* Quick Actions */}
      <div
        className={`grid gap-${isMobile ? "3" : "4"} ${isMobile ? "grid-cols-1 sm:grid-cols-2" : "md:grid-cols-2 lg:grid-cols-4"}`}
      >
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className={`text-center ${isMobile ? "py-4" : ""}`}>
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

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className={`text-center ${isMobile ? "py-4" : ""}`}>
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

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className={`text-center ${isMobile ? "py-4" : ""}`}>
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

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className={`text-center ${isMobile ? "py-4" : ""}`}>
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
      </div>
    </div>
  );
}
