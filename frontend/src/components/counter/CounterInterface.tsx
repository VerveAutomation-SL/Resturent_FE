import { useEffect, useState } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Minus,
  ShoppingCart,
  CreditCard,
  DollarSign,
  Check,
  CheckCircle,
  Table as TableIcon,
  Search,
  Package,
  Car,
  Users,
  Receipt,
  ChevronDown,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { X } from "lucide-react";
import { toastHelpers } from "@/lib/toast-helpers";
import { formatCurrency } from "@/lib/utils";

import type {
  Product,
  DiningTable,
  Order,
  ProcessPaymentRequest,
  CreateOrderRequest,
  CartItem,
  UpdateOrderRequest,
  User,
} from "@/types";

import { OrderStatus } from "@/types";
import { useRouter } from "@tanstack/react-router";
import { useNavigationRefresh } from "@/hooks/useNavigationRefresh";

function CounterProductSkeleton() {
  return (
    <Card className="hover:shadow-lg transition-shadow aspect-square flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4 border-b">
        <Skeleton className="w-16 h-16 rounded-lg" />
      </div>
      <CardContent className="p-3 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-3/4" />
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-8 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}

function CounterTableSkeleton() {
  return (
    <Card className="cursor-pointer transition-all hover:shadow-lg">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-full" />
          <div className="flex justify-between items-center pt-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CounterOrderSkeleton() {
  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Skeleton className="h-10 w-10 rounded" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3 pt-3 border-t space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </CardContent>
    </Card>
  );
}

export function CounterInterface() {
  const router = useRouter();

  const queryClient = useQueryClient();

  // State
  const [user, setUser] = useState<User>();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [existingOrderItems, setExistingOrderItems] = useState<CartItem[]>([]); // Track existing order items separately
  const [activeTab, setActiveTab] = useState<"create" | "payment">("create");
  const [orderType, setOrderType] = useState<
    "dine_in" | "take_away" | "delivery"
  >("dine_in");
  const [selectedTable, setSelectedTable] = useState<DiningTable | null>(null);
  const [tableSearchTerm, setTableSearchTerm] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [currentView, setCurrentView] = useState<"tables" | "products">(
    "tables"
  );
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set()); // Track which orders are expanded
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "card" | "others"
  >("cash");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");

  const { manualRefresh, isRefreshing } = useNavigationRefresh([
    "products",
    "categories",
    "orders",
    "tables",
  ]);

  useEffect(() => {
    const decodedToken = apiClient.isAuthenticated();

    if (decodedToken) {
      setUser(decodedToken);
    } else {
      toastHelpers.sessionExpired();
      router.navigate({ to: "/login" });
    }
  }, []);

  // Set payment amount to order total when order is selected
  useEffect(() => {
    if (selectedOrder && activeTab === "payment") {
      const breakdown = getOrderPaymentBreakdown(selectedOrder);
      setPaymentAmount(breakdown.total.toString());
    }
  }, [selectedOrder, activeTab]);

  // Data fetching
  const { data: products, isLoading: loadingProducts } = useQuery({
    queryKey: ["products"],
    queryFn: () =>
      apiClient.getProducts().then((res) => {
        // console.log(res.data);
        return res.data?.products || [];
      }),
  });

  const { data: categories, isLoading: loadingCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: () =>
      apiClient.getCategories().then((res) => {
        return res.data;
      }),
  });

  const { data: tables, isLoading: loadingTables } = useQuery({
    queryKey: ["tables"],
    queryFn: () =>
      apiClient.getAdminTables().then((res) => {
        // console.log(res.data);
        return res.data?.tables || [];
      }),
  });

  const { data: orders, isLoading: loadingOrders } = useQuery({
    queryKey: ["orders"],
    queryFn: () =>
      apiClient.getOrders({ status: "confirmed" }).then((res) => {
        console.log("Orders:", res.data);
        return res.data;
      }),
    enabled: activeTab === "payment" || currentView === "tables",
  });

  // Show loading screen when backend is called (not cache fetch)
  const isLoadingAny =
    isRefreshing ||
    loadingProducts ||
    loadingCategories ||
    loadingTables ||
    loadingOrders;

  // Order Create Mutations
  const createOrderMutation = useMutation({
    mutationFn: (orderData: CreateOrderRequest) =>
      apiClient.createCounterOrder(orderData),
    onSuccess: () => {
      setCart([]);
      setSelectedTable(null);
      setSelectedOrder(null); // Clear selected order
      setOrderNotes("");
      setCurrentView("tables");
      setOrderType("dine_in");
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["tables"] });
    },
    onError: (err: any) => {
      console.error("Create order failed:", err);
      toastHelpers.error(
        "Order Creation Failed",
        err.message || "Failed to create order. Please try again."
      );
    },
  });

  // order update Mutation
  const updateOrderMutation = useMutation({
    mutationFn: (orderData: UpdateOrderRequest) =>
      apiClient.updateCounterOrder(orderData),
    onSuccess: () => {
      setCart([]);
      setSelectedTable(null);
      setSelectedOrder(null); // Clear selected order
      setExistingOrderItems([]);
      setOrderNotes("");
      setCurrentView("tables");
      setOrderType("dine_in");
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      console.log("Order updated successfully");
    },
    onError: (err: any) => {
      console.error("Update order failed:", err);
      toastHelpers.error(
        "Order Update Failed",
        "Failed to update order. Please try again."
      );
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
      console.log("processPaymentMutation onSuccess", vars);
      try {
        if (vars?.orderId) void printReceipt(vars.orderId);
      } catch (e) {
        console.error("printReceipt failed", e);
      }

      setSelectedOrder(null);
      setSelectedTable(null);
      setCart([]);
      setPaymentAmount("");
      setReferenceNumber("");
      setCurrentView("tables");
      setOrderType("dine_in");
      setActiveTab("create");
      setExistingOrderItems([]);
      // Show payment completed toast
      try {
        toastHelpers.success(
          "Payment Completed Successfully!",
          `Order ${vars.orderId} has been paid ${formatCurrency(Number(vars.paymentData.amount))} via ${vars.paymentData.payment_method}. Receipt printed.`
        );
      } catch (e) {
        console.error("Toast failed", e);
      }
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["tables"] });
    },
    onError: (err: any) => {
      console.error("Payment processing failed:", err);
      toastHelpers.error(
        "Payment Processing Failed",
        "Failed to process payment. Please try again."
      );
    },
  });

  const cancelOrderMutation = useMutation({
    mutationFn: (orderId: string) =>
      apiClient.updateOrderStatus(orderId, OrderStatus.CANCELLED),
    onSuccess: () => {
      setSelectedOrder(null);
      setSelectedTable(null);
      setCart([]);
      setExistingOrderItems([]);
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      toastHelpers.success(
        "Order Cancelled Successfully",
        "The order has been cancelled and the table is now available for new orders."
      );
      setActiveTab("create");
      setCurrentView("tables");
      setOrderType("dine_in");
    },
    onError: (err: any) => {
      toastHelpers.error(
        "Cancel Failed",
        err?.message || "Failed to cancel order. Please try again."
      );
    },
  });

  // Helper functions
  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existingItem = prev.find((item) => item.Product.id === product.id);
      if (existingItem) {
        return prev.map((item) =>
          item.Product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { Product: product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => {
      const existingItem = prev.find((item) => item.Product.id === productId);
      if (existingItem && existingItem.quantity > 1) {
        return prev.map((item) =>
          item.Product.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      }
      return prev.filter((item) => item.Product.id !== productId);
    });
  };

  const getTotalAmount = () => {
    return cart.reduce(
      (total, item) => total + item.Product.price * item.quantity,
      0
    );
  };

  const getPaymentBreakdown = () => {
    const subtotal = getTotalAmount();
    const serviceChargeRate =
      orderType === "dine_in"
        ? import.meta.env.VITE_SERVICE_CHARGE_RATE || 0.1
        : 0; // 10% service charge only for dine-in
    const serviceCharge = subtotal * serviceChargeRate;
    const total = subtotal + serviceCharge;

    return {
      subtotal,
      serviceCharge,
      total,
    };
  };

  const getOrderPaymentBreakdown = (order: Order) => {
    if (!order.OrderItems) return { subtotal: 0, serviceCharge: 0, total: 0 };

    const subtotal = order.OrderItems.reduce(
      (sum, item) => sum + item.quantity * (item.Product?.price || 0),
      0
    );
    const serviceChargeRate =
      order.order_type === "dine_in"
        ? import.meta.env.VITE_SERVICE_CHARGE_RATE || 0.1
        : 0; // 10% service charge only for dine-in
    const serviceCharge = subtotal * serviceChargeRate;
    const total = subtotal + serviceCharge;

    return {
      subtotal,
      serviceCharge,
      total,
    };
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

  // Get orders for occupied tables
  const getTableOrder = (tableId: string) => {
    return orders?.find(
      (order) =>
        order.table_id === tableId || order.RestaurantTable?.id === tableId
    );
  };

  // Event handlers
  const handleTableSelect = (table: DiningTable) => {
    const occupied = table.status === "occupied";
    const tableOrder = getTableOrder(table.id);

    setSelectedTable(table);
    setCurrentView("products");
    setTableSearchTerm("");

    // If table is occupied and has an order, load the existing items separately
    if (occupied && tableOrder && tableOrder.OrderItems) {
      const existingItems: any[] = tableOrder.OrderItems.map((orderItem) => {
        return { Product: orderItem.Product, quantity: orderItem.quantity };
      });
      console.log("existingItems", existingItems);

      setExistingOrderItems(existingItems);
      setCart([]);

      // Set the selected order for potential updates
      setSelectedOrder(tableOrder);
    } else {
      // Clear both carts for new orders on available tables
      setExistingOrderItems([]);
      setCart([]);
      setSelectedOrder(null);
    }
  };

  const handleCreateOrder = async () => {
    if (cart.length === 0) {
      return toastHelpers.error(
        "No Items in Cart",
        "Please add items to the cart before creating an order."
      );
    }
    // If editing an existing order, call update mutation
    if (selectedOrder) {
      const updateData: UpdateOrderRequest = {
        order_id: selectedOrder.id,
        items: cart.map((item) => ({
          product_id: item.Product.id,
          quantity: item.quantity,
        })),
        notes: orderNotes,
      };
      updateOrderMutation.mutate(updateData);
      return;
    }

    // Otherwise create a new order
    const orderData: CreateOrderRequest = {
      order_type: orderType,
      items: cart.map((item) => ({
        product_id: item.Product.id,
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

  // Print a comprehensive receipt for an order by fetching the order then opening a print window
  const printReceipt = async (orderId: string) => {
    try {
      const res = await apiClient.getOrder(orderId);
      const order = res?.data;
      if (!order) return;

      const anyOrder: any = order as any;

      // Extract invoice details
      const invoice = anyOrder.Invoice || {};
      const items = anyOrder.OrderItems || [];
      const restaurantTable = anyOrder.RestaurantTable || {};

      // Invoice information
      const invoiceNumber = invoice.invoice_number || `INV-${order.id}`;
      const amountPaid = invoice.amount_paid || "0.00";
      const changeAmount = invoice.change_amount || "0.00";
      const discountAmount = invoice.discount_amount || "0.00";
      const serviceChargeAmount = invoice.service_charge_amount || "0.00";
      const serviceChargePercentage =
        invoice.service_charge_percentage || "0.00";
      const subtotal = invoice.subtotal || "0.00";
      const totalAmount = invoice.total_amount || "0.00";
      const paymentMethod = invoice.payment_method || "cash";
      const paymentStatus = invoice.payment_status || "pending";
      const notes = invoice.notes || order.notes || "";

      // Format dates
      const orderDate = order.created_at
        ? new Date(order.created_at).toLocaleString()
        : "-";
      const paidDate = invoice.paid_at
        ? new Date(invoice.paid_at).toLocaleString()
        : "-";
      const dueDate = invoice.due_date
        ? new Date(invoice.due_date).toLocaleString()
        : "-";

      // Table information
      const tableNumber = restaurantTable.table_number || "-";
      const tableCapacity = restaurantTable.capacity || "-";

      // Order information
      const orderType = (order.order_type || "")
        .replace("_", " ")
        .toUpperCase();

      // Build item rows with comprehensive details
      const rows = items
        .map((item: any) => {
          const productName =
            item.Product?.name || item.product?.name || "Item";
          const quantity = item.quantity || 1;
          const unitPrice = item.Product?.price || item.price || 0;
          const lineTotal = quantity * unitPrice;

          return `<tr>
            <td>${productName}</td>
            <td style="text-align:center">${quantity}</td>
            <td style="text-align:right">${formatCurrency(unitPrice)}</td>
            <td style="text-align:right">${formatCurrency(lineTotal)}</td>
          </tr>`;
        })
        .join("");

      const html = `
        <html>
          <head>
            <title>Invoice #${invoiceNumber}</title>
            <style>
              body{font-family:Arial,Helvetica,sans-serif;padding:20px;color:#111;max-width:450px;margin:0 auto}
              .header{text-align:center;border-bottom:2px solid #333;padding-bottom:10px;margin-bottom:15px}
              h2{margin:0 0 5px;font-size:24px}
              .business-name{font-size:18px;font-weight:bold;margin-bottom:3px}
              .invoice-info{margin-bottom:15px}
              .info-row{display:flex;justify-content:space-between;margin-bottom:3px;font-size:13px}
              .info-section{margin-bottom:15px;padding-bottom:10px;border-bottom:1px solid #eee}
              table{width:100%;border-collapse:collapse;margin:10px 0}
              td,th{padding:6px 4px;border-bottom:1px solid #ddd;font-size:12px}
              th{background:#f5f5f5;font-weight:bold}
              .totals{border-top:2px solid #333;padding-top:10px;margin-top:10px}
              .total-row{display:flex;justify-content:space-between;margin-bottom:4px;font-size:13px}
              .final-total{font-weight:bold;font-size:16px;border-top:1px solid #333;padding-top:6px;margin-top:6px}
              .payment-details{margin-top:15px;padding-top:10px;border-top:1px solid #ddd}
              .footer{text-align:center;margin-top:20px;font-size:12px;color:#666}
              .notes{margin-top:10px;font-style:italic;font-size:12px;background:#f9f9f9;padding:8px;border-radius:4px}
              .status{padding:2px 6px;border-radius:3px;font-size:11px;font-weight:bold}
              .status-paid{background:#d4edda;color:#155724}
              .status-pending{background:#fff3cd;color:#856404}
            </style>
          </head>
          <body>
            <div class="header">
              <div class="business-name">Mantraa</div>
              <div style="font-size:14px;color:#666">#${invoiceNumber}</div>
            </div>
            
            <div class="info-section">
              <div class="info-row">
                <span><strong>Order #:</strong></span>
                <span>${order.id}</span>
              </div>
              <div class="info-row">
                <span><strong>Order Type:</strong></span>
                <span>${orderType}</span>
              </div>
              ${
                tableNumber !== "-"
                  ? `
              <div class="info-row">
                <span><strong>Table:</strong></span>
                <span>#${tableNumber} (Capacity: ${tableCapacity})</span>
              </div>
              `
                  : ""
              }
              <div class="info-row">
                <span><strong>Order Date:</strong></span>
                <span>${orderDate}</span>
              </div>
              <div class="info-row">
                <span><strong>Status:</strong></span>
                <span class="status ${paymentStatus === "paid" ? "status-paid" : "status-pending"}">${paymentStatus.toUpperCase()}</span>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th style="text-align:left">Item</th>
                  <th style="text-align:center">Qty</th>
                  <th style="text-align:right">Unit Price</th>
                  <th style="text-align:right">Total</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>

            <div class="totals">
              <div class="total-row">
                <span>Subtotal:</span>
                <span>${formatCurrency(Number(subtotal))}</span>
              </div>
              ${
                Number(discountAmount) > 0
                  ? `
              <div class="total-row" style="color:#d63384">
                <span>Discount:</span>
                <span>-${formatCurrency(Number(discountAmount))}</span>
              </div>
              `
                  : ""
              }
              ${
                Number(serviceChargeAmount) > 0
                  ? `
              <div class="total-row">
                <span>Service Charge (${serviceChargePercentage}%):</span>
                <span>${formatCurrency(Number(serviceChargeAmount))}</span>
              </div>
              `
                  : ""
              }
              <div class="total-row final-total">
                <span>Total Amount:</span>
                <span>${formatCurrency(Number(totalAmount))}</span>
              </div>
            </div>

            ${
              paymentStatus === "paid"
                ? `
            <div class="payment-details">
              <div class="info-row">
                <span><strong>Payment Method:</strong></span>
                <span>${paymentMethod.toUpperCase()}</span>
              </div>
              <div class="info-row">
                <span><strong>Amount Paid:</strong></span>
                <span>${formatCurrency(Number(amountPaid))}</span>
              </div>
              ${
                Number(changeAmount) > 0
                  ? `
              <div class="info-row">
                <span><strong>Change:</strong></span>
                <span>${formatCurrency(Number(changeAmount))}</span>
              </div>
              `
                  : ""
              }
              ${
                paidDate !== "-"
                  ? `
              <div class="info-row">
                <span><strong>Payment Date:</strong></span>
                <span>${paidDate}</span>
              </div>
              `
                  : ""
              }
            </div>
            `
                : `
            <div class="payment-details">
              <div class="info-row">
                <span><strong>Payment Status:</strong></span>
                <span class="status status-pending">PENDING</span>
              </div>
              ${
                dueDate !== "-"
                  ? `
              <div class="info-row">
                <span><strong>Due Date:</strong></span>
                <span>${dueDate}</span>
              </div>
              `
                  : ""
              }
            </div>
            `
            }

            ${
              notes
                ? `
            <div class="notes">
              <strong>Notes:</strong> ${notes}
            </div>
            `
                : ""
            }

            <div class="footer">
              <p>Thank you for your order!</p>
              <p>Please come again</p>
              ${paymentStatus !== "paid" ? '<p style="color:#856404;font-weight:bold">** PAYMENT PENDING **</p>' : ""}
            </div>
          </body>
        </html>
      `;

      const w = window.open("", "_blank", "width=500,height=900");
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
      // Show error toast to user
      toastHelpers.error(
        "Receipt Print Failed",
        "Failed to generate receipt. Please try again."
      );
    }
  };

  const getOrderTypeIcon = (type: string) => {
    switch (type) {
      case "dine_in":
        return <Users className="w-4 h-4" />;
      case "take_away":
        return <Package className="w-4 h-4" />;
      case "delivery":
        return <Car className="w-4 h-4" />;
      default:
        return <ShoppingCart className="w-4 h-4" />;
    }
  };

  const getOrderTypeBadge = (type: string) => {
    const configs = {
      dine_in: { label: "Dine-In", color: "bg-gray-200 text-gray-900" },
      take_away: { label: "Take Away", color: "bg-gray-300 text-gray-900" },
      delivery: { label: "Delivery", color: "bg-gray-400 text-white" },
    };
    const config = configs[type as keyof typeof configs] || configs.dine_in;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  return (
    <div
      className={`flex bg-background ${user?.role === "admin" ? "h-screen" : "h-[92vh]"}`}
    >
      {/* Left Side - Header with Tabs and Order Items */}
      <div className="w-full border-r border-border overflow-hidden flex flex-col">
        {/* Header with Tabs */}
        <div className="p-4 border-b border-border bg-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Counter / Checkout</h1>
              <p className="text-muted-foreground">
                Create orders and process payments
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={manualRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
                />
                {isRefreshing ? "Refreshing..." : "Refresh"}
              </Button>
              <Button
                variant={activeTab === "create" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSelectedOrder(null);
                  setSelectedTable(null);
                  setCart([]);
                  setPaymentAmount("");
                  setReferenceNumber("");
                  setCurrentView("tables");
                  setOrderType("dine_in");
                  setActiveTab("create");
                  setExistingOrderItems([]);
                }}
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
              <div className="flex justify-between mt-2">
                {/* Hide order type buttons once a table is selected */}
                <div className="flex items-center gap-2">
                  <Button
                    variant={orderType === "dine_in" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setOrderType("dine_in");
                      setCurrentView("tables");
                      setSelectedTable(null);
                      setExistingOrderItems([]);
                      setCart([]);
                      setSelectedOrder(null);
                    }}
                  >
                    <Users className="w-4 h-4 mr-1" />
                    Dine-In
                  </Button>
                  <Button
                    variant={orderType === "take_away" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setOrderType("take_away");
                      setCurrentView("products");
                      setSelectedTable(null);
                      setExistingOrderItems([]);
                      setCart([]);
                      setSelectedOrder(null);
                    }}
                  >
                    <Package className="w-4 h-4 mr-1" />
                    Take Away
                  </Button>
                  <Button
                    variant={orderType === "delivery" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setOrderType("delivery");
                      setCurrentView("products");
                      setSelectedTable(null);
                      setExistingOrderItems([]);
                      setCart([]);
                      setSelectedOrder(null);
                    }}
                  >
                    <Car className="w-4 h-4 mr-1" />
                    Delivery
                  </Button>
                </div>

                <div />
              </div>
            </>
          )}
        </div>

        {/* Content Area - Tables or Products based on current view */}
        {activeTab === "create" ? (
          <div className="flex-1 overflow-hidden flex flex-col">
            {currentView === "tables" ? (
              /* Table Selection View */
              <div className="flex-1 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-border">
                  {/* Table Search */}
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {orderType === "dine_in" && (
                        <Button
                          variant={"default"}
                          size="sm"
                          onClick={() => {
                            setCurrentView("tables");
                          }}
                        >
                          <TableIcon className="w-4 h-4 mr-1" />
                          Tables
                        </Button>
                      )}
                      <Button
                        variant={"outline"}
                        size="sm"
                        onClick={() => setCurrentView("products")}
                        disabled={orderType === "dine_in" && !selectedTable}
                      >
                        <Package className="w-4 h-4 mr-1" />
                        Products
                      </Button>
                    </div>
                    <div className="flex-1 ml-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          placeholder="Search tables..."
                          value={tableSearchTerm}
                          onChange={(e) => setTableSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Table Status Summary */}
                  {filteredTables && filteredTables.length > 0 && (
                    <div className="flex gap-3 text-sm text-muted-foreground mb-2">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-green-200 border border-green-300 rounded"></div>
                        <span>
                          Available:{" "}
                          {
                            filteredTables.filter(
                              (t) => !t.status || t.status === "available"
                            ).length
                          }
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-red-200 border border-red-300 rounded"></div>
                        <span>
                          Occupied:{" "}
                          {
                            filteredTables.filter(
                              (t) => t.status === "occupied"
                            ).length
                          }
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Tables Grid */}
                <div
                  className="flex-1 overflow-y-auto p-4"
                  onClick={(e) => {
                    const target = e.target as HTMLElement | null;
                    // if click did not originate from a table card (or inside one), clear selection
                    if (!target || !target.closest("[data-table-card]")) {
                      setSelectedTable(null);
                      setExistingOrderItems([]);
                      setCart([]);
                      setSelectedOrder(null);
                    }
                  }}
                >
                  {isLoadingAny ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      {Array.from({ length: 8 }, (_, i) => (
                        <CounterTableSkeleton key={i} />
                      ))}
                    </div>
                  ) : filteredTables?.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <TableIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No tables found</p>
                      <p className="text-sm">
                        {tableSearchTerm
                          ? "Try adjusting your search"
                          : "No tables available"}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      {filteredTables?.map((table) => {
                        const occupied = table.status === "occupied";

                        return (
                          <Card
                            data-table-card
                            key={table.id}
                            className={`cursor-pointer transition-all hover:shadow-lg ${
                              selectedTable?.id === table.id
                                ? "ring-2 ring-black bg-gray-100"
                                : occupied
                                  ? "bg-gray-100 border-gray-300 hover:shadow-md hover:bg-gray-200"
                                  : "bg-gray-100 border-gray-300 hover:shadow-md hover:bg-gray-200"
                            }`}
                            onClick={(ev: React.MouseEvent) => {
                              ev.stopPropagation();
                              handleTableSelect(table);
                            }}
                          >
                            <CardContent className="p-4 text-center space-y-3">
                              <div className="flex items-center justify-center">
                                <TableIcon className={`w-12 h-12 text-black`} />
                              </div>

                              <div>
                                <div className="font-semibold text-lg">
                                  Table {table.table_number}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {table.capacity} seats
                                </div>

                                {/* Status Badge */}
                                <div className="mt-2">
                                  <Badge
                                    className={
                                      occupied
                                        ? "bg-red-200 text-red-800 hover:bg-red-300"
                                        : "bg-green-200 text-green-800 hover:bg-green-300"
                                    }
                                  >
                                    {occupied ? "Occupied" : "Available"}
                                  </Badge>
                                </div>
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
              /* Product Selection View */
              <div className="flex-1 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-border">
                  {/* Search */}
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {orderType === "dine_in" && (
                        <Button
                          variant={"outline"}
                          size="sm"
                          onClick={() => setCurrentView("tables")}
                        >
                          <TableIcon className="w-4 h-4 mr-1" />
                          Tables
                        </Button>
                      )}
                      <Button
                        variant={"default"}
                        size="sm"
                        onClick={() => setCurrentView("products")}
                        disabled={orderType === "dine_in" && !selectedTable}
                      >
                        <Package className="w-4 h-4 mr-1" />
                        Products
                      </Button>
                    </div>
                    <div className="flex-1 ml-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          placeholder="Search products..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Category Filter */}
                  <div className="flex gap-2 overflow-x-auto">
                    <Button
                      variant={
                        selectedCategory === "all" ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setSelectedCategory("all")}
                    >
                      All Items
                    </Button>
                    {isLoadingAny
                      ? Array.from({ length: 4 }, (_, i) => (
                          <Skeleton key={i} className="h-8 w-20" />
                        ))
                      : categories?.map((category) => (
                          <Button
                            key={category.id}
                            variant={
                              selectedCategory === category.id
                                ? "default"
                                : "outline"
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
                  {isLoadingAny ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                      {Array.from({ length: 12 }, (_, i) => (
                        <CounterProductSkeleton key={i} />
                      ))}
                    </div>
                  ) : filteredProducts?.length === 0 ? (
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
                          (item) => item.Product.id === product.id
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
                              <div className="flex-1 w-full rounded-t-lg bg-gradient-to-r from-gray-400 to-gray-600 flex items-center justify-center">
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
                                      {product.description.length > 25
                                        ? "..."
                                        : ""}
                                    </CardDescription>
                                  )}
                                </div>
                                <div className="text-sm font-bold text-black ml-2">
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
                                          onClick={() =>
                                            removeFromCart(product.id)
                                          }
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
            )}
          </div>
        ) : (
          /* Payment Tab Content */
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-4">
              <h3 className="text-lg font-semibold mb-4">
                Orders Ready for Payment
              </h3>
              {isLoadingAny ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }, (_, i) => (
                    <CounterOrderSkeleton key={i} />
                  ))}
                </div>
              ) : orders?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Receipt className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No orders ready for payment</p>
                </div>
              ) : (
                orders?.map((order) => {
                  const isExpanded = expandedOrders.has(order.id);
                  return (
                    <Card
                      key={order.id}
                      className={`transition-all ${
                        selectedOrder?.id === order.id
                          ? "ring-2 ring-primary"
                          : "hover:shadow-md"
                      }`}
                    >
                      <CardContent className="p-4">
                        <div
                          className="flex items-center justify-between cursor-pointer"
                          onClick={() => {
                            setSelectedOrder(order);
                            setPaymentAmount((order.price ?? 0).toString());
                          }}
                        >
                          <div className="flex items-center gap-3">
                            {getOrderTypeIcon(order.order_type)}
                            <div>
                              <div className="font-semibold">
                                Order #{order.id}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {order.RestaurantTable?.table_number &&
                                  `Table ${order.RestaurantTable?.table_number} • `}
                                {order.OrderItems?.length || 0} items
                              </div>
                            </div>
                          </div>
                          <div className="text-right flex items-center gap-2">
                            <div>
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
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleOrderExpansion(order.id);
                              }}
                              className="ml-2"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Expanded Details */}
                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t border-border">
                            <div className="space-y-3">
                              {/* Order Information */}
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <div className="font-medium text-muted-foreground">
                                    Order Number
                                  </div>
                                  <div>{order.id}</div>
                                </div>
                                <div>
                                  <div className="font-medium text-muted-foreground">
                                    Status
                                  </div>
                                  <div className="capitalize">
                                    {order.status}
                                  </div>
                                </div>
                                {order.RestaurantTable && (
                                  <div>
                                    <div className="font-medium text-muted-foreground">
                                      Table
                                    </div>
                                    <div>
                                      Table {order.RestaurantTable.table_number}
                                    </div>
                                  </div>
                                )}
                                <div>
                                  <div className="font-medium text-muted-foreground">
                                    Order Type
                                  </div>
                                  <div className="capitalize">
                                    {order.order_type.replace("_", " ")}
                                  </div>
                                </div>
                                {order.created_at && (
                                  <div>
                                    <div className="font-medium text-muted-foreground">
                                      Created At
                                    </div>
                                    <div>
                                      {new Date(
                                        order.created_at
                                      ).toLocaleString()}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Order Items */}
                              {order.OrderItems &&
                                order.OrderItems.length > 0 && (
                                  <div>
                                    <div className="font-medium text-muted-foreground mb-2">
                                      Order Items
                                    </div>
                                    <div className="space-y-2">
                                      {order.OrderItems.map((item, index) => (
                                        <div
                                          key={index}
                                          className="flex items-center justify-between p-2 bg-gray-50 rounded"
                                        >
                                          <div className="flex-1">
                                            <div className="font-medium">
                                              {item.Product?.name ||
                                                "Unknown Item"}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                              {formatCurrency(
                                                item.price ||
                                                  item.unit_price ||
                                                  item.Product?.price ||
                                                  0
                                              )}{" "}
                                              × {item.quantity}
                                            </div>
                                          </div>
                                          <div className="font-medium">
                                            {formatCurrency(
                                              (item.price ||
                                                item.unit_price ||
                                                item.Product?.price ||
                                                0) * item.quantity
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                              {/* Notes */}
                              {order.notes && (
                                <div>
                                  <div className="font-medium text-muted-foreground">
                                    Notes
                                  </div>
                                  <div className="text-sm bg-gray-50 p-2 rounded">
                                    {order.notes}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
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
              {/* Table Selection (for dine-in) - Show selected table info */}
              {orderType === "dine_in" && selectedTable && (
                <div className="p-4 border-b border-border">
                  <h3 className="font-semibold mb-3 flex items-center">
                    <TableIcon className="w-4 h-4 mr-2" />
                    Selected Table
                  </h3>

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
                        onClick={() => setCurrentView("tables")}
                      >
                        Change Table
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              <div className="p-4">
                <h3 className="font-semibold mb-3 flex items-center">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  {selectedOrder ? (
                    <>
                      <div className="flex items-center gap-2">
                        <div>
                          Editing Order #{selectedOrder.id} (
                          {cart.length + existingOrderItems.length} items)
                        </div>
                        <Badge
                          className="ml-2 bg-gray-200 text-gray-800"
                          variant="secondary"
                        >
                          EDITING
                        </Badge>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            if (!selectedOrder) return;
                            if (!confirm("Cancel this order?")) return;
                            cancelOrderMutation.mutate(selectedOrder.id);
                          }}
                          className="ml-2 bg-red-600 hover:bg-red-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                        >
                          {cancelOrderMutation.isPending ? (
                            <>
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                              Cancelling...
                            </>
                          ) : (
                            <>
                              <X className="w-3 h-3 mr-1" />
                              Cancel Order
                            </>
                          )}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>Order Items ({cart.length})</>
                  )}
                </h3>

                {/* Existing Order Items Section */}
                {existingOrderItems.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold mb-2 flex items-center text-gray-800">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Existing Items
                    </h4>
                    <div className="space-y-2">
                      {existingOrderItems.map((item, index) => (
                        <div
                          key={`existing-${index}`}
                          className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate text-gray-900">
                              {item.Product?.name || "Unknown Item"}
                            </div>
                            <div className="text-sm text-gray-600">
                              {formatCurrency(item.Product?.price || 0)} ×{" "}
                              {item.quantity}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-2">
                            <div className="font-medium text-gray-800">
                              {formatCurrency(
                                (item.Product?.price || 0) * item.quantity
                              )}
                            </div>
                            <Badge
                              variant="secondary"
                              className="bg-gray-200 text-gray-800"
                            >
                              Existing
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 p-2 bg-gray-100 rounded text-sm font-medium text-gray-800">
                      Existing Total:{" "}
                      {formatCurrency(
                        existingOrderItems.reduce(
                          (sum, item) =>
                            sum + (item.Product?.price || 0) * item.quantity,
                          0
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* New Items Section */}
                {cart.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold mb-2 flex items-center text-gray-800">
                      <Plus className="w-4 h-4 mr-2" />
                      New Items
                    </h4>
                    <div className="space-y-2">
                      {cart.map((item) => (
                        <div
                          key={item.Product.id}
                          className="flex items-center justify-between p-3 bg-white border border-gray-300 rounded-lg"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate text-gray-900">
                              {item.Product.name}
                            </div>
                            <div className="text-sm text-gray-600">
                              {formatCurrency(item.Product.price)} ×{" "}
                              {item.quantity}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-2">
                            <div className="font-medium text-gray-800">
                              {formatCurrency(
                                item.Product.price * item.quantity
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFromCart(item.Product.id)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-6 text-center text-sm">
                                {item.quantity}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => addToCart(item.Product)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* New Items Summary */}
                    {(() => {
                      const breakdown = getPaymentBreakdown();
                      return (
                        <div className="mt-2 p-3 bg-gray-100 rounded text-sm">
                          <div className="font-medium text-gray-800 mb-2">
                            New Items Summary:
                          </div>
                          <div className="space-y-1 text-xs">
                            {orderType === "dine_in" && (
                              <div className="flex justify-between">
                                <span>Subtotal:</span>
                                <span>
                                  {formatCurrency(breakdown.subtotal)}
                                </span>
                              </div>
                            )}
                            {orderType === "dine_in" && (
                              <div className="flex justify-between">
                                <span>Service Charge (10%):</span>
                                <span>
                                  {formatCurrency(breakdown.serviceCharge)}
                                </span>
                              </div>
                            )}
                            <div className="flex justify-between font-medium border-t pt-1">
                              <span>Total:</span>
                              <span>{formatCurrency(breakdown.total)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Empty state */}
                {cart.length === 0 && existingOrderItems.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No items in order</p>
                    <p className="text-sm">
                      {selectedOrder
                        ? "Add more items to this existing order"
                        : "Add items from the menu to get started"}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Order Summary and Actions */}
            {cart.length > 0 && (
              <div className="p-4 border-t border-border bg-card">
                <div className="space-y-4">
                  {/* Payment Breakdown */}
                  {(() => {
                    const newItemsBreakdown = getPaymentBreakdown();
                    const existingItemsTotal = existingOrderItems.reduce(
                      (sum, item) =>
                        sum + (item.Product?.price || 0) * item.quantity,
                      0
                    );
                    const existingServiceCharge =
                      orderType === "dine_in" ? existingItemsTotal * 0.1 : 0;
                    const combinedSubtotal =
                      newItemsBreakdown.subtotal + existingItemsTotal;
                    const combinedServiceCharge =
                      newItemsBreakdown.serviceCharge + existingServiceCharge;
                    const combinedTotal =
                      combinedSubtotal + combinedServiceCharge;

                    return (
                      <div className="space-y-2 text-sm">
                        {orderType === "dine_in" && (
                          <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span>{formatCurrency(combinedSubtotal)}</span>
                          </div>
                        )}
                        {orderType === "dine_in" && (
                          <div className="flex justify-between">
                            <span>Service Charge (10%):</span>
                            <span>{formatCurrency(combinedServiceCharge)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-lg font-semibold border-t pt-2">
                          <span>Total:</span>
                          <span>{formatCurrency(combinedTotal)}</span>
                        </div>
                      </div>
                    );
                  })()}

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
                        {selectedOrder
                          ? "Updating Order..."
                          : "Creating Order..."}
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        {selectedOrder ? (
                          <>Add Items to Existing Order</>
                        ) : (
                          <>
                            Create{" "}
                            {orderType === "dine_in"
                              ? "Dine-In"
                              : orderType === "take_away"
                                ? "Take Away"
                                : "Delivery"}{" "}
                            Order
                          </>
                        )}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Process Payment Button for Occupied Tables */}
            {selectedTable &&
              selectedTable.status === "occupied" &&
              getTableOrder(selectedTable.id) && (
                <div className="p-4 border-t border-border bg-card">
                  <Button
                    className="w-full"
                    size="lg"
                    variant="default"
                    onClick={() => {
                      const tableOrder = getTableOrder(selectedTable.id);
                      if (tableOrder) {
                        setSelectedOrder(tableOrder);
                        setPaymentAmount((tableOrder.price ?? 0).toString());
                        setActiveTab("payment");
                      }
                    }}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Process Payment
                  </Button>
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
                      <span>#{selectedOrder.id}</span>
                    </div>
                    {selectedOrder.customer_name && (
                      <div className="flex justify-between">
                        <span>Customer:</span>
                        <span>{selectedOrder.customer_name}</span>
                      </div>
                    )}

                    {/* Payment Breakdown */}
                    {(() => {
                      const breakdown = getOrderPaymentBreakdown(selectedOrder);
                      return (
                        <>
                          <div className="border-t pt-2 mt-2">
                            {selectedOrder.order_type === "dine_in" && (
                              <div className="flex justify-between">
                                <span>Subtotal:</span>
                                <span>
                                  {formatCurrency(breakdown.subtotal)}
                                </span>
                              </div>
                            )}
                            {selectedOrder.order_type === "dine_in" && (
                              <div className="flex justify-between">
                                <span>Service Charge (10%):</span>
                                <span>
                                  {formatCurrency(breakdown.serviceCharge)}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex justify-between font-semibold text-lg border-t pt-2">
                            <span>Total:</span>
                            <span>{formatCurrency(breakdown.total)}</span>
                          </div>
                        </>
                      );
                    })()}
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

                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    size="lg"
                    onClick={handleProcessPayment}
                    disabled={
                      !paymentAmount || processPaymentMutation.isPending
                    }
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

                  {selectedOrder && (
                    <Button
                      variant="destructive"
                      className="w-40"
                      size="lg"
                      onClick={() => {
                        if (!selectedOrder) return;
                        if (
                          !confirm(
                            "Are you sure you want to cancel this order?"
                          )
                        )
                          return;
                        cancelOrderMutation.mutate(selectedOrder.id);
                      }}
                      disabled={cancelOrderMutation.isPending}
                    >
                      {cancelOrderMutation.isPending ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Cancelling...
                        </>
                      ) : (
                        <>
                          <X className="w-4 h-4 mr-2" />
                          Cancel Order
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
