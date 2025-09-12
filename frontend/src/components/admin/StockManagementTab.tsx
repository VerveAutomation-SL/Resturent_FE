import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BarChart3,
  Upload,
  Download,
  RefreshCw,
  AlertTriangle,
  ShoppingCart,
  Eye,
} from "lucide-react";
import { InventoryIngredient } from "@/types";

type Props = {
  stockItems: InventoryIngredient[];
  stockAdjustment: {
    id: number;
    amount: number;
    type: string;
    reason: string;
    reference: string;
  };
  setStockAdjustment: (s: any) => void;
  stockUpdateMutation: any;
  getFilteredItems: (s?: string, t?: string) => InventoryIngredient[];
};

export default function StockManagementTab({
  stockItems,
  stockAdjustment,
  setStockAdjustment,
  stockUpdateMutation,
  getFilteredItems,
}: Props) {
  return (
    <div className="space-y-6">
      {/* Bulk Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
      </div>

      {/* Quick Stock Adjustment */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Stock Adjustment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="text-sm font-medium">Stock Item</label>
                <select
                  className="w-full mt-1 p-2 border rounded-md"
                  value={stockAdjustment.id}
                  onChange={(e) =>
                    setStockAdjustment((prev: any) => ({
                      ...prev,
                      id: Number(e.target.value),
                    }))
                  }
                >
                  <option value="">Select item...</option>
                  {stockItems.map((item: InventoryIngredient) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
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
                  value={stockAdjustment.reason}
                  onChange={(e) =>
                    setStockAdjustment((prev: any) => ({
                      ...prev,
                      reason: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Reference</label>
                <Input
                  placeholder="Reference number"
                  value={stockAdjustment.reference}
                  onChange={(e) =>
                    setStockAdjustment((prev: any) => ({
                      ...prev,
                      reference: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
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
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            Items Requiring Attention
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {getFilteredItems("low_stock")
              .concat(getFilteredItems("critical_stock"))
              .slice(0, 5)
              .map((item: InventoryIngredient) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Current: {item.quantity} {item.unit} | Min:{" "}
                        {item.low_stock_threshold} {item.unit}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Reorder
                    </Button>
                    <Button size="sm" variant="outline">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Adjust
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
