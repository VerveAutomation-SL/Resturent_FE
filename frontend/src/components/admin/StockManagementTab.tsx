import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw, AlertTriangle, ShoppingCart, Search } from "lucide-react";
import { InventoryIngredient } from "@/types";

type Props = {
  stockItems: InventoryIngredient[];
  stockAdjustment: {
    id: number;
    amount: number;
    type: string;
    notes: string;
  };
  setStockAdjustment: (s: any) => void;
  stockUpdateMutation: any;
};

export default function StockManagementTab({
  stockItems,
  stockAdjustment,
  setStockAdjustment,
  stockUpdateMutation,
}: Props) {
  const [itemSearch, setItemSearch] = useState<string>("");
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [alertFilter, setAlertFilter] = useState<string>("all"); // "all", "low_stock", "out_of_stock"
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get selected item for preview
  const selectedItem = stockItems.find(
    (item) => item.id === stockAdjustment.id
  );

  // Calculate preview values
  const getPreviewValues = () => {
    if (!selectedItem || !stockAdjustment.amount) return null;

    const currentStock = Number(selectedItem.quantity);
    const adjustmentAmount = Number(stockAdjustment.amount);
    let newStock = currentStock;

    switch (stockAdjustment.type) {
      case "add":
        newStock = currentStock + adjustmentAmount;
        break;
      case "subtract":
        newStock = currentStock - adjustmentAmount;
        break;
      case "update":
        newStock = adjustmentAmount;
        break;
    }

    return {
      current: currentStock,
      change: adjustmentAmount,
      new: newStock,
      action: stockAdjustment.type,
    };
  };

  const previewValues = getPreviewValues();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Derive low and out-of-stock items directly from the stockItems prop
  const lowStockItems = stockItems.filter((item) => {
    const qty = Number(item.quantity || 0);
    const threshold = Number(item.low_stock_threshold || 0);
    return qty > 0 && qty <= threshold;
  });

  const outOfStockItems = stockItems.filter((item) => {
    const qty = Number(item.quantity || 0);
    return qty <= 0;
  });
  return (
    <div className="mt-8 space-y-6">
      {/* Bulk Operations */}
      {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Bulk Stock Update</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Upload a CSV file to update multiple stock items at once.
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

        <Card>
          <CardHeader>
            <CardTitle>Stock Take</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Perform a complete stock count and update inventory levels.
            </p>
            <div className="flex gap-3">
              <Button variant="outline">
                <BarChart3 className="w-4 h-4 mr-2" />
                Start Stock Take
              </Button>
              <Button variant="outline">
                <Eye className="w-4 h-4 mr-2" />
                View History
              </Button>
            </div>
          </CardContent>
        </Card>
      </div> */}

      {/* Quick Stock Adjustment */}
      <Card data-testid="quick-stock-adjustment">
        <CardHeader>
          <CardTitle>Quick Stock Adjustment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium">Stock Item</label>
                <div className="relative" ref={dropdownRef}>
                  <div className="relative max-w-lg">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search by name..."
                      value={itemSearch}
                      onChange={(e) => {
                        setItemSearch(e.target.value);
                        setShowDropdown(true);
                      }}
                      onFocus={() => setShowDropdown(true)}
                      className="pl-10"
                    />
                  </div>

                  {itemSearch.trim() !== "" && showDropdown && (
                    <div className="absolute z-20 mt-1 w-full max-w-lg bg-white border rounded-md shadow-lg">
                      <ul className="max-h-48 overflow-auto">
                        {stockItems.filter((it) =>
                          it.name
                            .toLowerCase()
                            .startsWith(itemSearch.toLowerCase())
                        ).length === 0 ? (
                          <li className="px-3 py-4 text-center text-sm text-muted-foreground">
                            No ingredients found matching "{itemSearch}"
                          </li>
                        ) : (
                          stockItems
                            .filter((it) =>
                              it.name
                                .toLowerCase()
                                .startsWith(itemSearch.toLowerCase())
                            )
                            .map((it) => (
                              <li
                                key={it.id}
                                className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                onClick={() => {
                                  setStockAdjustment((prev: any) => ({
                                    ...prev,
                                    id: it.id,
                                  }));
                                  setItemSearch(it.name);
                                  setShowDropdown(false);
                                }}
                              >
                                <div className="text-sm font-medium">
                                  {it.name}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {it.supplier}
                                </div>
                              </li>
                            ))
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Amount</label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={stockAdjustment.amount}
                  onChange={(e) =>
                    setStockAdjustment((prev: any) => ({
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
                    setStockAdjustment((prev: any) => ({
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
              <div>
                <label className="text-sm font-medium">Reason</label>
                <Input
                  placeholder="Reason for adjustment"
                  value={stockAdjustment.notes}
                  onChange={(e) =>
                    setStockAdjustment((prev: any) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            {/* Preview Section */}
            {previewValues && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-sm">
                        <span className="font-medium text-blue-900">
                          Preview:{" "}
                        </span>
                        <span className="text-blue-700">
                          {selectedItem?.name}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground">
                          Current
                        </div>
                        <div className="font-medium">
                          {previewValues.current} {selectedItem?.unit}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground">
                          {previewValues.action === "add"
                            ? "Adding"
                            : previewValues.action === "subtract"
                              ? "Removing"
                              : "Setting to"}
                        </div>
                        <div
                          className={`font-medium ${
                            previewValues.action === "add"
                              ? "text-green-600"
                              : previewValues.action === "subtract"
                                ? "text-red-600"
                                : "text-blue-600"
                          }`}
                        >
                          {previewValues.action === "update"
                            ? ""
                            : previewValues.action === "add"
                              ? "+"
                              : "-"}
                          {previewValues.action === "update"
                            ? previewValues.change
                            : Math.abs(previewValues.change)}{" "}
                          {selectedItem?.unit}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground">
                          New Total
                        </div>
                        <div
                          className={`font-bold ${
                            previewValues.new < 0
                              ? "text-red-600"
                              : previewValues.new <=
                                  Number(selectedItem?.low_stock_threshold || 0)
                                ? "text-yellow-600"
                                : "text-green-600"
                          }`}
                        >
                          {previewValues.new} {selectedItem?.unit}
                        </div>
                      </div>
                    </div>
                  </div>
                  {previewValues.new < 0 && (
                    <div className="mt-2 text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
                      ⚠️ Warning: This will result in negative stock
                    </div>
                  )}
                  {previewValues.new > 0 &&
                    previewValues.new <=
                      Number(selectedItem?.low_stock_threshold || 0) && (
                      <div className="mt-2 text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
                        ⚠️ Notice: This will result in low stock
                      </div>
                    )}
                </CardContent>
              </Card>
            )}

            <Button
              onClick={() => stockUpdateMutation.mutate(stockAdjustment)}
              disabled={!stockAdjustment.id || !stockAdjustment.amount}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Update Stock
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Low Stock Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              Items Requiring Attention
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Filter:</label>
              <select
                className="text-sm border rounded-md px-2 py-1"
                value={alertFilter}
                onChange={(e) => setAlertFilter(e.target.value)}
              >
                <option value="all">All Items</option>
                <option value="low_stock">Low Stock Only</option>
                <option value="out_of_stock">Out of Stock Only</option>
              </select>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(() => {
              // Filter items based on selected filter
              let filteredItems: InventoryIngredient[] = [];
              if (alertFilter === "all") {
                filteredItems = lowStockItems.concat(outOfStockItems);
              } else if (alertFilter === "low_stock") {
                filteredItems = lowStockItems;
              } else if (alertFilter === "out_of_stock") {
                filteredItems = outOfStockItems;
              }

              return filteredItems
                .slice(0, 5)
                .map((item: InventoryIngredient) => {
                  const qty = Number(item.quantity || 0);
                  const isOutOfStock = qty <= 0;
                  const statusColor = isOutOfStock
                    ? "text-red-600"
                    : "text-yellow-600";
                  const statusBg = isOutOfStock ? "bg-red-50" : "bg-yellow-50";
                  const statusBorder = isOutOfStock
                    ? "border-red-200"
                    : "border-yellow-200";
                  const statusText = isOutOfStock
                    ? "Out of Stock"
                    : "Low Stock";

                  return (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-3 border rounded-lg ${statusBg} ${statusBorder}`}
                    >
                      <div className="flex items-center gap-3">
                        <AlertTriangle className={`w-5 h-5 ${statusColor}`} />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{item.name}</p>
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${statusColor} ${statusBg} border ${statusBorder}`}
                            >
                              {statusText}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Current: {item.quantity} {item.unit} | Min:{" "}
                            {item.low_stock_threshold} {item.unit}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {/* Show auto-reorder button for items with auto_reorder enabled (both low stock and out of stock) */}
                        {item.auto_reorder && item.reorder_quantity && (
                          <Button
                            size="sm"
                            variant="default"
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={() => {
                              setStockAdjustment({
                                id: item.id,
                                amount: Number(item.reorder_quantity),
                                type: "add",
                                notes: `Auto-reorder: ${item.reorder_quantity} ${item.unit} (${statusText})`,
                              });
                              stockUpdateMutation.mutate({
                                id: item.id,
                                amount: Number(item.reorder_quantity),
                                type: "add",
                                notes: `Auto-reorder: ${item.reorder_quantity} ${item.unit} (${statusText})`,
                              });
                            }}
                          >
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            Auto-Reorder ({item.reorder_quantity} {item.unit})
                          </Button>
                        )}

                        {/* Manual adjustments are performed via the Quick Stock Adjustment panel */}
                        <div className="text-sm text-muted-foreground">
                          Adjust manually via Quick Stock Adjustment
                        </div>
                      </div>
                    </div>
                  );
                });
            })()}
            {(() => {
              // Check if there are no items to display based on current filter
              let hasItemsToShow = false;
              if (alertFilter === "all") {
                hasItemsToShow =
                  lowStockItems.length > 0 || outOfStockItems.length > 0;
              } else if (alertFilter === "low_stock") {
                hasItemsToShow = lowStockItems.length > 0;
              } else if (alertFilter === "out_of_stock") {
                hasItemsToShow = outOfStockItems.length > 0;
              }

              if (!hasItemsToShow) {
                return (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                    <p>
                      {alertFilter === "all" &&
                        "All items are adequately stocked!"}
                      {alertFilter === "low_stock" &&
                        "No low stock items found!"}
                      {alertFilter === "out_of_stock" &&
                        "No out of stock items found!"}
                    </p>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
