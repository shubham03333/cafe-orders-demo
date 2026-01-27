import { indexedDBManagerV2, Order } from './indexeddb-new';
import { IdGenerator } from './id-generator';
import { offlineManager } from './offline-manager';

// Business logic for order operations
export class OrderService {
  /**
   * Create a new order atomically
   */
  static async create(orderData: {
    items: any[];
    total: number;
    order_type: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
    table_id?: string;
    table_code?: string;
    table_name?: string;
  }): Promise<string> {
    const orderId = IdGenerator.uuid();

    const order: Order = {
      id: orderId,
      status: 'pending',
      payment_status: 'pending',
      items: orderData.items,
      total: orderData.total,
      order_type: orderData.order_type,
      table_id: orderData.table_id,
      table_code: orderData.table_code,
      table_name: orderData.table_name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sync_status: 'pending',
      sync_attempts: 0,
      version: 1,
      source: 'offline'
    };

    await indexedDBManagerV2.saveOrder(order);

    // Trigger sync if online
    if (offlineManager.isOnline()) {
      // Import sync manager dynamically to avoid circular imports
      import('./sync-manager-v2').then(({ syncManagerV2 }) => {
        syncManagerV2.startSync();
      });
    }

    console.log(`Order created: ${orderId}`);
    return orderId;
  }

  /**
   * Update order status atomically
   */
  static async updateStatus(orderId: string, newStatus: Order['status']): Promise<void> {
    await indexedDBManagerV2.updateOrder(orderId, { status: newStatus });

    // Trigger sync if online
    if (offlineManager.isOnline()) {
      import('./sync-manager-v2').then(({ syncManagerV2 }) => {
        syncManagerV2.startSync();
      });
    }

    console.log(`Order ${orderId} status updated to: ${newStatus}`);
  }

  /**
   * Edit order items atomically
   */
  static async edit(orderId: string, updates: { items: any[]; total: number }): Promise<void> {
    await indexedDBManagerV2.updateOrder(orderId, updates);

    // Trigger sync if online
    if (offlineManager.isOnline()) {
      import('./sync-manager-v2').then(({ syncManagerV2 }) => {
        syncManagerV2.startSync();
      });
    }

    console.log(`Order ${orderId} edited`);
  }

  /**
   * Delete order atomically
   */
  static async delete(orderId: string): Promise<void> {
    await indexedDBManagerV2.deleteOrder(orderId);

    // Trigger sync if online
    if (offlineManager.isOnline()) {
      import('./sync-manager-v2').then(({ syncManagerV2 }) => {
        syncManagerV2.startSync();
      });
    }

    console.log(`Order ${orderId} deleted`);
  }

  /**
   * Get order by ID
   */
  static async getById(orderId: string): Promise<Order | null> {
    return indexedDBManagerV2.getOrder(orderId);
  }

  /**
   * Get all orders
   */
  static async getAll(): Promise<Order[]> {
    return indexedDBManagerV2.getAllOrders();
  }

  /**
   * Get orders by status
   */
  static async getByStatus(status: Order['status']): Promise<Order[]> {
    return indexedDBManagerV2.getOrdersByStatus(status);
  }

  /**
   * Get pending orders (for display)
   */
  static async getPendingOrders(): Promise<Order[]> {
    const orders = await indexedDBManagerV2.getAllOrders();
    return orders
      .filter(order => order.status !== 'served')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  /**
   * Get served orders (for history)
   */
  static async getServedOrders(limit: number = 10): Promise<Order[]> {
    const orders = await indexedDBManagerV2.getAllOrders();
    return orders
      .filter(order => order.status === 'served')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  }

  /**
   * Validate order data
   */
  static validateOrderData(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      errors.push('Order must have at least one item');
    }

    if (!data.total || typeof data.total !== 'number' || data.total <= 0) {
      errors.push('Order total must be a positive number');
    }

    if (!data.order_type || !['DINE_IN', 'TAKEAWAY', 'DELIVERY'].includes(data.order_type)) {
      errors.push('Invalid order type');
    }

    // Validate items
    if (data.items) {
      data.items.forEach((item: any, index: number) => {
        if (!item.id || !item.name || !item.price || !item.quantity) {
          errors.push(`Item ${index + 1} is missing required fields`);
        }
        if (item.quantity <= 0) {
          errors.push(`Item ${index + 1} quantity must be positive`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Calculate order total from items
   */
  static calculateTotal(items: any[]): number {
    return items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  }
}
