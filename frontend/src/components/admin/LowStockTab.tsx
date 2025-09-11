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
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/api/client";

type Props = {
  acknowledgeAlert: (id: number) => void;
};

export default function LowStockTab({ acknowledgeAlert }: Props) {
  const { data: lowStockItems, isLoading: statsLoading } = useQuery({
    queryKey: ["low-stock-items"],
    queryFn: () =>
      apiClient.getLowStock().then((res) => {
        console.log("Fetched low stock items:", res.data);
        return res.data;
      }),
  });
  return (
    <div className="mt-8">
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
              {lowStockItems && lowStockItems.length > 0 ? (
                lowStockItems.map((item) => (
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
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="text-muted-foreground">
                      <p className="text-sm font-medium">No low stock items</p>
                      <p className="text-xs">
                        All ingredients are above their low stock thresholds
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
