import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  Package,
  TrendingDown,
  TrendingUp,
  Plus,
  Edit,
  Search,
  Download,
  Upload,
  BarChart3,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Eye,
  ShoppingCart,
} from "lucide-react";
import apiClient from "@/api/client";
import { toastHelpers } from "@/lib/toast-helpers";
import { InventoryIngredient } from "@/types";

interface StockAlert {
  id: number;
  ingredient_id: number;
  ingredient_name: string;
  alert_type: "low_stock" | "critical_stock" | "out_of_stock" | "expired";
  message: string;
  created_at: string;
  acknowledged: boolean;
  resolved: boolean;
}

interface InventoryStats {
  total_ingredients: number;
  total_value: number;
  low_stock_count: number;
  critical_stock_count: number;
  out_of_stock_count: number;
  in_stock_count: number;
}

export function AdminIngredientsManagement() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [stockAdjustment, setStockAdjustment] = useState({
    id: 0,
    amount: 0,
    type: "add",
  });

  const queryClient = useQueryClient();

  // Fetch ingredients data
  const { data: ingredients = [], isLoading: loadingIngredients } = useQuery({
    queryKey: ["ingredients"],
    queryFn: () => apiClient.getIngredients().then((res) => res.data || []),
  });

  // Fetch inventory stats
  const { data: stats } = useQuery<InventoryStats>({
    queryKey: ["ingredient-stats"],
    queryFn: () => apiClient.getIngredientStats().then((res) => res.data),
  });

  // Fetch stock alerts
  const { data: alerts = [] } = useQuery({
    queryKey: ["stock-alerts"],
    queryFn: () => apiClient.getStockAlerts().then((res) => res.data || []),
  });

  // Filter ingredients based on status and search
  const getFilteredIngredients = (status?: string) => {
    let filtered = ingredients;

    if (status) {
      filtered = ingredients.filter(
        (ing: InventoryIngredient) => ing.status === status
      );
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (ing: InventoryIngredient) =>
          ing.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ing.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ing.supplier.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  // Stock update mutation
  const stockUpdateMutation = useMutation({
    mutationFn: ({
      id,
      amount,
      type,
    }: {
      id: number;
      amount: number;
      type: string;
    }) => {
      if (type === "add") {
        return apiClient.addStock(id, amount);
      } else if (type === "subtract") {
        return apiClient.subtractStock(id, amount);
      } else {
        return apiClient.updateStock(id, amount);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ingredients"] });
      queryClient.invalidateQueries({ queryKey: ["ingredient-stats"] });
      toastHelpers.apiSuccess("Stock Update", "Stock updated successfully");
      setStockAdjustment({ id: 0, amount: 0, type: "add" });
    },
    onError: (error) => {
      toastHelpers.apiError("Stock Update", error);
    },
  });

  // Acknowledge alert mutation
  const acknowledgeAlertMutation = useMutation({
    mutationFn: (alertId: number) => {
      return apiClient.acknowledgeStockAlert(alertId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-alerts"] });
      toastHelpers.apiSuccess("Alert", "Alert acknowledged");
    },
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      in_stock: {
        variant: "default" as const,
        text: "In Stock",
        icon: CheckCircle,
      },
      low_stock: {
        variant: "secondary" as const,
        text: "Low Stock",
        icon: AlertTriangle,
      },
      critical_stock: {
        variant: "destructive" as const,
        text: "Critical",
        icon: AlertCircle,
      },
      out_of_stock: {
        variant: "destructive" as const,
        text: "Out of Stock",
        icon: XCircle,
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    const IconComponent = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <IconComponent className="w-3 h-3" />
        {config.text}
      </Badge>
    );
  };

  const DashboardTab = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Ingredients
                </p>
                <p className="text-2xl font-bold">
                  {stats?.total_ingredients || 0}
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
                <p className="text-2xl font-bold">
                  ${stats?.total_value?.toFixed(2) || "0.00"}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Low Stock
                </p>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats?.low_stock_count || 0}
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
                  {stats?.out_of_stock_count || 0}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => setActiveTab("inventory")}
              variant="outline"
              size="sm"
            >
              <Eye className="w-4 h-4 mr-2" />
              View All Inventory
            </Button>
            <Button
              onClick={() => setActiveTab("low-stock")}
              variant="outline"
              size="sm"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Check Low Stock
            </Button>
            <Button
              onClick={() => setActiveTab("alerts")}
              variant="outline"
              size="sm"
            >
              <AlertCircle className="w-4 h-4 mr-2" />
              View Alerts ({alerts.filter((a) => !a.acknowledged).length})
            </Button>
            <Button onClick={() => setShowCreateForm(true)} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Ingredient
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Alerts */}
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
                    <p className="font-medium">{alert.ingredient_name}</p>
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
    </div>
  );

  const InventoryTab = () => (
    <div className="space-y-4">
      {/* Search and Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search ingredients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button size="sm" variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button size="sm" onClick={() => setShowCreateForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Ingredient
          </Button>
        </div>
      </div>

      {/* Ingredients Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>Min/Max</TableHead>
                <TableHead>Unit Cost</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {getFilteredIngredients().map(
                (ingredient: InventoryIngredient) => (
                  <TableRow key={ingredient.id}>
                    <TableCell className="font-medium">
                      {ingredient.name}
                    </TableCell>
                    <TableCell>{ingredient.category}</TableCell>
                    <TableCell>
                      {ingredient.current_stock} {ingredient.unit}
                    </TableCell>
                    <TableCell>
                      {ingredient.minimum_stock} / {ingredient.maximum_stock}
                    </TableCell>
                    <TableCell>${ingredient.unit_cost?.toFixed(2)}</TableCell>
                    <TableCell>{getStatusBadge(ingredient.status)}</TableCell>
                    <TableCell>{ingredient.supplier}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  const StockManagementTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Bulk Stock Update</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Upload a CSV file to update multiple ingredient stocks at once.
          </p>
          <div className="flex gap-3">
            <Button variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Upload CSV
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download Template
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stock Adjustments */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Stock Adjustment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Ingredient</label>
                <select className="w-full mt-1 p-2 border rounded-md">
                  <option value="">Select ingredient...</option>
                  {ingredients.map((ing: InventoryIngredient) => (
                    <option key={ing.id} value={ing.id}>
                      {ing.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Amount</label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={stockAdjustment.amount}
                  onChange={(e) =>
                    setStockAdjustment((prev) => ({
                      ...prev,
                      amount: Number(e.target.value),
                    }))
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Action</label>
                <select
                  className="w-full mt-1 p-2 border rounded-md"
                  value={stockAdjustment.type}
                  onChange={(e) =>
                    setStockAdjustment((prev) => ({
                      ...prev,
                      type: e.target.value,
                    }))
                  }
                >
                  <option value="add">Add Stock</option>
                  <option value="subtract">Subtract Stock</option>
                  <option value="update">Set Stock</option>
                </select>
              </div>
            </div>
            <Button
              onClick={() => stockUpdateMutation.mutate(stockAdjustment)}
              disabled={!stockAdjustment.id || !stockAdjustment.amount}
            >
              Update Stock
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (loadingIngredients) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading ingredients...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Ingredients Management
          </h1>
          <p className="text-muted-foreground">
            Manage your restaurant's ingredient inventory and stock levels
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="inventory">All Inventory</TabsTrigger>
          <TabsTrigger value="low-stock">Low Stock</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="stock-mgmt">Stock Management</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <DashboardTab />
        </TabsContent>

        <TabsContent value="inventory">
          <InventoryTab />
        </TabsContent>

        <TabsContent value="low-stock">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                Low Stock Ingredients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <InventoryTab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Stock Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-600" />
                      <div>
                        <p className="font-medium">{alert.ingredient_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {alert.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(alert.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!alert.acknowledged && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            acknowledgeAlertMutation.mutate(alert.id)
                          }
                        >
                          Acknowledge
                        </Button>
                      )}
                      {alert.acknowledged && !alert.resolved && (
                        <Badge variant="secondary">Acknowledged</Badge>
                      )}
                      {alert.resolved && (
                        <Badge variant="default">Resolved</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stock-mgmt">
          <StockManagementTab />
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Inventory Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button variant="outline" className="h-24 flex-col">
                  <BarChart3 className="w-8 h-8 mb-2" />
                  Stock Level Report
                </Button>
                <Button variant="outline" className="h-24 flex-col">
                  <TrendingDown className="w-8 h-8 mb-2" />
                  Usage Report
                </Button>
                <Button variant="outline" className="h-24 flex-col">
                  <ShoppingCart className="w-8 h-8 mb-2" />
                  Purchase Orders
                </Button>
                <Button variant="outline" className="h-24 flex-col">
                  <AlertTriangle className="w-8 h-8 mb-2" />
                  Reorder Suggestions
                </Button>
                <Button variant="outline" className="h-24 flex-col">
                  <TrendingUp className="w-8 h-8 mb-2" />
                  Cost Analysis
                </Button>
                <Button variant="outline" className="h-24 flex-col">
                  <Package className="w-8 h-8 mb-2" />
                  Inventory Turnover
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AdminIngredientsManagement;
