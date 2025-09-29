import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Search,
  Filter,
  Eye,
  X,
  Sheet,
  FileText,
  ChevronDown,
  Download,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { ReportFilterParams } from "@/types";

interface ReportFiltersProps {
  filters: ReportFilterParams;
  handleFilterChange: (key: keyof ReportFilterParams, value: string) => void;
  activeFilters: string[];
  clearFilter: (key: keyof ReportFilterParams) => void;
  onPreviewData: () => void;
  handleExportPDF: () => void;
  handleExportExcel: () => void;
  exportLoading: "pdf" | "excel" | null;
  exportDropdownOpen: boolean;
  setExportDropdownOpen: (open: boolean) => void;
  loading?: boolean;
  totalRecords?: number;
  onRemoveAllFilters: () => void;
}

export function ReportFilters({
  filters,
  handleFilterChange,
  activeFilters,
  clearFilter,
  onPreviewData,
  handleExportPDF,
  handleExportExcel,
  exportLoading,
  exportDropdownOpen,
  setExportDropdownOpen,
  loading: previewLoading = false,
  totalRecords = 0,
  onRemoveAllFilters,
}: ReportFiltersProps) {
  const handlePreviewClick = async () => {
    onPreviewData();
  };

  // Remove all filters handler now calls parent
  const handleRemoveAllFilters = () => {
    onRemoveAllFilters();
  };

  const getFilterLabel = (key: string, value: string): string => {
    switch (key) {
      case "startDate":
        return `From: ${new Date(value).toLocaleDateString()}`;
      case "endDate":
        return `To: ${new Date(value).toLocaleDateString()}`;
      case "orderType":
        return `Type: ${value.replace("_", " ")}`;
      case "status":
        return `Status: ${value}`;
      case "minAmount":
        return `Min: ${formatCurrency(Number(value))}`;
      case "maxAmount":
        return `Max: ${formatCurrency(Number(value))}`;
      case "searchTerm":
        return `Search: "${value}"`;
      default:
        return `${key}: ${value}`;
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Report Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Date Range Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startDate" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Start Date
            </Label>
            <Input
              id="startDate"
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              End Date
            </Label>
            <Input
              id="endDate"
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
              min={filters.startDate}
              className="w-full"
            />
          </div>
        </div>

        {/* Order Type and Status Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Order Type</Label>
            <Select
              value={filters.orderType || "all"}
              onValueChange={(value) =>
                handleFilterChange("orderType", value === "all" ? "" : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select order type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="dine_in">Dine In</SelectItem>
                <SelectItem value="delivery">Delivery</SelectItem>
                <SelectItem value="take_away">Take Away</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Order Status</Label>
            <Select
              value={filters.status || "all"}
              onValueChange={(value) =>
                handleFilterChange("status", value === "all" ? "" : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="served">Served</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Amount Range  */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="minAmount">Minimum Amount : </Label>
            <span className="text-xs text-muted-foreground">
              Total price of the order (minimum)
            </span>
            <Input
              id="minAmount"
              type="number"
              placeholder="0.00"
              value={filters.minAmount || ""}
              onChange={(e) => handleFilterChange("minAmount", e.target.value)}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxAmount">Maximum Amount : </Label>
            <span className="text-xs text-muted-foreground">
              Total price of the order (maximum)
            </span>
            <Input
              id="maxAmount"
              type="number"
              placeholder="0.00"
              value={filters.maxAmount || ""}
              onChange={(e) => handleFilterChange("maxAmount", e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        {/* Search Term */}
        <div className="space-y-2">
          <Label htmlFor="searchTerm" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            Search Orders
          </Label>
          <Input
            id="searchTerm"
            placeholder="Search by order ID, or product name..."
            value={filters.searchTerm}
            onChange={(e) => handleFilterChange("searchTerm", e.target.value)}
            className="w-full"
          />
        </div>

        {/* Active Filters Display */}
        {activeFilters.length > 0 && (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {activeFilters.map((filterKey) => {
                const value = filters[filterKey as keyof ReportFilterParams];
                if (!value) return null;

                return (
                  <Badge
                    key={filterKey}
                    variant="secondary"
                    className="flex items-center gap-1 pr-1"
                  >
                    <span className="text-xs">
                      {getFilterLabel(filterKey, String(value))}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        clearFilter(filterKey as keyof ReportFilterParams)
                      }
                      className="h-4 w-4 p-0 hover:bg-transparent"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
          <div className="flex gap-3">
            <Button
              onClick={handlePreviewClick}
              disabled={previewLoading}
              className="flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              {previewLoading
                ? "Loading..."
                : `Preview Data${totalRecords > 0 ? ` (${totalRecords})` : ""}`}
            </Button>
            <Button
              variant="outline"
              onClick={handleRemoveAllFilters}
              className="flex items-center gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
            >
              <X className="w-4 h-4" />
              Remove All Filters
            </Button>
          </div>
          <div className="relative w-full sm:w-auto">
            <button
              onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
              className="flex items-center justify-center gap-2 px-4 py-2 text-sm bg-white border-2 border-black text-black rounded-lg hover:bg-black hover:text-white transition-all duration-200 w-full sm:w-auto cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export Data</span>
              <span className="sm:hidden">Export</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  exportDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {exportDropdownOpen && (
              <div className="absolute right-0 sm:right-0 mt-2 w-64 sm:w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-50 min-w-max">
                <div className="py-2">
                  <button
                    onClick={handleExportPDF}
                    disabled={exportLoading !== null}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {exportLoading === "pdf" ? (
                      <div className="w-5 h-5 flex-shrink-0">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-red-500 border-t-transparent"></div>
                      </div>
                    ) : (
                      <FileText className="w-5 h-5 text-red-500 flex-shrink-0" />
                    )}
                    <div className="text-left flex-1">
                      <div className="font-medium">
                        {exportLoading === "pdf"
                          ? "Generating PDF..."
                          : "Export as PDF"}
                      </div>
                      <div className="text-xs text-gray-500">
                        Formatted report document
                      </div>
                    </div>
                  </button>

                  <div className="h-px bg-gray-100 mx-2"></div>

                  <button
                    onClick={handleExportExcel}
                    disabled={exportLoading !== null}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {exportLoading === "excel" ? (
                      <div className="w-5 h-5 flex-shrink-0">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-green-500 border-t-transparent"></div>
                      </div>
                    ) : (
                      <Sheet className="w-5 h-5 text-green-500 flex-shrink-0" />
                    )}
                    <div className="text-left flex-1">
                      <div className="font-medium">
                        {exportLoading === "excel"
                          ? "Generating Excel..."
                          : "Export as Excel"}
                      </div>
                      <div className="text-xs text-gray-500">
                        Spreadsheet with raw data
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Backdrop for mobile */}
          {exportDropdownOpen && (
            <div
              className="fixed inset-0 z-40 bg-transparent bg-opacity-10 sm:bg-transparent"
              onClick={() => setExportDropdownOpen(false)}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
