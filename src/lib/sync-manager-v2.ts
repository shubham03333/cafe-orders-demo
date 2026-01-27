import { indexedDBManagerV2, SyncQueueItem, Order } from './indexeddb-new';
import { offlineManager } from './offline-manager';

class SyncManagerV2 {
  private isOnline = offlineManager.isOnline();
  private syncInProgress = false;

  constructor() {
    offlineManager.subscribe((online) => {
      this.isOnline = online;
      if (online) this.startSync();
    });
  }

  /* =========================
     PUBLIC
  ========================= */

  async startSync(): Promise<void> {
    if (!this.isOnline || this.syncInProgress) return;

    this.syncInProgress = true;
    try {
      await this.reconcileWithServer();
      await this.processSyncQueue();
      await this.reconcileSalesData();
    } finally {
      this.syncInProgress = false;
    }
  }

  /* =========================
     SYNC QUEUE
  ========================= */

  private async processSyncQueue(): Promise<void> {
    const items = await indexedDBManagerV2.getPendingSyncItems();

    for (const item of items) {
      if (!this.isOnline) break;

      try {
        await indexedDBManagerV2.updateSyncQueueItem(item.id, {
          status: 'processing'
        });

        const result = await this.executeOperation(item);
        await this.applyServerResult(item, result);

        await indexedDBManagerV2.removeFromSyncQueue(item.id);
      } catch (err: any) {
        await this.handleSyncFailure(item, err);
      }
    }
  }

  private async executeOperation(item: SyncQueueItem): Promise<any> {
    switch (item.operation_type) {
      case 'create_order':
        return this.syncCreateOrder(item);

      case 'payment':
        return this.syncPayment(item);

      default:
        throw new Error(`Unsupported operation ${item.operation_type}`);
    }
  }

  /* =========================
     ORDER SYNC (UPSERT)
  ========================= */

  private async syncCreateOrder(item: SyncQueueItem) {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';

    const res = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...item.data,
        local_id: item.order_id
      })
    });

    if (!res.ok) throw new Error('Order sync failed');

    return res.json();
  }

  /* =========================
     PAYMENT SYNC (SAFE)
  ========================= */

  private async syncPayment(item: SyncQueueItem) {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';

    const order = await indexedDBManagerV2.getOrder(item.order_id);
    if (!order?.server_id) {
      throw new Error('Order not yet synced to server');
    }

    const res = await fetch(
      `${baseUrl}/api/orders/${order.server_id}/payment`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_mode: item.data.payment_mode,
          amount: item.data.amount
        })
      }
    );

    if (!res.ok) throw new Error('Payment sync failed');

    return res.json();
  }

  /* =========================
     APPLY SERVER RESULT
  ========================= */

  private async applyServerResult(item: SyncQueueItem, result: any) {
    if (item.operation_type === 'create_order') {
      await indexedDBManagerV2.updateOrder(item.order_id, {
        server_id: result.id,
        order_number: result.order_number,
        sync_status: 'synced'
      });
    }

    if (item.operation_type === 'payment') {
      // IMPORTANT: do NOT change status/payment locally
      await indexedDBManagerV2.updateOrder(item.order_id, {
        sync_status: 'synced'
      });
    }
  }

  /* =========================
     FAILURE HANDLING
  ========================= */

  private async handleSyncFailure(item: SyncQueueItem, err: Error) {
    const retries = item.retry_count + 1;

    if (retries >= 5) {
      await indexedDBManagerV2.updateSyncQueueItem(item.id, {
        status: 'failed',
        error_message: err.message
      });
      return;
    }

    await indexedDBManagerV2.updateSyncQueueItem(item.id, {
      status: 'pending',
      retry_count: retries
    });
  }

  /* =========================
     SERVER → LOCAL RECONCILE
  ========================= */

  private async reconcileWithServer(): Promise<void> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';

    const res = await fetch(`${baseUrl}/api/orders?loadAll=true`);
    if (!res.ok) return;

    const data = await res.json();

    for (const serverOrder of data.orders ?? []) {
      if (!serverOrder.local_id) continue;

      const local = await indexedDBManagerV2.getOrder(serverOrder.local_id);

      if (!local) {
        const newLocal: Order = {
          ...serverOrder,
          id: serverOrder.local_id,
          server_id: serverOrder.id,
          sync_status: 'synced',
          source: 'online',
          version: 1
        };

        await indexedDBManagerV2.saveOrder(newLocal);
      }
    }
  }

  /* =========================
     SALES RECONCILE
  ========================= */

  private async reconcileSalesData() {
    const { PaymentService } = await import('./payment-service');
    await PaymentService.reconcileSalesDuringSync();
  }
}

export const syncManagerV2 = new SyncManagerV2();
