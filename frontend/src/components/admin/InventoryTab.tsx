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
  Trash2,
  Package,
} from "lucide-react";
import type { InventoryIngredient } from "@/types";

type Props = {
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  stockFilter: string;
  setStockFilter: (s: string) => void;
  getFilteredItems: () => InventoryIngredient[];
  setSelectedItem: (i: InventoryIngredient | null) => void;
  setShowTransactionForm: (v: boolean) => void;
  setShowCreateForm: (v: boolean) => void;
  onDeleteItem: (item: InventoryIngredient) => void;
};

export default function InventoryTab({
  searchTerm,
  setSearchTerm,
  stockFilter,
  setStockFilter,
  getFilteredItems,
  setSelectedItem,
  setShowCreateForm,
  onDeleteItem,
}: Props) {
  const items = getFilteredItems();
  return (
    <div className="space-y-4 mt-8">
      {20.0 > 5.0 ? (
        <div>Condition is true</div>
      ) : (
        <div>Condition is false</div>
      )}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative max-w-lg">
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
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
          >
            <option value="all">All Items</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowCreateForm(true)}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowCreateForm(true)}
          >
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
                <TableHead>Low / Out Threshold</TableHead>
                <TableHead>Cost per Unit</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Last Restocked</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9}>
                    <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted/60">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="text-lg font-medium text-foreground">
                        No Stocks found
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Try adjusting your search or add a new stock item
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
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
                    <TableCell>{item.low_stock_threshold} / 0</TableCell>
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
                          onClick={() => onDeleteItem(item)}
                          className="hover:bg-red-50 hover:border-red-200 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        {/* <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowTransactionForm(true)}
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button> */}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
