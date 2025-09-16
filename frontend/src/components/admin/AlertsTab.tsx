import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  Check,
  Package,
  Clock,
  ShoppingCart,
  TrendingDown,
  AlertTriangle,
} from "lucide-react";
import type { InventoryIngredient } from "@/types";

type Props = {
  alerts: Array<{
    id: number;
    item: InventoryIngredient;
    message: string;
    created_at: string;
    resolved?: boolean;
    severity?: string;
    alert_type?: string;
    current_quantity?: number;
    current_qty?: number;
    threshold_quantity?: number;
    threshold?: number;
    unit?: string;
    auto_reorder?: boolean;
    auto_reorder_triggered?: boolean;
    reorder_quantity?: number;
    reorder_qty?: number;
  }>;
  resolveAlert: (id: number) => void;
};

export default function AlertsTab({ alerts, resolveAlert }: Props) {
  const handleResolveAlert = (alertId: number, itemName: string) => {
    if (
      window.confirm(
        `Are you sure you want to resolve this alert for "${itemName}"?`
      )
    ) {
      resolveAlert(alertId);
    }
  };

  return (
    <div className="mt-8 space-y-4">
      {alerts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No alerts found
            </h3>
            <p className="text-sm text-muted-foreground">
              All stock levels are within acceptable ranges. You're all caught
              up!
            </p>
          </CardContent>
        </Card>
      ) : (
        alerts.map((a) => (
          <Card key={a.id} className={a.resolved ? "opacity-50" : ""}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle
                    className={`w-6 h-6 ${a.resolved ? "text-green-500" : "text-amber-500"}`}
                  />
                  <div>
                    <h3 className="font-semibold text-lg">
                      {a.item?.name || "Unknown Item"}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      {a.severity === "high" && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          High Priority
                        </Badge>
                      )}
                      {a.severity === "medium" && (
                        <Badge variant="outline" className="text-xs">
                          Medium Priority
                        </Badge>
                      )}
                      {a.alert_type === "out_of_stock" && (
                        <Badge variant="destructive" className="text-xs">
                          Out of Stock
                        </Badge>
                      )}
                      {a.alert_type === "low_stock" && (
                        <Badge variant="secondary" className="text-xs">
                          Low Stock
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {a.resolved ? (
                    <div className="flex items-center gap-1 text-green-600 text-sm">
                      <Check className="w-4 h-4" />
                      Resolved
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() =>
                        handleResolveAlert(a.id, a.item?.name || "Unknown Item")
                      }
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Resolve
                    </Button>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Package className="w-8 h-8 text-blue-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Current Stock
                    </p>
                    <p className="font-semibold text-lg">
                      {Number(a.current_quantity ?? a.current_qty ?? 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {a.item?.unit || a.unit || "units"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                  <TrendingDown className="w-8 h-8 text-yellow-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Low Stock Threshold
                    </p>
                    <p className="font-semibold text-lg text-yellow-700">
                      {Number(a.threshold_quantity ?? a.threshold ?? 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {a.item?.unit || a.unit || "units"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <ShoppingCart className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Auto-Reorder
                    </p>
                    <p className="font-semibold text-lg">
                      {a.auto_reorder_triggered || a.auto_reorder
                        ? "Enabled"
                        : "Disabled"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {a.auto_reorder_triggered || a.auto_reorder
                        ? `Qty: ${a.reorder_quantity ?? a.reorder_qty ?? "—"}`
                        : "Manual adjustment needed"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                  <Clock className="w-8 h-8 text-purple-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Alert Created
                    </p>
                    <p className="font-semibold text-sm">
                      {new Date(a.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(a.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Item Details */}
              {a.item && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Item Details</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Unit:</span>
                      <span className="ml-2 font-medium">
                        {a.item.unit || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Supplier:</span>
                      <span className="ml-2 font-medium">
                        {a.item.supplier || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Cost per unit:
                      </span>
                      <span className="ml-2 font-medium">
                        ${a.item.cost_per_unit || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Supplier Contact:
                      </span>
                      <span className="ml-2 font-medium">
                        {a.item.supplier_contact || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Last Restocked:
                      </span>
                      <span className="ml-2 font-medium">
                        {a.item.last_restocked_at
                          ? new Date(
                              a.item.last_restocked_at
                            ).toLocaleDateString()
                          : "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Total Value:
                      </span>
                      <span className="ml-2 font-medium">
                        $
                        {(
                          Number(a.current_quantity ?? a.current_qty ?? 0) *
                          (a.item.cost_per_unit || 0)
                        ).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Recommended Actions */}
              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium mb-3">Recommended Actions</h4>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  {a.auto_reorder_triggered || a.auto_reorder ? (
                    <div className="flex items-start gap-3">
                      <ShoppingCart className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-blue-900">
                          Auto-Reorder Active
                        </p>
                        <p className="text-sm text-blue-700 mt-1">
                          System will automatically place an order for{" "}
                          {a.reorder_quantity ?? a.reorder_qty ?? "—"}{" "}
                          {a.item?.unit || a.unit || "units"}
                          {a.item?.supplier && ` from ${a.item.supplier}`}.
                        </p>
                        <p className="text-xs text-blue-600 mt-2">
                          Estimated cost: $
                          {(
                            (a.reorder_quantity ?? a.reorder_qty ?? 0) *
                            (a.item?.cost_per_unit || 0)
                          ).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-amber-900">
                          Manual Action Required
                        </p>
                        <p className="text-sm text-amber-700 mt-1">
                          Auto-reorder is disabled. Please use Quick Stock
                          Adjustment to update inventory or place a manual
                          purchase order.
                        </p>
                        {a.item?.supplier && (
                          <p className="text-xs text-amber-600 mt-2">
                            Contact supplier: {a.item.supplier}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
