import { indexedDBManagerV2, Order } from './indexeddb-new';
import { offlineManager } from './offline-manager';
import { syncManagerV2 } from './sync-manager-v2';

/**
 * POS-grade payment service
 * Single source of truth = IndexedDB
 */
export class PaymentService {
  /**
   * PROCESS PAYMENT (ATOMIC + OFFLINE SAFE)
   */
  static async process(
    orderId: string,
    paymentMode: 'cash' | 'online'
  ): Promise<void> {

    // 🔒 Always read from IndexedDB (truth)
    const order = await indexedDBManagerV2.getOrder(orderId);

    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status !== 'ready') {
      throw new Error('Order must be ready to process payment');
    }

    if (order.payment_status === 'paid') {
      throw new Error('Order already paid');
    }

    // 🔒 ONLINE payment safety
    if (paymentMode === 'online') {
      if (!offlineManager.isOnline()) {
        throw new Error('Online payment not allowed while offline');
      }

      // If order not synced yet, queue create/update first
      if (!order.server_id) {
        await indexedDBManagerV2.addToSyncQueue({
          operation_type: 'create_order',
          order_id: order.id,
          data: order,
          status: 'pending',
          retry_count: 0,
          priority: 2
        });

        // Mark order as syncing (do NOT block payment)
        await indexedDBManagerV2.updateOrder(order.id, {
          sync_status: 'pending'
        });
      }
    }

    const now = new Date().toISOString();
    const date = now.split('T')[0];

    // 🧠 ATOMIC LOCAL TRANSACTION
    await indexedDBManagerV2.runTransaction(
      ['orders', 'sales_ledger', 'sync_queue'],
      'readwrite',
      async (tx) => {
        const orderStore = tx.objectStore('orders');
        const salesStore = tx.objectStore('sales_ledger');
        const syncStore = tx.objectStore('sync_queue');

        // 1️⃣ UPDATE ORDER (LOCAL)
        const updatedOrder: Order = {
          ...order,
          status: 'served',
          payment_status: 'paid',
          payment_mode: paymentMode,
          updated_at: now,
          version: order.version + 1
        };

        await req(orderStore.put(updatedOrder));

        // 2️⃣ SALES LEDGER (IDEMPOTENT)
        const existingSales = await req(
          salesStore.index('order_id').getAll(order.id)
        );

        if (!existingSales.some((s: any) => s.type === 'sale')) {
          await req(
            salesStore.put({
              id: crypto.randomUUID(),
              order_id: order.id,
              amount: order.total,
              payment_mode: paymentMode,
              date,
              type: 'sale',
              synced: false,
              created_at: now
            })
          );
        }

        // 3️⃣ QUEUE PAYMENT SYNC (ONCE)
        await req(
          syncStore.put({
            id: crypto.randomUUID(),
            operation_type: 'payment',
            order_id: order.id,
            data: {
              payment_mode: paymentMode,
              amount: order.total,
              version: updatedOrder.version
            },
            status: 'pending',
            retry_count: 0,
            priority: 1,
            created_at: now
          })
        );
      }
    );

    // 🚀 Trigger sync if online (outside tx)
    if (offlineManager.isOnline()) {
      syncManagerV2.startSync();
    }

    console.log(`✅ Payment processed safely for ${orderId}`);
  }

  /**
   * CHECK BEFORE SHOWING PAYMENT UI
   */
  static async canProcessPayment(orderId: string): Promise<{
    canPay: boolean;
    reason?: string;
  }> {
    const order = await indexedDBManagerV2.getOrder(orderId);

    if (!order) return { canPay: false, reason: 'Order not found' };
    if (order.status !== 'ready') return { canPay: false, reason: 'Order not ready' };
    if (order.payment_status === 'paid') return { canPay: false, reason: 'Already paid' };

    return { canPay: true };
  }

  /**
   * SALES RECONCILIATION (called by sync manager)
   */
  static async reconcileSalesDuringSync(): Promise<void> {
    const unsynced = await indexedDBManagerV2.getUnsyncedSales();

    for (const sale of unsynced) {
      await indexedDBManagerV2.runTransaction(
        ['sales_ledger'],
        'readwrite',
        async (tx) => {
          const store = tx.objectStore('sales_ledger');
          const existing = await req(store.get(sale.id));

          if (existing && !existing.synced) {
            await req(store.put({ ...existing, synced: true }));
          }
        }
      );
    }
  }
}

/* ---------------- UTIL ---------------- */

function req<T = any>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
