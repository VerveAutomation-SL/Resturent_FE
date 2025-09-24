import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { RefreshCw, Plus } from "lucide-react";
import apiClient from "@/api/client";
import { toastHelpers } from "@/lib/toast-helpers";
import { InventoryIngredient } from "@/types";
import StockDashboard from "./StockDashboard";
import InventoryTab from "./InventoryTab";
import AlertsTab from "./AlertsTab";
import StockManagementTab from "./StockManagementTab";
import TransactionsTab from "./TransactionsTab";
import PurchaseOrdersTab from "./PurchaseOrdersTab";
import { StockItemForm } from "../forms/StockItemForm";
import { useRouter } from "@tanstack/react-router";

export function AdminIngredientsManagement() {
  const router = useRouter();
  useEffect(() => {
    console.log("Loading user from JWT token...");
    const decodedToken = apiClient.isAuthenticated();

    if (decodedToken) {
      console.log("Decoded token User:", decodedToken);
    } else {
      toastHelpers.sessionExpired();
      router.navigate({ to: "/login" });
    }
  }, []);

  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [_showTransactionForm, setShowTransactionForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryIngredient | null>(
    null
  );
  const [stockAdjustment, setStockAdjustment] = useState({
    id: 0,
    amount: 0,
    type: "add",
    notes: "",
  });

  const queryClient = useQueryClient();

  const { data: stockStats } = useQuery({
    queryKey: ["stock-stats"],
    queryFn: () =>
      apiClient.getIngredientStats().then((res) => {
        //console.log("Fetched stock items:", res.data);
        return res.data;
      }),
  });

  // Fetch all stock items (ingredients, supplies, equipment, etc.)
  const { data: stockItems = [], isLoading: loadingStock } = useQuery({
    queryKey: ["stock-items"],
    queryFn: () =>
      apiClient.getIngredients().then((res) => {
        // console.log("Fetched stock items:", res.data?.ingredients);
        return res.data?.ingredients || [];
      }),
  });

  // Fetch stock alerts
  const { data: alerts = [] } = useQuery({
    queryKey: ["stock-alerts"],
    queryFn: () =>
      apiClient
        .getStockAlerts()
        .then((res) => {
          console.log("Fetched stock alerts:", res.data);
          return res.data;
        })
        .catch((error) => {
          console.error("Error fetching stock alerts:", error);
          return [];
        }),
  });

  // Fetch stock transactions
  const { data: transactions } = useQuery({
    queryKey: ["stock-transactions"],
    queryFn: () =>
      apiClient.getInventoryTransactions().then((res) => {
        console.log("Fetched stock transactions:", res.data?.transactions);
        return res.data?.transactions || [];
      }),
  });

  // Filter stock items based on search
  const getFilteredItems = () => {
    let filtered = stockItems;

    // Text search (name, supplier, contact, unit)
    if (searchTerm) {
      filtered = filtered.filter(
        (item: InventoryIngredient) =>
          item.name.toLowerCase().startsWith(searchTerm.toLowerCase()) ||
          item.supplier.toLowerCase().startsWith(searchTerm.toLowerCase()) ||
          item.supplier_contact
            .toLowerCase()
            .startsWith(searchTerm.toLowerCase()) ||
          item.unit.toLowerCase().startsWith(searchTerm.toLowerCase())
      );
    }

    // Stock status filter (all / in_stock / low_stock / out_of_stock)
    if (stockFilter && stockFilter !== "all") {
      if (stockFilter === "low_stock") {
        // Low stock: quantity is at or below low threshold but above out_of_stock threshold (0)
        filtered = filtered.filter((item: InventoryIngredient) => {
          const qty = Number(item.quantity ?? 0);
          const low = Number(item.low_stock_threshold ?? 0);
          return qty <= low && qty > 0;
        });
      } else if (stockFilter === "out_of_stock") {
        // Out of stock: quantity is zero
        filtered = filtered.filter((item: InventoryIngredient) => {
          const qty = Number(item.quantity ?? 0);
          return qty <= 0;
        });
      } else if (stockFilter === "in_stock") {
        // In stock: quantity greater than low threshold
        filtered = filtered.filter((item: InventoryIngredient) => {
          const qty = Number(item.quantity ?? 0);
          const low = Number(item.low_stock_threshold ?? 0);
          console.log("Item:", item.name, qty, low, qty > low);
          return qty > low;
        });
      }
    }
    return filtered;
  };

  // Stock update mutation
  const stockUpdateMutation = useMutation({
    mutationFn: ({
      id,
      amount,
      notes,
      type,
    }: {
      id: number;
      amount: number;
      notes: string;
      type: string;
    }) => {
      if (type === "add") {
        return apiClient.addStock(id, amount, notes);
      } else if (type === "subtract") {
        return apiClient.subtractStock(id, amount, notes);
      } else {
        return apiClient.updateStock(id, amount, notes);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-items"] });
      queryClient.invalidateQueries({ queryKey: ["stock-stats"] });
      queryClient.invalidateQueries({ queryKey: ["stock-alerts"] });
      queryClient.invalidateQueries({ queryKey: ["stock-transactions"] });

      toastHelpers.apiSuccess("Stock Update", "Stock updated successfully");
      setStockAdjustment({
        id: 0,
        amount: 0,
        type: "add",
        notes: "",
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

  // Resolve alert mutation (use only active/resolved statuses)
  const resolveAlertMutation = useMutation({
    mutationFn: (alertId: number) => {
      return apiClient.resolveStockAlert(alertId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-alerts"] });
      queryClient.invalidateQueries({ queryKey: ["stock-items"] });
      queryClient.invalidateQueries({ queryKey: ["stock-stats"] });
      queryClient.invalidateQueries({ queryKey: ["stock-alerts"] });
      toastHelpers.apiSuccess(
        "Alert Resolved",
        "Alert has been successfully resolved"
      );
    },
    onError: (error) => {
      console.error("Error resolving alert:", error);
      toastHelpers.apiError("Alert Resolution Failed", error);
    },
  });

  // Create ingredient mutation (moved from StockItemForm)
  const createIngredientMutation = useMutation({
    mutationFn: (data: any) => apiClient.createIngredient(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-items"] });
      queryClient.invalidateQueries({ queryKey: ["stock-stats"] });
      queryClient.invalidateQueries({ queryKey: ["stock-alerts"] });
      queryClient.invalidateQueries({ queryKey: ["stock-transactions"] });
      toastHelpers.apiSuccess("Create", `Ingredient created successfully`);
      setShowCreateForm(false);
      setSelectedItem(null);
    },
    onError: (error) => {
      toastHelpers.apiError("Create ingredient", error);
    },
  });

  // Update ingredient mutation (moved from StockItemForm)
  const updateIngredientMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiClient.updateIngredient(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-items"] });
      queryClient.invalidateQueries({ queryKey: ["stock-stats"] });
      queryClient.invalidateQueries({ queryKey: ["stock-alerts"] });
      queryClient.invalidateQueries({ queryKey: ["stock-transactions"] });

      toastHelpers.apiSuccess("Update", `Ingredient updated successfully`);
      setShowCreateForm(false);
      setSelectedItem(null);
    },
    onError: (error) => {
      toastHelpers.apiError("Update ingredient", error);
    },
  });

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
          queryClient.invalidateQueries({ queryKey: ["stock-items"] });
          queryClient.invalidateQueries({ queryKey: ["stock-stats"] });
          queryClient.invalidateQueries({ queryKey: ["stock-alerts"] });
          queryClient.invalidateQueries({ queryKey: ["stock-transactions"] });

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
        <Button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Stock Item
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex w-full gap-4 px-2">
          <TabsTrigger value="dashboard" className="flex-1">
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex-1">
            All Stock
          </TabsTrigger>
          {/* <TabsTrigger value="low-stock" className="flex-1">Low Stock</TabsTrigger> */}
          <TabsTrigger value="stock-management" className="flex-1">
            Stock Manage
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex-1 relative">
            Alerts
            {alerts.length > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-5 h-5 text-xs font-semibold bg-destructive text-destructive-foreground rounded-full px-1.5 shadow-sm border-2 border-background">
                {alerts.length > 9 ? "9+" : alerts.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex-1">
            Transactions
          </TabsTrigger>
          {/* <TabsTrigger value="purchase-orders" className="flex-1">Orders</TabsTrigger> */}
          {/* <TabsTrigger value="reports" className="flex-1">Reports</TabsTrigger> */}
        </TabsList>

        <TabsContent value="dashboard">
          <StockDashboard
            alerts={alerts}
            transactions={transactions}
            stockItems={stockItems}
            setActiveTab={setActiveTab}
            setShowTransactionForm={setShowTransactionForm}
            stockStats={stockStats}
          />
        </TabsContent>

        <TabsContent value="inventory">
          <InventoryTab
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            stockFilter={stockFilter}
            setStockFilter={setStockFilter}
            getFilteredItems={getFilteredItems}
            setSelectedItem={setSelectedItem}
            setShowTransactionForm={setShowTransactionForm}
            setShowCreateForm={setShowCreateForm}
            onDeleteItem={onDeleteItem}
          />
        </TabsContent>

        <TabsContent value="stock-management">
          <StockManagementTab
            stockItems={stockItems}
            stockAdjustment={stockAdjustment}
            setStockAdjustment={setStockAdjustment}
            stockUpdateMutation={stockUpdateMutation}
          />
        </TabsContent>

        <TabsContent value="alerts">
          <AlertsTab
            alerts={alerts}
            resolveAlert={(id) => resolveAlertMutation.mutate(id)}
          />
        </TabsContent>

        <TabsContent value="transactions">
          <TransactionsTab transactions={transactions} />
        </TabsContent>

        <TabsContent value="purchase-orders">
          <PurchaseOrdersTab purchaseOrders={[]} />
        </TabsContent>

        {/* <TabsContent value="reports">
          <ReportsTab stockItems={stockItems} />
        </TabsContent> */}
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
              createHandler={(data) => createIngredientMutation.mutate(data)}
              updateHandler={(id, data) =>
                updateIngredientMutation.mutate({ id, data })
              }
              isSubmitting={
                createIngredientMutation.isPending ||
                updateIngredientMutation.isPending
              }
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
