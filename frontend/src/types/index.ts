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
  role: 'admin' | 'manager' | 'counter' | 'kitchen';
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

// Order Types
export interface Order {
  id: string;
  order_number?: string;
  table_id?: string;
  waiter_id?: string;
  customer_name?: string;
  order_type: 'dine_in' | 'takeout' | 'delivery';
  status: 'confirmed' | 'preparing' | 'served' | 'completed' | 'cancelled';
  subtotal?: number;
  tax_amount?: number;
  discount_amount?: number;
  price?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  served_at?: string;
  completed_at?: string;
  table?: DiningTable;
  user?: User;
  items?: OrderItem[];
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
  product?: Product;
  notes?: string; // Alternative field name for special instructions
}

export interface CreateOrderRequest {
  table_id?: string;
  customer_name?: string;
  order_type: 'dine_in' | 'takeout' | 'delivery';
  items: CreateOrderItem[];
  notes?: string;
}

export interface CreateOrderItem {
  product_id: string;
  quantity: number;
  special_instructions?: string;
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

// Cart Types (Frontend Only)
export interface CartItem {
  product: Product;
  quantity: number;
  special_instructions?: string;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  tax_amount: number;
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

