import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Package,
  Users,
  Calendar,
} from "lucide-react";
import { InventorySummary, Transaction } from "@/types";
import { formatCurrency } from "@/lib/utils";

type Props = {
  alerts?: any[];
  transactions?: Transaction[];
  stockItems?: any[];
  setActiveTab: (v: string) => void;
  setShowTransactionForm: (v: boolean) => void;
  stockStats?: InventorySummary;
};

export default function StockDashboard({
  alerts = [],
  transactions = [],
  stockItems = [],
  setActiveTab,
  stockStats,
}: Props) {
  // Top suppliers by value
  const supplierStats = stockItems.reduce(
    (acc, item) => {
      const supplier = item.supplier || "Unknown";
      if (!acc[supplier]) {
        acc[supplier] = { count: 0, value: 0 };
      }
      acc[supplier].count += 1;
      acc[supplier].value += item.quantity * item.cost_per_unit;
      return acc;
    },
    {} as Record<string, { count: number; value: number }>
  );

  const topSuppliers = (
    Object.entries(supplierStats) as [
      string,
      { count: number; value: number },
    ][]
  )
    .sort(
      (
        [, a]: [string, { count: number; value: number }],
        [, b]: [string, { count: number; value: number }]
      ) => b.value - a.value
    )
    .slice(0, 3);

  // Helper to safely format percentages (avoid NaN when denominator is zero)
  const formatPercent = (numerator: number, denominator: number) => {
    if (!denominator || denominator === 0) return "0.0%";
    return `${((numerator / denominator) * 100).toFixed(1)}%`;
  };

  return (
    <div className="space-y-6 mt-8">
      {/* Enhanced Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Items
                </p>
                <p className="text-2xl font-bold">{stockStats?.total}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stockStats?.inStock} in stock
                </p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Value
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency(stockStats?.totalValue ?? 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  <TrendingUp className="w-3 h-3 inline mr-1" />
                  Current inventory
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Low Stock Items
                </p>
                <p className="text-2xl font-bold text-yellow-600">
                  {stockStats?.lowStock}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Need attention
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Out of Stock
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {stockStats?.outOfStock}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Urgent restock
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stock Distribution & Top Suppliers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="h-full">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Top Suppliers by Value
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 flex flex-col justify-between h-full">
            <div className="space-y-3">
              {topSuppliers.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Users className="mx-auto h-10 w-10 text-gray-400" />
                  <p className="mt-3 text-sm font-medium text-foreground">
                    No suppliers found
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Add stock items with suppliers to see top suppliers by
                    value.
                  </p>
                </div>
              ) : (
                topSuppliers.map(([supplier, data]) => (
                  <div
                    key={supplier}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {supplier.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{supplier}</p>
                        <p className="text-xs text-muted-foreground">
                          {data.count} items
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {formatCurrency(data.value)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatPercent(data.value, stockStats?.totalValue ?? 0)}{" "}
                        of total
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="w-4 h-4" />
              Recent Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 flex flex-col justify-between h-full">
            <div className="space-y-2">
              {alerts.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <AlertCircle className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-sm font-medium text-foreground">
                    No active alerts
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    You're all caught up — no alerts at the moment.
                  </p>
                </div>
              ) : (
                alerts.slice(0, 3).map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between p-2 border rounded hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setActiveTab("alerts")}
                  >
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                      <div>
                        <p className="text-sm font-medium flex items-center gap-2">
                          {alert.Ingredient.name || alert.ingredient_name}
                          {alert.severity === "high" && (
                            <Badge
                              variant="destructive"
                              className="text-xs px-1 py-0"
                            >
                              High
                            </Badge>
                          )}
                          {alert.severity === "medium" && (
                            <Badge
                              variant="outline"
                              className="text-xs px-1 py-0"
                            >
                              Medium
                            </Badge>
                          )}
                        </p>

                        <p className="text-xs text-muted-foreground">
                          {Number(
                            alert.current_quantity ?? alert.current_qty ?? 0
                          )}{" "}
                          {alert.unit || alert.item_unit || "units"} remaining
                          {alert.alert_type === "out_of_stock"
                            ? " - Out of stock"
                            : " - Running low"}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">→</div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <Button
              onClick={() => setActiveTab("inventory")}
              variant="outline"
              size="sm"
              className="h-16 flex-col"
            >
              <Eye className="w-4 h-4 mb-2" />
              View All Stock
            </Button>
            <Button
              onClick={() => setActiveTab("transactions")}
              variant="outline"
              size="sm"
              className="h-16 flex-col"
            >
              <TrendingUp className="w-4 h-4 mb-2" />
              Recent Transactions
            </Button>
            <Button
              onClick={() => setShowTransactionForm(true)}
              variant="outline"
              size="sm"
              className="h-16 flex-col"
            >
              <Upload className="w-4 h-4 mb-2" />
              Record Transaction
            </Button>
            <Button
              onClick={() => setActiveTab("alerts")}
              variant="outline"
              size="sm"
              className="h-16 flex-col"
            >
              <AlertCircle className="w-4 h-4 mb-2" />
              Alerts ({alerts.filter((a) => !a.resolved).length})
            </Button>
            <Button
              onClick={() => setActiveTab("purchase-orders")}
              variant="outline"
              size="sm"
              className="h-16 flex-col"
            >
              <ShoppingCart className="w-4 h-4 mb-2" />
              Purchase Orders
            </Button>
            <Button
              onClick={() => setActiveTab("reports")}
              variant="outline"
              size="sm"
              className="h-16 flex-col"
            >
              <BarChart3 className="w-4 h-4 mb-2" />
              Reports & Analytics
            </Button>
          </div>
        </CardContent>
      </Card> */}

      {/* Transaction Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Recent Transactions
                </p>
                <p className="text-2xl font-bold">{transactions.length}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {
                    transactions.filter(
                      (t) =>
                        new Date(t.transaction_date || t.created_at) >=
                        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                    ).length
                  }{" "}
                  in last 7 days
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Transaction Value
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency(
                    transactions
                      .filter(
                        (t) =>
                          (t.transaction_type === "stock_out" ||
                            t.transaction_type === "usage") &&
                          Number(t.total_cost || 0)
                      )
                      .reduce((sum, t) => sum + Number(t.total_cost || 0), 0)
                  )}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Stock out costs
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Pending Approvals
                </p>
                <p className="text-2xl font-bold text-yellow-600">
                  {transactions.filter((t) => t.status === "pending").length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Awaiting approval
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Stock Movements
                </p>
                <p className="text-lg font-bold text-green-600">
                  +
                  {
                    transactions.filter(
                      (t) =>
                        t.transaction_type === "stock_in" ||
                        t.transaction_type === "purchase"
                    ).length
                  }
                </p>
                <p className="text-lg font-bold text-red-600">
                  -
                  {
                    transactions.filter(
                      (t) =>
                        t.transaction_type === "stock_out" ||
                        t.transaction_type === "usage"
                    ).length
                  }
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  In / Out movements
                </p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Recent Transactions
          </CardTitle>
          <button
            onClick={() => setActiveTab("transactions")}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline"
          >
            View All →
          </button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {transactions.slice(0, 5).map((transaction) => {
              const item = stockItems.find(
                (s) => s.id === transaction.ingredient_id
              );

              // Determine transaction type info
              const getTransactionTypeInfo = () => {
                switch (transaction.transaction_type) {
                  case "stock_in":
                    return {
                      color: "bg-green-500",
                      icon: "📈",
                      label: "Stock In",
                      textColor: "text-green-600",
                    };
                  case "stock_out":
                    return {
                      color: "bg-red-500",
                      icon: "📉",
                      label: "Stock Out",
                      textColor: "text-red-600",
                    };
                  case "manual_adjustment":
                    return {
                      color: "bg-blue-500",
                      icon: "⚙️",
                      label: "Adjustment",
                      textColor: "text-blue-600",
                    };
                  case "purchase":
                    return {
                      color: "bg-green-500",
                      icon: "🛒",
                      label: "Purchase",
                      textColor: "text-green-600",
                    };
                  case "usage":
                    return {
                      color: "bg-orange-500",
                      icon: "🍽️",
                      label: "Usage",
                      textColor: "text-orange-600",
                    };
                  default:
                    return {
                      color: "bg-gray-500",
                      icon: "📄",
                      label: "Transaction",
                      textColor: "text-gray-600",
                    };
                }
              };

              const typeInfo = getTransactionTypeInfo();
              const quantityChange = transaction.quantity
                ? (Number(transaction.quantity) >= 0 ? "+" : "-") +
                  transaction.quantity
                : transaction.previous_quantity && transaction.new_quantity
                  ? (
                      Number(transaction.new_quantity) -
                      Number(transaction.previous_quantity)
                    ).toString()
                  : "N/A";

              return (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className={`w-4 h-4 rounded-full ${typeInfo.color} flex items-center justify-center`}
                      >
                        <span className="text-xs text-white font-bold">
                          {typeInfo.icon}
                        </span>
                      </div>
                      <div className="text-xs text-center">
                        <Badge
                          variant={
                            transaction.status === "completed"
                              ? "default"
                              : transaction.status === "pending"
                                ? "secondary"
                                : "outline"
                          }
                          className="text-xs px-1 py-0"
                        >
                          {transaction.status?.toUpperCase() || "N/A"}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm">
                          {item?.name ||
                            transaction.Ingredient?.name ||
                            "Unknown Item"}
                        </p>
                        <Badge variant="outline" className="text-xs px-2 py-0">
                          {typeInfo.label}
                        </Badge>
                      </div>

                      <div className="space-y-1">
                        {/* Quantity Change */}
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-muted-foreground">
                            Quantity:
                          </span>
                          {transaction.previous_quantity &&
                          transaction.new_quantity ? (
                            <span className="font-medium">
                              {transaction.previous_quantity} →{" "}
                              {transaction.new_quantity}{" "}
                              {item?.unit ||
                                transaction.Ingredient?.unit ||
                                "units"}
                            </span>
                          ) : (
                            <span
                              className={`font-medium ${typeInfo.textColor}`}
                            >
                              {quantityChange}{" "}
                              {item?.unit ||
                                transaction.Ingredient?.unit ||
                                "units"}
                            </span>
                          )}
                        </div>

                        {/* Cost Information */}
                        {transaction.total_cost && (
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-muted-foreground">
                              Total Cost:
                            </span>
                            <span className="font-medium text-green-600">
                              {formatCurrency(transaction.total_cost)}
                            </span>
                          </div>
                        )}

                        {/* Reference Type */}
                        {transaction.reference_type && (
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-muted-foreground">
                              Reference:
                            </span>
                            <span className="font-medium">
                              {transaction.reference_type}
                            </span>
                          </div>
                        )}

                        {/* Notes */}
                        {transaction.notes && (
                          <div className="flex items-start gap-2 text-xs">
                            <span className="text-muted-foreground">
                              Notes:
                            </span>
                            <span className="text-gray-600 truncate max-w-xs">
                              {transaction.notes}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right ml-4">
                    <div className="flex items-center gap-1 text-sm font-medium mb-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(
                        transaction.transaction_date || transaction.created_at
                      ).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(
                        transaction.transaction_date || transaction.created_at
                      ).toLocaleTimeString()}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      by {transaction.User?.name || "Unknown"}
                    </div>
                    {transaction.approved_by && (
                      <div className="text-xs text-green-600 mt-1">
                        ✓ Approved by {transaction.approved_by}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {transactions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="mx-auto h-10 w-10 text-gray-400" />
                <p className="mt-3 text-sm font-medium text-foreground">
                  No recent transactions
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Transaction history will appear here once stock movements are
                  recorded.
                </p>
              </div>
            )}
          </div>

          {/* Transaction Summary Footer */}
          {transactions.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4 text-center mb-4">
                <div>
                  <p className="text-sm font-medium text-green-600">
                    {
                      transactions.filter(
                        (t) =>
                          t.transaction_type === "stock_in" ||
                          t.transaction_type === "purchase"
                      ).length
                    }
                  </p>
                  <p className="text-xs text-muted-foreground">Stock In</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-red-600">
                    {
                      transactions.filter(
                        (t) =>
                          t.transaction_type === "stock_out" ||
                          t.transaction_type === "usage"
                      ).length
                    }
                  </p>
                  <p className="text-xs text-muted-foreground">Stock Out</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-600">
                    {formatCurrency(
                      transactions
                        .filter(
                          (t) =>
                            (t.transaction_type === "stock_out" ||
                              t.transaction_type === "stock_in" ||
                              t.transaction_type === "adjustment" ||
                              t.transaction_type === "usage") &&
                            Number(t.total_cost || 0)
                        )
                        .reduce((sum, t) => sum + Number(t.total_cost || 0), 0)
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Value</p>
                </div>
              </div>

              {/* Activity Timeline */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Recent Activity
                </p>
                <div className="flex items-center gap-1">
                  {[...Array(7)].map((_, i) => {
                    const date = new Date();
                    date.setDate(date.getDate() - (6 - i));
                    const dayTransactions = transactions.filter((t) => {
                      const tDate = new Date(
                        t.transaction_date || t.created_at
                      );
                      return tDate.toDateString() === date.toDateString();
                    });

                    return (
                      <div
                        key={i}
                        className="flex-1 relative group"
                        title={`${date.toLocaleDateString()}: ${dayTransactions.length} transactions`}
                      >
                        <div
                          className={`h-2 rounded-sm ${
                            dayTransactions.length > 0
                              ? dayTransactions.length > 3
                                ? "bg-green-500"
                                : dayTransactions.length > 1
                                  ? "bg-blue-500"
                                  : "bg-gray-400"
                              : "bg-gray-200"
                          }`}
                        />
                        <div className="absolute bottom-full mb-1 left-1/2 transform -translate-x-1/2 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                          {dayTransactions.length}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>7 days ago</span>
                  <span>Today</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
