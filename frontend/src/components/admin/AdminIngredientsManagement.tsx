import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw } from "lucide-react";
import apiClient from "@/api/client";
import { toastHelpers } from "@/lib/toast-helpers";
import { InventoryIngredient } from "@/types";
import StockDashboard from "./StockDashboard";
import InventoryTab from "./InventoryTab";
import LowStockTab from "./LowStockTab";
import AlertsTab from "./AlertsTab";
import StockManagementTab from "./StockManagementTab";
import TransactionsTab from "./TransactionsTab";
import PurchaseOrdersTab from "./PurchaseOrdersTab";
import ReportsTab from "./ReportsTab";
import { StockItemForm } from "../forms/StockItemForm";

interface StockAlert {
  id: number;
  item_id: number;
  item_name: string;
  alert_type: "low_stock" | "critical_stock" | "out_of_stock";
  message: string;
  created_at: string;
  acknowledged: boolean;
  resolved: boolean;
  priority: "low" | "medium" | "high" | "critical";
}

// interface StockTransaction {
//   id: number;
//   item_id: number;
//   item_name: string;
//   transaction_type:
//     | "purchase"
//     | "usage"
//     | "adjustment"
//     | "transfer"
//     | "return"
//     | "waste";
//   quantity: number;
//   unit_cost?: number;
//   total_cost?: number;
//   reference_number?: string;
//   notes?: string;
//   created_by: string;
//   created_at: string;
// }

interface InventoryStats {
  total: number;
  totalValue: number;
  lowStock: number;
  criticalStock: number;
  outOfStock: number;
  inStockCount: number;
}

