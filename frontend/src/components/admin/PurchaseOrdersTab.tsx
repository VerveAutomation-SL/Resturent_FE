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
import type { InventoryIngredient } from "@/types";

type PO = {
  id: number;
  po_number: string;
  vendor: string;
  status: string;
  items: Array<{ item: InventoryIngredient; qty: number; unit_cost?: number }>;
  total: number;
  created_at: string;
};

type Props = {
  purchaseOrders: PO[];
};

export default function PurchaseOrdersTab({ purchaseOrders }: Props) {
  return (
    <div className="p-6">
      <div className="mb-4 flex justify-end">
        <button className="btn btn-primary">Create Purchase Order</button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PO#</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchaseOrders.map((po) => (
                <TableRow key={po.id}>
                  <TableCell>{po.po_number}</TableCell>
                  <TableCell>{po.vendor}</TableCell>
                  <TableCell>{po.status}</TableCell>
                  <TableCell>{po.items.length}</TableCell>
                  <TableCell>${po.total.toFixed(2)}</TableCell>
                  <TableCell>
                    {new Date(po.created_at).toLocaleString()}
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
