import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Package,
  DollarSign,
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
              <DollarSign className="h-8 w-8 text-green-600" />
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
              <AlertTriangle className="w-5 h-5" />
              Items Requiring Attention
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 flex flex-col justify-between">
            <div className="justify-between space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm">Low / Out of Stock</span>
                </div>
                <div className="flex items-center gap-3 w-36 justify-end">
                  <span className="text-sm font-medium">
                    {(stockStats?.lowStock ?? 0) +
                      (stockStats?.outOfStock ?? 0)}
                  </span>
                  <Badge variant="destructive" className="text-xs px-2 py-0.5">
                    Attention
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className="text-sm">Pending Alerts</span>
                </div>
                <div className="flex items-center gap-3 w-36 justify-end">
                  <span className="text-sm font-medium">
                    {alerts.filter((a) => !a.resolved).length}
                  </span>
                  <Badge variant="outline" className="text-xs px-2 py-0.5">
                    Review
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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

      <Card>
        <CardHeader>
          <CardTitle>Recent Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <div className="text-center py-2 text-muted-foreground">
                <AlertCircle className="mx-auto h-10 w-10 text-gray-400" />
                <p className="mt-3 text-sm font-medium text-foreground">
                  No active alerts
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  You're all caught up — no alerts at the moment.
                </p>
              </div>
            ) : (
              alerts.slice(0, 5).map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setActiveTab("alerts")}
                >
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                    <div>
                      <p className="font-medium flex items-center gap-2">
                        {alert.Ingredient.name || alert.ingredient_name}
                        {alert.severity === "high" && (
                          <Badge
                            variant="destructive"
                            className="text-xs px-2 py-0.5"
                          >
                            High
                          </Badge>
                        )}
                        {alert.severity === "medium" && (
                          <Badge
                            variant="outline"
                            className="text-xs px-2 py-0.5"
                          >
                            Medium
                          </Badge>
                        )}
                      </p>

                      <p className="text-sm text-muted-foreground mt-1">
                        {Number(
                          alert.current_quantity ?? alert.current_qty ?? 0
                        )}{" "}
                        {alert.unit || alert.item_unit || "units"} remaining
                        {alert.alert_type === "out_of_stock"
                          ? " - Out of stock"
                          : " - Running low"}
                      </p>

                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(
                          alert.created_at || alert.updated_at
                        ).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Click to manage →
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {transactions.slice(0, 5).map((transaction) => {
              const item = stockItems.find(
                (s) => s.id === transaction.ingredient_id
              );
              return (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        transaction.transaction_type === "purchase"
                          ? "bg-green-500"
                          : transaction.transaction_type === "usage"
                            ? "bg-red-500"
                            : "bg-blue-500"
                      }`}
                    ></div>
                    <div>
                      <p className="font-medium">
                        {item?.name || "Unknown Item"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {transaction.transaction_type} • {transaction.quantity}{" "}
                        {item?.unit || "units"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      by {transaction.User.name}
                    </p>
                  </div>
                </div>
              );
            })}
            {transactions.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No recent transactions
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
