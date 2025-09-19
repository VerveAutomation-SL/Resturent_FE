import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { jwtDecode } from 'jwt-decode';
import type {
  APIResponse,
  PaginatedResponse,
  LoginRequest,
  LoginResponse,
  User,
  Product,
  Category,
  DiningTable,
  Order,
  Payment,
  CreateOrderRequest,
  UpdateOrderStatusRequest,
  ProcessPaymentRequest,
  PaymentSummary,
  DashboardStats,
  SalesReportItem,
  OrdersReportItem,
  Ingredient,
  InventoryIngredient,
  TableStatus,
  OrderFilters,
  ProductFilters,
  TableFilters,
  OrderStatus,
  TableStats,
  InventorySummary,
  Transaction,
  UpdateOrderRequest,
} from '@/types';
import Cookies from 'js-cookie';

class APIClient {
  private client: AxiosInstance;

  constructor() {
    const apiUrl = import.meta.env?.VITE_API_URL || 'http://localhost:3001/api';
    console.log('🔧 API Client baseURL:', apiUrl);
    console.log('🔧 Environment VITE_API_URL:', import.meta.env?.VITE_API_URL);
    
    this.client = axios.create({
      baseURL: apiUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = Cookies.get('pos_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle auth errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.clearAuth();
          // Redirect to login page
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Helper method to handle API responses
  private async request<T>(config: AxiosRequestConfig): Promise<T> {
    try {
      console.log(`➡️ ${config.method?.toUpperCase()} ${config.url}`, config);
      const response: AxiosResponse<T> = await this.client.request(config);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || error.message);
      }
      throw error;
    }
  }

  // Authentication endpoints
  async login(credentials: LoginRequest): Promise<APIResponse<LoginResponse>> {
    return this.request({
      method: 'POST',
      url: '/users/login',
      data: credentials,
    });
  }

  async logout(): Promise<APIResponse> {
    return this.request({
      method: 'POST',
      url: '/auth/logout',
    });
  }

  async getCurrentUser(): Promise<APIResponse<User>> {
    return this.request({
      method: 'GET',
      url: '/auth/me',
    });
  }

  // Product endpoints
  async getProducts(filters?: ProductFilters): Promise<APIResponse<{pagination: any; products: Product[]}>> {
    return this.request({
      method: 'GET',
      url: '/products',
      params: filters,
    });
  }

  async getProduct(id: string): Promise<APIResponse<Product>> {
    return this.request({
      method: 'GET',
      url: `/products/${id}`,
    });
  }

  async getProductsByCategory(categoryId: string): Promise<APIResponse<{pagination: any; products: Product[]}>> {
    return this.request({
      method: 'GET',
      url: `/categories/${categoryId}/products`,
    });
  }

  // Table endpoints
  async getTables(filters?: TableFilters): Promise<APIResponse<TableStats>> {
    return this.request({
      method: 'GET',
      url: '/tables/stats/overview',
      params: filters,
    });
  }

  async getTable(id: string): Promise<APIResponse<DiningTable>> {
    return this.request({
      method: 'GET',
      url: `/tables/${id}`,
    });
  }

  async getTablesByLocation(): Promise<APIResponse<any[]>> {
    return this.request({
      method: 'GET',
      url: '/tables/by-location',
    });
  }

  async getTableStatus(): Promise<APIResponse<TableStatus>> {
    return this.request({
      method: 'GET',
      url: '/tables/status',
    });
  }

  // Order endpoints
  async getOrders(filters?: OrderFilters): Promise<PaginatedResponse<Order[]>> {
    return this.request({
      method: 'GET',
      url: '/orders',
      params: filters,
    });
  }

  async createOrder(order: CreateOrderRequest): Promise<APIResponse<Order>> {
    return this.request({
      method: 'POST',
      url: '/orders',
      data: order,
    });
  }

  async getOrder(id: string): Promise<APIResponse<Order>> {
    return this.request({
      method: 'GET',
      url: `/orders/${id}`,
    });
  }

  async updateOrderStatus(id: string, status: OrderStatus, notes?: string): Promise<APIResponse<Order>> {
    const statusUpdate: UpdateOrderStatusRequest = { status, notes };
    return this.request({
      method: 'PUT',
      url: `/orders/${id}/status`,
      data: statusUpdate,
    });
  }

  // Payment endpoints
  async processPayment(orderId: string, payment: ProcessPaymentRequest): Promise<APIResponse<Payment>> {
    return this.request({
      method: 'POST',
      url: `/orders/${orderId}/payments`,
      data: payment,
    });
  }

  async getPayments(orderId: string): Promise<APIResponse<Payment[]>> {
    return this.request({
      method: 'GET',
      url: `/orders/${orderId}/payments`,
    });
  }

  async getPaymentSummary(orderId: string): Promise<APIResponse<PaymentSummary>> {
    return this.request({
      method: 'GET',
      url: `/orders/${orderId}/payment-summary`,
    });
  }

  // Dashboard endpoints
  async getDashboardStats(): Promise<APIResponse<DashboardStats>> {
    return this.request({
      method: 'GET',
      url: '/admin/dashboard/stats',
    });
  }

  async getSalesReport(period: 'today' | 'week' | 'month' = 'today'): Promise<APIResponse<SalesReportItem[]>> {
    return this.request({
      method: 'GET',
      url: '/admin/reports/sales',
      params: { period },
    });
  }

  async getOrdersReport(): Promise<APIResponse<OrdersReportItem[]>> {
    return this.request({
      method: 'GET',
      url: '/admin/reports/orders',
    });
  }

  async getIncomeReport(period: 'today' | 'week' | 'month' | 'year' = 'today'): Promise<APIResponse<any>> {
    return this.request({
      method: 'GET',
      url: '/admin/dashboard/income-report',
      params: { period },
    });
  }

  // Kitchen endpoints
  async getKitchenOrders(status?: string): Promise<APIResponse<Order[]>> {
    return this.request({
      method: 'GET',
      url: '/kitchen/orders',
      params: status && status !== 'all' ? { status } : {},
    });
  }

  async updateOrderItemStatus(orderId: string, itemId: string, status: string): Promise<APIResponse> {
    return this.request({
      method: 'PATCH',
      url: `/kitchen/orders/${orderId}/items/${itemId}/status`,
      data: { status },
    });
  }

  // Role-specific order creation
  async createServerOrder(order: CreateOrderRequest): Promise<APIResponse<Order>> {
    return this.request({
      method: 'POST',
      url: '/server/orders',
      data: order,
    });
  }

  async createCounterOrder(order: CreateOrderRequest): Promise<APIResponse<Order>> {
    return this.request({
      method: 'POST',
      url: '/orders',
      data: order,
    });
  }
  async updateCounterOrder(order: UpdateOrderRequest): Promise<APIResponse<Order>> {
    return this.request({
      method: 'PATCH',
      url: `/orders/${order.order_id}`,
      data: order,
    });
  }

  // Counter payment processing
  async processCounterPayment(orderId: string, payment: ProcessPaymentRequest): Promise<APIResponse<Payment>> {
    return this.request({
      method: 'POST',
      url: `/payments/orders/${orderId}/pay`,
      data: payment,
    });
  }

  // User management endpoints (Admin only)
  async getUsers(): Promise<APIResponse<User[]>> {
    return this.request({
      method: 'GET',
      url: '/users',
    });
  }

  async createUser(userData: any): Promise<APIResponse<User>> {
    return this.request({
      method: 'POST',
      url: '/users',
      data: userData,
    });
  }

  async updateUser(id: string, userData: any): Promise<APIResponse<User>> {
    return this.request({
      method: 'PUT',
      url: `/users/${id}`,
      data: userData,
    });
  }

  async deleteUser(id: string): Promise<APIResponse> {
    return this.request({
      method: 'DELETE',
      url: `/users/${id}`,
    });
  }

  // Admin-specific product management
  async createProduct(productData: any): Promise<APIResponse<Product>> {
    return this.request({ method: 'POST', url: '/products', data: productData });
  }

  async updateProduct(id: string, productData: any): Promise<APIResponse<Product>> {
    return this.request({ method: 'PUT', url: `/products/${id}`, data: productData });
  }

  async deleteProduct(id: string): Promise<APIResponse> {
    return this.request({ method: 'DELETE', url: `/products/${id}` });
  }

  // Ingredients
  async getIngredients(): Promise<APIResponse<{pagination: any; ingredients: InventoryIngredient[] }>> {
    return this.request({ method: 'GET', url: '/ingredients' });
  }

  async getIngredientStats(): Promise<APIResponse<InventorySummary>> {
    return this.request({ method: 'GET', url: '/ingredients/stats' });
  }

  async getLowStockIngredients(): Promise<APIResponse<InventoryIngredient[]>> {
    return this.request({ method: 'GET', url: '/ingredients/low-stock' });
  }

  async getLowStock(): Promise<APIResponse<InventoryIngredient[]>> {
    return this.request({ method: 'GET', url: '/low-stock' });
  }
  async getOutOfStockIngredients(): Promise<APIResponse<Ingredient[]>> {
    return this.request({ method: 'GET', url: '/ingredients/out-of-stock' });
  }

  async getInStockIngredients(): Promise<APIResponse<Ingredient[]>> {
    return this.request({ method: 'GET', url: '/ingredients/in-stock' });
  }

  async getIngredientById(id: number): Promise<APIResponse<Ingredient>> {
    return this.request({ method: 'GET', url: `/ingredients/${id}` });
  }

  async createIngredient(data: any): Promise<APIResponse<Ingredient>> {
    return this.request({ method: 'POST', url: '/ingredients', data });
  }

  async updateIngredient(id: number, data: any): Promise<APIResponse<Ingredient>> {
    return this.request({ method: 'PUT', url: `/ingredients/${id}`, data });
  }

  async deleteIngredient(id: number): Promise<APIResponse> {
    return this.request({ method: 'DELETE', url: `/ingredients/${id}` });
  }

  // Stock Management
  async updateStock(id: number, amount: number, notes: string): Promise<APIResponse> {
    return this.request({ method: 'POST', url: `/ingredients/stock/update/${id}`, data: { amount, notes } });
  }

  async addStock(id: number, amount: number, notes: string): Promise<APIResponse> {
    return this.request({ method: 'POST', url: `/ingredients/stock/add/${id}`, data: { amount, notes } });
  }

  async subtractStock(id: number, amount: number, notes: string): Promise<APIResponse> {
    return this.request({ method: 'POST', url: `/ingredients/stock/subtract/${id}`, data: { amount, notes } });
  }

  async bulkUpdateStock(updates: any[]): Promise<APIResponse> {
    return this.request({ method: 'POST', url: '/ingredients/stock/bulk-update', data: { updates } });
  }

  // Inventory Management
  async getInventoryTransactions(): Promise<APIResponse<{pagination: any; transactions: Transaction[] }>> {
    return this.request({ method: 'GET', url: '/ingredients/inventory/transactions' });
  }

  async getStockAlerts(): Promise<APIResponse<any[]>> {
    return this.request({ method: 'GET', url: '/ingredients/inventory/alerts' });
  }

  async getStockAlertStatistics(): Promise<APIResponse<any>> {
    return this.request({ method: 'GET', url: '/ingredients/inventory/alerts/stats' });
  }

  // Stock transactions
  async getStockTransactions(): Promise<APIResponse<any[]>> {
    return this.request({ method: 'GET', url: '/stock/transactions' });
  }

  async createStockTransaction(transaction: any): Promise<APIResponse<any>> {
    return this.request({ method: 'POST', url: '/stock/transactions', data: transaction });
  }

  // Purchase orders  
  async getPurchaseOrders(): Promise<APIResponse<any[]>> {
    return this.request({ method: 'GET', url: '/purchase-orders' });
  }

  async acknowledgeStockAlert(id: number): Promise<APIResponse> {
    return this.request({ method: 'PUT', url: `/ingredients/inventory/alerts/${id}/acknowledge` });
  }

  async resolveStockAlert(id: number): Promise<APIResponse> {
    return this.request({ method: 'PUT', url: `/ingredients/inventory/alerts/${id}/resolve` });
  }

  async getInventoryReport(type?: string): Promise<APIResponse<any>> {
    const url = type ? `/ingredients/inventory/report?type=${type}` : '/ingredients/inventory/report';
    return this.request({ method: 'GET', url });
  }

  // Order Related Operations
  async deductIngredientsForOrder(orderId: number, ingredients: any[]): Promise<APIResponse> {
    return this.request({ method: 'POST', url: '/ingredients/deduct-for-order', data: { orderId, ingredients } });
  }

  async reserveIngredients(ingredients: any[]): Promise<APIResponse> {
    return this.request({ method: 'POST', url: '/ingredients/reserve', data: { ingredients } });
  }

  async unreserveIngredients(ingredients: any[]): Promise<APIResponse> {
    return this.request({ method: 'POST', url: '/ingredients/unreserve', data: { ingredients } });
  }

  // Purchase Orders
  async createPurchaseOrder(data: any): Promise<APIResponse> {
    return this.request({ method: 'POST', url: '/ingredients/purchase-orders', data });
  }

  async receivePurchaseOrderItem(itemId: number, data: any): Promise<APIResponse> {
    return this.request({ method: 'POST', url: `/ingredients/purchase-orders/items/${itemId}/receive`, data });
  }

  async getPurchaseOrdersForIngredient(id: number): Promise<APIResponse<any[]>> {
    return this.request({ method: 'GET', url: `/ingredients/${id}/purchase-orders` });
  }

  // Upload image to backend (matches your upload route)
  async uploadImage(file: File): Promise<APIResponse<any>> {
    const formData = new FormData();
    formData.append('image', file); // Field name matches your multer config

    try {
      console.log(`➡️ POST /upload/image`, { fileName: file.name, fileSize: file.size });
      const response = await this.client.post('/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        // Optional: Add upload progress tracking
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log(`📤 Upload progress: ${percentCompleted}%`);
          }
        },
      });
      console.log('Upload response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Upload error:', error);
      if (axios.isAxiosError(error)) {
        console.error('Error response:', error.response?.data);
        console.error('Error status:', error.response?.status);
        throw new Error(error.response?.data?.message || `Upload failed: ${error.response?.status} ${error.response?.statusText}` || error.message);
      }
      throw error;
    }
  }

  // Admin-specific category management  
  async createCategory(categoryData: any): Promise<APIResponse<Category>> {
    return this.request({ method: 'POST', url: '/categories', data: categoryData });
  }

  async updateCategory(id: string, categoryData: any): Promise<APIResponse<Category>> {
    return this.request({ method: 'PUT', url: `/categories/${id}`, data: categoryData });
  }

  async deleteCategory(id: string): Promise<APIResponse> {
    return this.request({ method: 'DELETE', url: `/categories/${id}` });
  }

  // products endpoint with pagination
  async getAdminProducts(params?: { page?: number, per_page?: number, limit?: number, search?: string, category_id?: string }): Promise<APIResponse<Product[]>> {
    // Normalize params (handle both per_page and limit)
    const normalizedParams = {
      page: params?.page,
      per_page: params?.per_page || params?.limit,
      search: params?.search,
      category_id: params?.category_id
    }
    
    return this.request({ 
      method: 'GET', 
      url: '/products',
      params: normalizedParams
    });
  }

  // Admin categories endpoint with pagination
  async getCategories(params?: { page?: number, per_page?: number, limit?: number, search?: string, active_only?: boolean }): Promise<APIResponse<Category[]>> {
    // Normalize params (handle both per_page and limit)
    const normalizedParams = {
      page: params?.page,
      per_page: params?.per_page || params?.limit,
      search: params?.search,
    }
    
    return this.request({ 
      method: 'GET', 
      url: '/categories',
      params: normalizedParams
    });
  }

  // Admin tables endpoint with pagination
  async getAdminTables(params?: { page?: number, limit?: number, search?: string, status?: string }): Promise<APIResponse<{pagination: any; tables: DiningTable[]}>> {
    return this.request({ 
      method: 'GET', 
      url: '/tables',
      params 
    });
  }

  // Admin-specific table management
  async createTable(tableData: any): Promise<APIResponse<DiningTable>> {
    return this.request({ method: 'POST', url: '/tables', data: tableData });
  }

  async updateTable(id: string, tableData: any): Promise<APIResponse<DiningTable>> {
    return this.request({ method: 'PUT', url: `/tables/${id}`, data: tableData });
  }

  async deleteTable(id: string): Promise<APIResponse> {
    return this.request({ method: 'DELETE', url: `/tables/${id}` });
  }

  // Utility methods
  setAuthToken(accessToken: string): void {
    console.log("Auth token set with JWT, redirecting to home...");
    Cookies.set('pos_token', accessToken);
  }

  clearAuth(): void {
    Cookies.remove('pos_token');
  }

  getAuthToken(): string | null {
    const token = Cookies.get('pos_token');
    return token === undefined ? null : token;
  }

  isAuthenticated(): User & { exp: number; iat: number } | null {
    const token = this.getAuthToken();
    
    if (!token) {
      console.log("Token missing, clearing auth");
      this.clearAuth();
      return null;
    }
    
    try {
      // Decode the JWT token to check expiry
      const decodedToken = jwtDecode<User & { exp: number; iat: number }>(token);
      const expiryTime = decodedToken.exp * 1000; // Convert from seconds to milliseconds
      const currentTime = new Date().getTime();
      
      if (currentTime >= expiryTime) {
        console.log("Token expired (from JWT), clearing auth");
        this.clearAuth();
        return null;
      }

      return decodedToken;
    } catch (error) {
      console.error('Failed to decode JWT token:', error);
      this.clearAuth();
      return null;
    }
  }
}

// Create and export a singleton instance
export const apiClient = new APIClient();
export default apiClient;

