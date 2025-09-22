// API Response Types
export interface APIResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  meta: MetaData;
}

export interface MetaData {
  current_page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

// User Types
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'manager' | 'counter';
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
    accessToken: string;
    user: User;
}

// Category Types
export interface Category {
  id: string;
  name: string;
  image_url: string;
  description?: string;
  color?: string;
  created_at: string;
  updated_at: string;
}

// Product Types
export interface Product {
  id: string;
  category_id?: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  barcode?: string;
  sku?: string;
  is_available: boolean;
  preparation_time?: number;
  sort_order?: number;
  created_at: string;
  updated_at: string;
  category?: Category;
  ingredients?: ProductIngredient[];
}

export interface Ingredient {
  id: string;
  name: string;
  unit?: string;
  created_at?: string;
  updated_at?: string;
}

export interface InventoryIngredient {
  id: number;
  name: string;
  unit: string;
  quantity: number;
  reserved_quantity: number;
  low_stock_threshold: number;
  cost_per_unit: number;
  supplier: string;
  supplier_contact: string;
  last_restocked_at?: string | null;
  auto_reorder: boolean;
  reorder_quantity: number;
  created_at: string;
  updated_at: string;
}

// Inventory transaction record returned by API
export interface Transaction {
  id?: number;
  ingredient_id: number;
  Ingredient?: {
    id?: number;
    name?: string;
    unit?: string;
  };
  User: { id?: number; name?: string };
  approved_at?: string | null;
  approved_by?: string | null;
  created_at: string;
  updated_at?: string;
  previous_quantity?: string;
  new_quantity?: string;
  quantity?: string;
  notes?: string;
  performed_by?: number | string | null;
  reference_type?: string;
  status?: string;
  total_cost?: number | null;
  transaction_date?: string;
  transaction_type?: string;
}

export interface InventorySummary {
  total: number;
  lowStock: number;
  outOfStock: number;
  inStock: number;
  totalValue: number;
}

export interface ProductIngredient {
  ingredient_id: string;
  quantity_required: number;
  ingredient?: Ingredient;
}

// Table Types
export interface DiningTable {
  id: string;
  table_number: string;
  capacity: number;
  location?: string;
  status: 'available' | 'occupied';
  created_at: string;
  updated_at: string;
}

// Summary statistics for tables (total/available/occupied and occupancy rate as a formatted string)
export interface TableStats {
  total: number;
  available: number;
  occupied: number;
  occupancyRate: string; // e.g. "75%"
}

// Pagination shape returned by admin tables endpoint - support common key variants
export interface TablesPagination {
  // camelCase
  currentPage?: number;
  perPage?: number;
  totalPages?: number;
  // snake_case (some endpoints use this)
  current_page?: number;
  per_page?: number;
  total_pages?: number;
  // other common variants
  total?: number;
  totalTables?: number;
  [key: string]: any;
}

// Response from admin tables endpoint
export interface AdminTablesResponse {
  tables: DiningTable[];
  pagination: TablesPagination;
}

// Order Types
export interface Order {
  id: string;
  table_id?: string;
  waiter_id?: string;
  customer_name?: string;
  order_type: 'dine_in' | 'takeout' | 'delivery';
  status: 'confirmed' | 'preparing' | 'served' | 'completed' | 'cancelled';
  subtotal?: number;
  service_charge?: number;
  discount_amount?: number;
  price?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  served_at?: string;
  completed_at?: string;
  RestaurantTable?: DiningTable;
  user?: User;
  OrderItems?: OrderItem[];
  payments?: Payment[];
}
export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  READY = 'ready',
  SERVED = 'served',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}
export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price?: number;
  price?: number;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
  Product?: Product;
  notes?: string; // Alternative field name for special instructions
}

export interface CreateOrderRequest {
  table_id?: string;
  order_type: 'dine_in' | 'take_away' | 'delivery';
  items: CreateOrderItem[];
  notes?: string;
}

export interface UpdateOrderRequest {
  order_id: string;
  items?: CreateOrderItem[];
  notes?: string;
}
export interface CreateOrderItem {
  product_id: string;
  quantity: number;
}

export interface UpdateOrderStatusRequest {
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';
  notes?: string;
}

// Payment Types
export interface Payment {
  id: string;
  order_id: string;
  invoice_id: string;
  payment_method: 'cash' | 'card' | 'others';
  amount: number;
  reference_number?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  processed_by?: string;
  processed_at?: string;
  created_at: string;
  failure_reason?: string;
  note?: string;
  processed_by_user?: User;
}

export interface ProcessPaymentRequest {
  payment_method: 'cash' | 'card' | 'others';
  amount: number;
  reference_number?: string;
}

export interface PaymentSummary {
  order_id: string;
  total_amount: number;
  total_paid: number;
  pending_amount: number;
  remaining_amount: number;
  is_fully_paid: boolean;
  payment_count: number;
}

export interface CartItem {
  Product: Product;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  service_charge: number;
  total_amount: number;
}

// Dashboard Types
export interface DashboardStats {
  activeOrders: number;
  detailed: any;
  occupiedTables: number;
  todaysOrders: {
    comparisonText: string;
    count: number;
    percentageChange: number;
  }
  todaysRevenue: {
    comparisonText: string;
    amount: number;
    percentageChange: number;
    formattedAmount: string;
  }
}

export interface SalesReportItem {
  date: string;
  order_count: number;
  revenue: number;
}

export interface OrdersReportItem {
  status: string;
  count: number;
  avg_amount: number;
}

// Kitchen Types
export interface KitchenOrder {
  id: string;
  order_number: string;
  table_id?: string;
  table_number?: string;
  order_type: string;
  status: string;
  customer_name?: string;
  created_at: string;
  items?: OrderItem[];
}

// Table Status Types
export interface TableStatus {
  total_tables: number;
  occupied_tables: number;
  available_tables: number;
  occupancy_rate: number;
  by_location: LocationStats[];
}

export interface LocationStats {
  location: string;
  total_tables: number;
  occupied_tables: number;
  available_tables: number;
  occupancy_rate: number;
}

// Filter and Query Types
export interface OrderFilters {
  status?: string;
  order_type?: string;
  page?: number;
  per_page?: number;
}

export interface ProductFilters {
  category_id?: string;
  available?: boolean;
  search?: string;
  page?: number;
  per_page?: number;
}

export interface TableFilters {
  location?: string;
  occupied_only?: boolean;
  available_only?: boolean;
}

