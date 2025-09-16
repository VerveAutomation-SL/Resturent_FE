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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMemo, useState } from "react";
import { Transaction } from "@/types";

type Props = {
  transactions?: Transaction[];
};

export default function TransactionsTab({ transactions }: Props) {
  // Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  const filtered = useMemo(() => {
    if (!transactions) return [];
    return transactions.filter((t: Transaction) => {
      // search by ingredient name or notes
      const name = (t.Ingredient?.name || "").toString().toLowerCase();
      const notes = (t.notes || "").toString().toLowerCase();
      if (search) {
        const q = search.toLowerCase();
        if (!name.startsWith(q) && !notes.startsWith(q)) return false;
      }

      if (typeFilter && typeFilter !== "all") {
        if ((t.transaction_type || "") !== typeFilter) return false;
      }

      if (statusFilter && statusFilter !== "all") {
        if ((t.status || "").toString() !== statusFilter) return false;
      }

      if (fromDate) {
        const d = new Date(t.transaction_date || t.created_at);
        const f = new Date(fromDate);
        if (isNaN(d.getTime()) || d < f) return false;
      }
      if (toDate) {
        const d = new Date(t.transaction_date || t.created_at);
        const tDate = new Date(toDate);
        // include whole day
        tDate.setHours(23, 59, 59, 999);
        if (isNaN(d.getTime()) || d > tDate) return false;
      }

      return true;
    });
  }, [transactions, search, typeFilter, statusFilter, fromDate, toDate]);
  return (
    <div className="mt-6">
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <Input
              placeholder="Search by item or notes"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full"
            />

            <Select onValueChange={(v) => setTypeFilter(v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="stock_in">Stock In</SelectItem>
                <SelectItem value="stock_out">Stock Out</SelectItem>
                <SelectItem value="manual_adjustment">
                  Manual Adjustment
                </SelectItem>
              </SelectContent>
            </Select>

            <Select onValueChange={(v) => setStatusFilter(v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>

            <div className="grid grid-cols-2 gap-2">
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                placeholder="From date"
                className="text-sm"
              />
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                placeholder="To date"
                className="text-sm"
              />
            </div>
          </div>

          <div className="overflow-auto">
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
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground">
                        <div className="text-lg font-medium">
                          No transactions found
                        </div>
                        <div className="text-sm">
                          {!transactions || transactions.length === 0
                            ? "No transaction data available"
                            : "Try adjusting your filters to see results"}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((t: Transaction) => (
                    <TableRow key={t.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {t.Ingredient?.name || "Unknown"}
                          </div>
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
                          {t.transaction_type?.replace("_", " ").toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {t.previous_quantity} → {t.new_quantity}{" "}
                            {t.Ingredient?.unit}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Change: {Number(t.quantity) > 0 ? "+" : ""}
                            {t.quantity} {t.Ingredient?.unit}
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
                          {t.status?.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{t.User.name}</div>
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
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
