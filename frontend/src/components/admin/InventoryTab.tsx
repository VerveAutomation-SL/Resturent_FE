import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Download,
  Upload,
  Plus,
  Edit,
  RefreshCw,
  Eye,
} from "lucide-react";
import type { InventoryIngredient } from "@/types";

type Props = {
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  typeFilter: string;
  setTypeFilter: (s: string) => void;
  stockFilter: string;
  setStockFilter: (s: string) => void;
  getFilteredItems: () => InventoryIngredient[];
  setSelectedItem: (i: InventoryIngredient | null) => void;
  setShowTransactionForm: (v: boolean) => void;
  setShowCreateForm: (v: boolean) => void;
};

export default function InventoryTab({
  searchTerm,
  setSearchTerm,
  typeFilter,
  setTypeFilter,
  stockFilter,
  setStockFilter,
  getFilteredItems,
  setSelectedItem,
  setShowTransactionForm,
  setShowCreateForm,
}: Props) {
  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search by name, supplier, unit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            className="px-3 py-2 border rounded-md"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All Items</option>
          </select>
          <select
            className="px-3 py-2 border rounded-md"
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
          >
            <option value="all">All Items</option>
            <option value="low_stock">Low Stock</option>
            <option value="critical_stock">Critical Stock</option>
          </select>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button size="sm" variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button size="sm" onClick={() => setShowCreateForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Ingredient
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>Reserved</TableHead>
                <TableHead>Low/Critical Threshold</TableHead>
                <TableHead>Cost per Unit</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Last Restocked</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {getFilteredItems().map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="font-medium">{item.name}</div>
                  </TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell>
                    {item.quantity} {item.unit}
                  </TableCell>
                  <TableCell>
                    {item.reserved_quantity} {item.unit}
                  </TableCell>
                  <TableCell>
                    {item.low_stock_threshold} / {item.critical_stock_threshold}
                  </TableCell>
                  <TableCell>${item.cost_per_unit}</TableCell>
                  <TableCell>{item.supplier}</TableCell>
                  <TableCell>
                    {item.last_restocked_at
                      ? new Date(item.last_restocked_at).toLocaleDateString()
                      : "Never"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedItem(item);
                          setShowCreateForm(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowTransactionForm(true)}
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4" />
                      </Button>
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
