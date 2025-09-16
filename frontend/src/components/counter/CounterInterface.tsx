import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/api/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Minus,
  ShoppingCart,
  CreditCard,
  DollarSign,
  Check,
  Table as TableIcon,
  Search,
  Package,
  Car,
  Users,
  Receipt,
  X,
} from "lucide-react";
import type {
  Product,
  DiningTable,
  Order,
  ProcessPaymentRequest,
  CreateOrderRequest,
  CartItem,
} from "@/types";

export function CounterInterface() {
  // State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeTab, setActiveTab] = useState<"create" | "payment">("create");
  const [orderType, setOrderType] = useState<
    "dine_in" | "takeout" | "delivery"
  >("dine_in");
  const [selectedTable, setSelectedTable] = useState<DiningTable | null>(null);
  const [showTableModal, setShowTableModal] = useState(false);
  const [tableSearchTerm, setTableSearchTerm] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "card" | "others"
  >("cash");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");

  const queryClient = useQueryClient();

  // Data fetching
  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: () =>
      apiClient.getProducts().then((res) => {
        console.log(res.data);
        return res.data?.products || [];
      }),
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () =>
      apiClient.getCategories().then((res) => {
        console.log(res.data);
        return res.data;
      }),
  });

  const { data: tables } = useQuery({
    queryKey: ["tables"],
    queryFn: () =>
      apiClient.getAdminTables().then((res) => {
        console.log(res.data);
        return res.data?.tables || [];
      }),
  });

  const { data: orders } = useQuery({
    queryKey: ["orders", "pending"],
    queryFn: () =>
      apiClient.getOrders({ status: "confirmed" }).then((res) => {
        console.log(res.data);
        return res.data;
      }),
    enabled: activeTab === "payment",
  });

  // Mutations
  const createOrderMutation = useMutation({
    mutationFn: (orderData: CreateOrderRequest) =>
      apiClient.createCounterOrder(orderData),
    onSuccess: () => {
      setCart([]);
      setSelectedTable(null);
      setOrderNotes("");
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  const processPaymentMutation = useMutation({
    mutationFn: ({
      orderId,
      paymentData,
    }: {
      orderId: string;
      paymentData: ProcessPaymentRequest;
    }) => apiClient.processCounterPayment(orderId, paymentData),
    onSuccess: (_data, vars) => {
      // try to print receipt for the paid order
      try {
        if (vars?.orderId) void printReceipt(vars.orderId);
      } catch (e) {
        console.error("printReceipt failed", e);
      }

      setSelectedOrder(null);
      setPaymentAmount("");
      setReferenceNumber("");
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  // Helper functions
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existingItem = prev.find((item) => item.product.id === product.id);
      if (existingItem) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => {
      const existingItem = prev.find((item) => item.product.id === productId);
      if (existingItem && existingItem.quantity > 1) {
        return prev.map((item) =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      }
      return prev.filter((item) => item.product.id !== productId);
    });
  };

  const getTotalAmount = () => {
    return cart.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0
    );
  };

  // Filtered data
  const filteredProducts = products?.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .startsWith(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || product.category_id === selectedCategory;
    return matchesSearch && matchesCategory && product.is_available;
  });

  const filteredTables = tables?.filter(
    (table) =>
      table.table_number.toString().startsWith(tableSearchTerm) ||
      table.capacity.toString().startsWith(tableSearchTerm)
  );

  // Event handlers
  const handleTableSelect = (table: DiningTable) => {
    setSelectedTable(table);
    setShowTableModal(false);
    setTableSearchTerm("");
  };

  const handleCreateOrder = async () => {
    if (cart.length === 0) return;

    const orderData: CreateOrderRequest = {
      order_type: orderType,
      items: cart.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
      })),
      notes: orderNotes,
    };

    if (orderType === "dine_in" && selectedTable) {
      orderData.table_id = selectedTable.id;
    }

    createOrderMutation.mutate(orderData);
  };

  const handleProcessPayment = async () => {
    if (!selectedOrder || !paymentAmount) return;

    const paymentData: ProcessPaymentRequest = {
      payment_method: paymentMethod,
      amount: parseFloat(paymentAmount),
    };

    if (paymentMethod !== "cash" && referenceNumber) {
      paymentData.reference_number = referenceNumber;
    }

    processPaymentMutation.mutate({
      orderId: selectedOrder.id,
      paymentData,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Print a simple receipt for an order by fetching the order then opening a print window
  const printReceipt = async (orderId: string) => {
    try {
      const res = await apiClient.getOrder(orderId);
      const order = res?.data;
      if (!order) return;

      const anyOrder: any = order as any;
      const items = anyOrder.items || anyOrder.OrderItems || [];

      const rows = items
        .map((it: any) => {
          const name = it.product?.name || it.name || it.product_name || "Item";
          const qty = it.quantity ?? it.qty ?? 1;
          const price = it.price ?? it.unit_price ?? it.total_price ?? 0;
          const lineTotal = (it.total_price ?? price * qty) || 0;
          return `<tr><td>${name}</td><td style="text-align:center">${qty}</td><td style="text-align:right">${formatCurrency(lineTotal)}</td></tr>`;
        })
        .join("");

      const html = `
        <html>
          <head>
            <title>Receipt #${order.id}</title>
            <style>
              body{font-family:Arial,Helvetica,sans-serif;padding:16px;color:#111}
              h2{margin:0 0 8px}
              table{width:100%;border-collapse:collapse;margin-top:8px}
              td,th{padding:6px;border-bottom:1px solid #eee}
              .right{text-align:right}
            </style>
          </head>
          <body>
            <h2>Receipt</h2>
            <div>Order #: ${order.order_number ?? order.id}</div>
            <div>Type: ${order.order_type ?? "-"}</div>
            <div>Table: ${anyOrder.table?.table_number ?? anyOrder.RestaurantTable?.table_number ?? "-"}</div>
            <table>
              <thead>
                <tr><th>Item</th><th style="text-align:center">Qty</th><th style="text-align:right">Total</th></tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>
            <div style="margin-top:12px;display:flex;justify-content:space-between;font-weight:600">
              <div>Total</div>
              <div>${formatCurrency(order.price ?? getTotalAmount())}</div>
            </div>
            <div style="margin-top:18px;font-size:12px;color:#666">Thank you for your order</div>
          </body>
        </html>
      `;

      const w = window.open("", "_blank", "width=400,height=700");
      if (!w) return;
      w.document.open();
      w.document.write(html);
      w.document.close();
      w.focus();
      // Delay to allow resources to render
      setTimeout(() => {
        try {
          w.print();
        } catch (e) {
          console.error("Print failed", e);
        }
        try {
          w.close();
        } catch {}
      }, 500);
    } catch (err) {
      console.error("Failed to print receipt", err);
    }
  };

  const getOrderTypeIcon = (type: string) => {
    switch (type) {
      case "dine_in":
        return <Users className="w-4 h-4" />;
      case "takeout":
        return <Package className="w-4 h-4" />;
      case "delivery":
        return <Car className="w-4 h-4" />;
      default:
        return <ShoppingCart className="w-4 h-4" />;
    }
  };

  const getOrderTypeBadge = (type: string) => {
    const configs = {
      dine_in: { label: "Dine-In", color: "bg-blue-100 text-blue-800" },
      takeout: { label: "Takeout", color: "bg-green-100 text-green-800" },
      delivery: { label: "Delivery", color: "bg-purple-100 text-purple-800" },
    };
    const config = configs[type as keyof typeof configs] || configs.dine_in;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Left Side - Header with Tabs and Order Items */}
      <div className="w-full border-r border-border overflow-hidden flex flex-col">
        {/* Header with Tabs */}
        <div className="p-4 border-b border-border bg-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">Counter / Checkout</h1>
              <p className="text-muted-foreground">
                Create orders and process payments
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={activeTab === "create" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("create")}
              >
                <Plus className="w-4 h-4 mr-1" />
                Create Order
              </Button>
              <Button
                variant={activeTab === "payment" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("payment")}
              >
                <CreditCard className="w-4 h-4 mr-1" />
                Process Payment
              </Button>
            </div>
          </div>

          {activeTab === "create" && (
            <>
              {/* Order Type Selection */}
              <div className="flex gap-2 mb-4">
                <Button
                  variant={orderType === "dine_in" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setOrderType("dine_in")}
                >
                  <Users className="w-4 h-4 mr-1" />
                  Dine-In
                </Button>
                <Button
                  variant={orderType === "takeout" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setOrderType("takeout")}
                >
                  <Package className="w-4 h-4 mr-1" />
                  Takeout
                </Button>
                <Button
                  variant={orderType === "delivery" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setOrderType("delivery")}
                >
                  <Car className="w-4 h-4 mr-1" />
                  Delivery
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Content Area - Order Items */}
        {activeTab === "create" ? (
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Product Selection */}
            <div className="p-4 border-b border-border">
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Category Filter */}
              <div className="flex gap-2 overflow-x-auto">
                <Button
                  variant={selectedCategory === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory("all")}
                >
                  All Items
                </Button>
                {categories?.map((category) => (
                  <Button
                    key={category.id}
                    variant={
                      selectedCategory === category.id ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    {category.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Products Grid */}
            <div className="flex-1 overflow-y-auto p-4">
              {filteredProducts?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No items found</p>
                  <p className="text-sm">
                    {searchTerm || selectedCategory !== "all"
                      ? "Try adjusting your search or category filter"
                      : "No products available"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {filteredProducts?.map((product) => {
                    const cartItem = cart.find(
                      (item) => item.product.id === product.id
                    );
                    return (
                      <Card
                        key={product.id}
                        className="hover:shadow-lg transition-shadow aspect-square flex flex-col"
                      >
                        {/* Product Image */}
                        {product.image_url ? (
                          <div className="relative flex-1 overflow-hidden rounded-t-lg">
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-full h-full object-fit"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          </div>
                        ) : (
                          <div className="flex-1 w-full rounded-t-lg bg-gradient-to-r from-orange-400 to-pink-500 flex items-center justify-center">
                            <Package className="h-8 w-8 text-white" />
                          </div>
                        )}

                        <CardHeader className="p-2 flex-shrink-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-sm leading-tight truncate">
                                {product.name}
                              </CardTitle>
                              {product.description && (
                                <CardDescription className="text-xs mt-1 line-clamp-1">
                                  {product.description.substring(0, 25)}
                                  {product.description.length > 25 ? "..." : ""}
                                </CardDescription>
                              )}
                            </div>
                            <div className="text-sm font-bold text-primary ml-2">
                              {formatCurrency(product.price)}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-2 pt-0 flex-shrink-0 mt-auto">
                          <div className="flex items-center justify-between">
                            {product.is_available && (
                              <div className="flex items-center gap-1 w-full">
                                {cartItem ? (
                                  <div className="flex items-center gap-1 w-full">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => removeFromCart(product.id)}
                                      className="h-6 w-6 p-0"
                                    >
                                      <Minus className="h-2 w-2" />
                                    </Button>
                                    <span className="w-6 text-center font-medium text-xs">
                                      {cartItem.quantity}
                                    </span>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => addToCart(product)}
                                      className="h-6 w-6 p-0"
                                    >
                                      <Plus className="h-2 w-2" />
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => addToCart(product)}
                                    className="w-full h-6 text-xs"
                                  >
                                    <Plus className="h-2 w-2 mr-1" />
                                    Add
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Payment Tab Content */
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-4">
              <h3 className="text-lg font-semibold mb-4">
                Orders Ready for Payment
              </h3>
              {orders?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Receipt className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No orders ready for payment</p>
                </div>
              ) : (
                orders?.map((order) => (
                  <Card
                    key={order.id}
                    className={`cursor-pointer transition-all ${
                      selectedOrder?.id === order.id
                        ? "ring-2 ring-primary"
                        : "hover:shadow-md"
                    }`}
                    onClick={() => {
                      setSelectedOrder(order);
                      setPaymentAmount((order.price ?? 0).toString());
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getOrderTypeIcon(order.order_type)}
                          <div>
                            <div className="font-semibold">
                              Order #{order.order_number}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {order.RestaurantTable?.table_number &&
                                `Table ${order.RestaurantTable?.table_number} • `}
                              {order.OrderItems?.length || 0} items
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">
                            {formatCurrency(order.price ?? 0)}
                          </div>
                          <div className="flex items-center gap-2">
                            {getOrderTypeBadge(order.order_type)}
                            <Badge variant="outline" className="text-xs">
                              {order.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right Side - Table Selection and Product Selection */}
      <div className="w-1/2 flex flex-col bg-card">
        {activeTab === "create" ? (
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Cart Section */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4">
                <h3 className="font-semibold mb-3 flex items-center">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Order Items ({cart.length})
                </h3>

                {cart.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No items in order</p>
                    <p className="text-sm">
                      Add items from the menu to get started
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div
                        key={item.product.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">
                            {item.product.name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatCurrency(item.product.price)} ×{" "}
                            {item.quantity}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          <div className="font-medium">
                            {formatCurrency(item.product.price * item.quantity)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFromCart(item.product.id)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-6 text-center text-sm">
                              {item.quantity}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => addToCart(item.product)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Customer name input removed per request */}
              </div>
            </div>
            {/* Table Selection (for dine-in) */}
            {orderType === "dine_in" && (
              <div className="p-4 border-b border-border">
                <h3 className="font-semibold mb-3 flex items-center">
                  <TableIcon className="w-4 h-4 mr-2" />
                  Table Selection
                </h3>

                {/* Selected Table Display */}
                {selectedTable ? (
                  <div className="mb-3">
                    <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-semibold">
                            Table {selectedTable.table_number}
                          </span>
                          <span className="text-sm text-muted-foreground ml-2">
                            ({selectedTable.capacity} seats)
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowTableModal(true)}
                        >
                          Change Table
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mb-3">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setShowTableModal(true)}
                      className="w-full h-12 border-dashed"
                    >
                      <TableIcon className="w-4 h-4 mr-2" />
                      Select Table
                    </Button>
                  </div>
                )}

                {/* Table Selection Modal */}
                {showTableModal && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 max-h-[80vh] overflow-hidden">
                      <div className="flex items-center justify-between p-4 border-b">
                        <h3 className="text-lg font-semibold">Select Table</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowTableModal(false)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="p-4 space-y-4">
                        {/* Table Search */}
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                          <Input
                            placeholder="Search tables..."
                            value={tableSearchTerm}
                            onChange={(e) => setTableSearchTerm(e.target.value)}
                            className="pl-10"
                          />
                        </div>

                        {/* Tables Grid */}
                        <div className="max-h-[300px] overflow-y-auto">
                          {filteredTables?.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                              <TableIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                              <p className="text-sm">
                                {tableSearchTerm
                                  ? "No tables found"
                                  : "No available tables"}
                              </p>
                              {tableSearchTerm && (
                                <p className="text-xs">
                                  Try adjusting your search
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="grid grid-cols-3 gap-2">
                              {filteredTables?.map((table) => (
                                <Button
                                  key={table.id}
                                  variant={
                                    selectedTable?.id === table.id
                                      ? "default"
                                      : "outline"
                                  }
                                  size="sm"
                                  onClick={() => handleTableSelect(table)}
                                  className="h-16 flex flex-col items-center justify-center"
                                >
                                  <span className="font-semibold text-sm">
                                    Table {table.table_number}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {table.capacity} seats
                                  </span>
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Order Summary and Actions */}
            {cart.length > 0 && (
              <div className="p-4 border-t border-border bg-card">
                <div className="space-y-3">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total:</span>
                    <span>{formatCurrency(getTotalAmount())}</span>
                  </div>

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleCreateOrder}
                    disabled={
                      cart.length === 0 ||
                      (orderType === "dine_in" && !selectedTable) ||
                      createOrderMutation.isPending
                    }
                  >
                    {createOrderMutation.isPending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Creating Order...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Create{" "}
                        {orderType === "dine_in"
                          ? "Dine-In"
                          : orderType === "takeout"
                            ? "Takeout"
                            : "Delivery"}{" "}
                        Order
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Payment Tab - Payment Processing Interface */
          <>
            {selectedOrder && (
              <div className="p-4 border-t border-border bg-card space-y-4">
                <div className="border-b border-border pb-3">
                  <h3 className="font-semibold mb-3">Payment Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Order:</span>
                      <span>#{selectedOrder.order_number}</span>
                    </div>
                    {selectedOrder.customer_name && (
                      <div className="flex justify-between">
                        <span>Customer:</span>
                        <span>{selectedOrder.customer_name}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total:</span>
                      <span>{formatCurrency(selectedOrder.price ?? 0)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={paymentMethod === "cash" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPaymentMethod("cash")}
                    >
                      <DollarSign className="w-4 h-4 mr-1" />
                      Cash
                    </Button>
                    <Button
                      variant={paymentMethod === "card" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPaymentMethod("card")}
                    >
                      <CreditCard className="w-4 h-4 mr-1" />
                      Card
                    </Button>
                    <Button
                      variant={
                        paymentMethod === "others" ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setPaymentMethod("others")}
                      className="col-span-2"
                    >
                      Others
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Payment Amount
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                  />
                </div>

                {paymentMethod !== "cash" && (
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Reference Number
                    </label>
                    <Input
                      placeholder="Transaction reference"
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                    />
                  </div>
                )}

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleProcessPayment}
                  disabled={!paymentAmount || processPaymentMutation.isPending}
                >
                  {processPaymentMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Process Payment
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
