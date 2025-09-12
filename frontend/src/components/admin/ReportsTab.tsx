import { Card, CardContent } from "@/components/ui/card";
import type { InventoryIngredient } from "@/types";

type Props = {
  stockItems: InventoryIngredient[];
};

export default function ReportsTab({ stockItems }: Props) {
  // Minimal placeholder: real reports (charts, exports) can be implemented later
  const totalItems = stockItems.length;
  const totalStockValue = stockItems.reduce(
    (s, it) => s + (it.quantity || 0) * (it.cost_per_unit || 0),
    0
  );

  return (
    <div className="p-6 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Total Stock Items
            </div>
            <div className="text-2xl font-bold">{totalItems}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Total Stock Value
            </div>
            <div className="text-2xl font-bold">
              ${totalStockValue.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardContent className="p-6">
          More detailed reports and charts can be added here.
        </CardContent>
      </Card>
    </div>
  );
}
