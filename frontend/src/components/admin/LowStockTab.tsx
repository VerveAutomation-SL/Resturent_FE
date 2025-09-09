import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InventoryIngredient } from "@/types";

type Props = {
  lowStockItems: InventoryIngredient[];
  acknowledgeAlert: (id: number) => void;
};

export default function LowStockTab({
  lowStockItems,
  acknowledgeAlert,
}: Props) {
  return (
    <div className="p-6">
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>Low Threshold</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lowStockItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>
                    {item.quantity} {item.unit}
                  </TableCell>
                  <TableCell>{item.low_stock_threshold}</TableCell>
                  <TableCell>{item.supplier}</TableCell>
                  <TableCell>
                    <button
                      className="text-sm text-primary"
                      onClick={() => acknowledgeAlert(item.id)}
                    >
                      Acknowledge
                    </button>
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
