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

type Transaction = {
  id: number;
  item: InventoryIngredient;
  type: string;
  quantity: number;
  user: string;
  note?: string;
  created_at: string;
};

type Props = {
  transactions: Transaction[];
};

export default function TransactionsTab({ transactions }: Props) {
  return (
    <div className="p-6">
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>User</TableHead>
                <TableHead>When</TableHead>
                <TableHead>Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>{t.item.name}</TableCell>
                  <TableCell>{t.type}</TableCell>
                  <TableCell>{t.quantity}</TableCell>
                  <TableCell>{t.user}</TableCell>
                  <TableCell>
                    {new Date(t.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell>{t.note}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
