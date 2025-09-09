import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCw,
  BarChart3,
  AlertTriangle,
  XCircle,
  AlertCircle,
  Eye,
  Plus,
  TrendingUp,
  ShoppingCart,
  Upload,
  Package,
  DollarSign,
  Users,
  Calendar,
} from "lucide-react";

type Props = {
  alerts?: any[];
  transactions?: any[];
  stockItems?: any[];
  setActiveTab: (v: string) => void;
  setShowCreateForm: (v: boolean) => void;
  setShowTransactionForm: (v: boolean) => void;
  acknowledgeAlertMutation: any;
};

export default function StockDashboard({
  alerts = [],
  transactions = [],
  stockItems = [],
  setActiveTab,
  setShowCreateForm,
  setShowTransactionForm,
  acknowledgeAlertMutation,
}: Props) {
  // Calculate additional metrics
  const totalItems = stockItems.length;
  const inStockItems = stockItems.filter(
    (item) => item.quantity > item.low_stock_threshold
  ).length;
  const lowStockItems = stockItems.filter(
    (item) => item.quantity <= item.low_stock_threshold && item.quantity > 0
  ).length;
  const outOfStockItems = stockItems.filter(
    (item) => item.quantity <= 0
  ).length;
  const totalValue = stockItems.reduce(
    (sum, item) => sum + item.quantity * item.cost_per_unit,
    0
  );

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

  return (
    <div className="space-y-6 mt-6">
      {/* Enhanced Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Items
                </p>
                <p className="text-2xl font-bold">{totalItems}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {inStockItems} in stock
                </p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Value
                </p>
                <p className="text-2xl font-bold">${totalValue.toFixed(2)}</p>
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
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Low Stock Items
                </p>
                <p className="text-2xl font-bold text-yellow-600">
                  {lowStockItems}
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
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Out of Stock
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {outOfStockItems}
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Stock Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">In Stock</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{inStockItems}</span>
                  <Badge variant="secondary">
                    {((inStockItems / totalItems) * 100).toFixed(1)}%
                  </Badge>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm">Low Stock</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{lowStockItems}</span>
                  <Badge variant="secondary">
                    {((lowStockItems / totalItems) * 100).toFixed(1)}%
                  </Badge>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm">Out of Stock</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{outOfStockItems}</span>
                  <Badge variant="secondary">
                    {((outOfStockItems / totalItems) * 100).toFixed(1)}%
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Top Suppliers by Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topSuppliers.map(([supplier, data]) => (
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
                      ${data.value.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {((data.value / totalValue) * 100).toFixed(1)}% of total
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
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
              onClick={() => setActiveTab("low-stock")}
              variant="outline"
              size="sm"
              className="h-16 flex-col"
            >
              <AlertTriangle className="w-4 h-4 mb-2" />
              Low Stock Items
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
              onClick={() => setShowCreateForm(true)}
              size="sm"
              className="h-16 flex-col"
            >
              <Plus className="w-4 h-4 mb-2" />
              Add Stock Item
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
              Alerts ({alerts.filter((a) => !a.acknowledged).length})
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
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {alerts.slice(0, 5).map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="font-medium">
                      {alert.item_name || alert.ingredient_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {alert.message}
                    </p>
                  </div>
                </div>
                {!alert.acknowledged && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => acknowledgeAlertMutation.mutate(alert.id)}
                  >
                    Acknowledge
                  </Button>
                )}
              </div>
            ))}
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
              const item = stockItems.find((s) => s.id === transaction.item_id);
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
                      by {transaction.created_by}
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