export function AdminIngredientsManagement() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryIngredient | null>(
    null
  );
  const [stockAdjustment, setStockAdjustment] = useState({
    id: 0,
    amount: 0,
    type: "add",
    reason: "",
    reference: "",
  });

  const queryClient = useQueryClient();

  // Fetch all stock items (ingredients, supplies, equipment, etc.)
  const { data: stockItems = [], isLoading: loadingStock } = useQuery({
    queryKey: ["stock-items"],
    queryFn: () =>
      apiClient.getIngredients().then((res) => {
        console.log("Fetched stock items:", res.data?.ingredients);
        return res.data?.ingredients || [];
      }),
  });

  // Fetch stock alerts
  const { data: alerts = [] } = useQuery({
    queryKey: ["stock-alerts"],
    queryFn: () => apiClient.getStockAlerts().then((res) => res.data || []),
  });

  // Fetch stock transactions
  const { data: transactions = [] } = useQuery({
    queryKey: ["stock-transactions"],
    queryFn: () =>
      apiClient.getStockTransactions().then((res) => res.data || []),
  });

  // Filter stock items based on search
  const getFilteredItems = () => {
    let filtered = stockItems;

    if (searchTerm) {
      filtered = filtered.filter(
        (item: InventoryIngredient) =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.supplier_contact
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          item.unit.toLowerCase().includes(searchTerm.toLowerCase())
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
      queryClient.invalidateQueries({ queryKey: ["stock-items"] });
      queryClient.invalidateQueries({ queryKey: ["ingredient-stats"] });
      queryClient.invalidateQueries({ queryKey: ["stock-transactions"] });
      toastHelpers.apiSuccess("Stock Update", "Stock updated successfully");
      setStockAdjustment({
        id: 0,
        amount: 0,
        type: "add",
        reason: "",
        reference: "",
      });
    },
    onError: (error) => {
      toastHelpers.apiError("Stock Update", error);
    },
  });

  // Create transaction mutation
  //   const createTransactionMutation = useMutation({
  //     mutationFn: (transaction: Partial<StockTransaction>) => {
  //       return apiClient.createStockTransaction(transaction);
  //     },
  //     onSuccess: () => {
  //       queryClient.invalidateQueries({ queryKey: ["stock-transactions"] });
  //       queryClient.invalidateQueries({ queryKey: ["stock-items"] });
  //       toastHelpers.apiSuccess(
  //         "Transaction",
  //         "Transaction recorded successfully"
  //       );
  //       setShowTransactionForm(false);
  //     },
  //     onError: (error) => {
  //       toastHelpers.apiError("Transaction", error);
  //     },
  //   });

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

  // Remove stock mutation
  const removeStockMutation = useMutation({
    mutationFn: ({ id, amount }: { id: number; amount: number }) => {
      return apiClient.subtractStock(id, amount);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-items"] });
      queryClient.invalidateQueries({ queryKey: ["ingredient-stats"] });
      queryClient.invalidateQueries({ queryKey: ["stock-transactions"] });
      toastHelpers.apiSuccess("Stock Removal", "Stock removed successfully");
    },
    onError: (error) => {
      toastHelpers.apiError("Stock Removal", error);
    },
  });

  const handleRemoveStock = (itemId: number, quantity: number) => {
    removeStockMutation.mutate({ id: itemId, amount: quantity });
  };

  // const getPriorityBadge = (priority: string) => {
  //   const priorityConfig = {
  //     low: { variant: "secondary" as const, text: "Low" },
  //     medium: { variant: "default" as const, text: "Medium" },
  //     high: { variant: "destructive" as const, text: "High" },
  //     critical: { variant: "destructive" as const, text: "Critical" },
  //   };

  //   const config = priorityConfig[priority as keyof typeof priorityConfig];

  //   return <Badge variant={config.variant}>{config.text}</Badge>;
  // };

  // const getStatusBadge = (status: string) => {
  //   const statusConfig = {
  //     in_stock: {
  //       variant: "default" as const,
  //       text: "In Stock",
  //       icon: CheckCircle,
  //     },
  //     low_stock: {
  //       variant: "secondary" as const,
  //       text: "Low Stock",
  //       icon: AlertTriangle,
  //     },
  //     critical_stock: {
  //       variant: "destructive" as const,
  //       text: "Critical",
  //       icon: AlertCircle,
  //     },
  //     out_of_stock: {
  //       variant: "destructive" as const,
  //       text: "Out of Stock",
  //       icon: XCircle,
  //     },
  //   };

  //   const config = statusConfig[status as keyof typeof statusConfig];
  //   const IconComponent = config.icon;

  //   return (
  //     <Badge variant={config.variant} className="flex items-center gap-1">
  //       <IconComponent className="w-3 h-3" />
  //       {config.text}
  //     </Badge>
  //   );
  // };

  if (loadingStock) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading stock data...</span>
      </div>
    );
  }

  function onDeleteItem(item: InventoryIngredient): void {
    if (
      window.confirm(
        `Are you sure you want to delete "${item.name}"? This action cannot be undone.`
      )
    ) {
      apiClient
        .deleteIngredient(item.id)
        .then(() => {
          toastHelpers.apiSuccess(
            "Delete Ingredient",
            "Ingredient deleted successfully"
          );
          queryClient.invalidateQueries({ queryKey: ["stock-items"] });
        })
        .catch((error) => {
          toastHelpers.apiError("Delete Ingredient", error);
        });
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Stock Management System
          </h1>
          <p className="text-muted-foreground">
            Comprehensive inventory management for ingredients, supplies,
            equipment, and packaging
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="inventory">All Stock</TabsTrigger>
          <TabsTrigger value="low-stock">Low Stock</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="stock-mgmt">Stock Mgmt</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="purchase-orders">Orders</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <StockDashboard
            alerts={alerts}
            transactions={transactions}
            stockItems={stockItems}
            setActiveTab={setActiveTab}
            setShowCreateForm={setShowCreateForm}
            setShowTransactionForm={setShowTransactionForm}
            acknowledgeAlertMutation={acknowledgeAlertMutation}
          />
        </TabsContent>

        <TabsContent value="inventory">
          <InventoryTab
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            stockFilter={stockFilter}
            setStockFilter={setStockFilter}
            getFilteredItems={getFilteredItems}
            setSelectedItem={setSelectedItem}
            setShowTransactionForm={setShowTransactionForm}
            setShowCreateForm={setShowCreateForm}
            onDeleteItem={onDeleteItem}
          />
        </TabsContent>

        <TabsContent value="low-stock">
          <LowStockTab
            lowStockItems={getFilteredItems().filter(
              (item) =>
                item.quantity <= item.low_stock_threshold ||
                item.quantity <= item.critical_stock_threshold
            )}
            acknowledgeAlert={(id) => acknowledgeAlertMutation.mutate(id)}
          />
        </TabsContent>

        <TabsContent value="alerts">
          <AlertsTab
            alerts={alerts.map((a) => ({
              id: a.id,
              item: stockItems.find(
                (s) => s.id === a.item_id
              ) as InventoryIngredient,
              message: a.message,
              created_at: a.created_at,
            }))}
            acknowledgeAlert={(id) => acknowledgeAlertMutation.mutate(id)}
          />
        </TabsContent>

        <TabsContent value="stock-mgmt">
          <StockManagementTab
            stockItems={stockItems}
            stockAdjustment={stockAdjustment}
            setStockAdjustment={setStockAdjustment}
            stockUpdateMutation={stockUpdateMutation}
            getFilteredItems={getFilteredItems}
          />
        </TabsContent>

        <TabsContent value="transactions">
          <TransactionsTab
            transactions={transactions.map((t) => ({
              id: t.id,
              item: stockItems.find(
                (s) => s.id === t.item_id
              ) as InventoryIngredient,
              type: t.transaction_type,
              quantity: t.quantity,
              user: t.created_by,
              note: t.notes,
              created_at: t.created_at,
            }))}
          />
        </TabsContent>

        <TabsContent value="purchase-orders">
          <PurchaseOrdersTab purchaseOrders={[]} />
        </TabsContent>

        <TabsContent value="reports">
          <ReportsTab stockItems={stockItems} />
        </TabsContent>
      </Tabs>

      {/* Stock Item Create/Edit Form Modal */}
      {showCreateForm && (
        <div
          className="fixed top-0 left-0 w-screen h-screen bg-black bg-opacity-50 flex items-center justify-center z-[100]"
          style={{
            backdropFilter: "blur(4px)",
            margin: 0,
            padding: 0,
            minHeight: "100vh",
            minWidth: "100vw",
          }}
        >
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-hide">
            <StockItemForm
              stockItem={selectedItem || undefined}
              mode={selectedItem ? "edit" : "create"}
              onSuccess={() => {
                setShowCreateForm(false);
                setSelectedItem(null);
              }}
              onCancel={() => {
                setShowCreateForm(false);
                setSelectedItem(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminIngredientsManagement;
