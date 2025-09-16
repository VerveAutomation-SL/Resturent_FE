import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type Props = {
  transactions?: any[];
};

export default function TransactionsTab({ transactions }: Props) {
  console.log("Transactions:", transactions);
  return (
    <div className="p-2 mt-6">
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Quantity Change</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Performed By</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions?.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{t.Ingredient.name}</div>
                      <div className="text-sm text-muted-foreground">
                        ID: {t.ingredient_id}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        t.transaction_type === "stock_in"
                          ? "default"
                          : t.transaction_type === "stock_out"
                            ? "destructive"
                            : t.transaction_type === "manual_adjustment"
                              ? "secondary"
                              : "outline"
                      }
                    >
                      {t.transaction_type.replace("_", " ").toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {t.previous_quantity} → {t.new_quantity}{" "}
                        {t.Ingredient.unit}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Change: {Number(t.quantity) > 0 ? "+" : ""}
                        {t.quantity} {t.Ingredient.unit}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        t.status === "completed"
                          ? "default"
                          : t.status === "pending"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {t.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {t.performed_by || t.user || "—"}
                      </div>
                      {t.approved_by && (
                        <div className="text-sm text-muted-foreground">
                          Approved by: {t.approved_by}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {new Date(
                          t.transaction_date || t.created_at
                        ).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(
                          t.transaction_date || t.created_at
                        ).toLocaleTimeString()}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      <div className="text-sm">{t.notes || "—"}</div>
                      {t.reference_type && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Ref: {t.reference_type}
                        </div>
                      )}
                      {t.total_cost && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Cost: ${t.total_cost}
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
