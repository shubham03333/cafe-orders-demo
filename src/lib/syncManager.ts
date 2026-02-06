import { indexedDBManager } from './indexeddb';
import { LocalOrder, SyncQueueItem, SyncResponse } from '@/types';

class SyncManager {
  private isOnline = true;
  private syncInProgress = false;

  constructor() {
    // 🚨 SSR guard - return early if window is not available
    if (typeof window === 'undefined') return;

    this.isOnline = navigator.onLine;

    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('Connection restored, starting sync...');
      this.startSync();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('Connection lost');
    });

    // Initial sync check
    if (this.isOnline) {
      this.startSync();
    }
  }

  async startSync(): Promise<void> {
    // 🚨 SSR guard
    if (typeof window === 'undefined') return;

    if (this.syncInProgress || !this.isOnline) return;

    this.syncInProgress = true;
    console.log('Starting background sync...');

    try {
      await this.processSyncQueue();
      // Notify UI so it can refresh orders and daily sales
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('syncComplete'));
      }
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  private async processSyncQueue(): Promise<void> {
    // Process until queue is empty (new items may be added e.g. order_update after order_create)
    let syncItems = await indexedDBManager.getSyncQueue();
    while (syncItems.length > 0) {
      for (const item of syncItems) {
        try {
          await this.processSyncItem(item);
        } catch (error) {
          console.error(`Failed to sync item ${item.id}:`, error);
          await indexedDBManager.updateSyncQueueItem(item.id, {
            retry_count: item.retry_count + 1,
            last_attempt: new Date().toISOString(),
            error_message: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
      syncItems = await indexedDBManager.getSyncQueue();
    }
  }

  private async processSyncItem(item: SyncQueueItem): Promise<void> {
    let response: Response;

    switch (item.type) {
      case 'order_create':
        response = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.data)
        });
        break;

      case 'order_update': {
        let serverOrderId = item.data.server_order_id;
        if (!serverOrderId) {
          const localOrder = await indexedDBManager.getLocalOrder(item.local_order_id);
          serverOrderId = localOrder?.server_order_id;
        }
        if (!serverOrderId) {
          throw new Error('Cannot sync order_update: server_order_id not yet available (order may need to sync first)');
        }
        response = await fetch(`/api/orders/${serverOrderId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.data.updates)
        });
        break;
      }

      case 'order_delete': {
        let serverOrderId = item.data.server_order_id;
        if (!serverOrderId) {
          const localOrder = await indexedDBManager.getLocalOrder(item.local_order_id);
          serverOrderId = localOrder?.server_order_id;
        }
        if (!serverOrderId) {
          // Order was never synced; just remove from queue and delete local
          await indexedDBManager.removeFromSyncQueue(item.id);
          await indexedDBManager.deleteLocalOrder(item.local_order_id);
          return;
        }
        response = await fetch(`/api/orders/${serverOrderId}`, {
          method: 'DELETE'
        });
        break;
      }

      default:
        throw new Error(`Unknown sync type: ${item.type}`);
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Sync failed: ${response.status} ${errorData.message || ''}`);
    }

    const result = await response.json();

    // Update local order with server data (or remove for delete)
    if (item.type === 'order_create' && result.id) {
      await indexedDBManager.updateLocalOrder(item.local_order_id, {
        server_order_id: result.id,
        order_number: result.order_number,
        sync_status: 'synced',
        updated_at: new Date().toISOString()
      });
      // If this order was already marked served locally, queue an update so server gets status and daily_sales updates
      const localOrder = await indexedDBManager.getLocalOrder(item.local_order_id);
      if (localOrder?.status === 'served') {
        await this.addOrderUpdateToSyncQueue(item.local_order_id, result.id, {
          status: 'served',
          payment_status: localOrder.payment_status || 'pending',
          items: localOrder.items
        });
      }
    } else if (item.type === 'order_delete') {
      await indexedDBManager.deleteLocalOrder(item.local_order_id);
    } else {
      await indexedDBManager.updateLocalOrder(item.local_order_id, {
        sync_status: 'synced',
        updated_at: new Date().toISOString()
      });
    }

    // Remove from sync queue
    await indexedDBManager.removeFromSyncQueue(item.id);

    console.log(`Successfully synced ${item.type} for order ${item.local_order_id}`);
  }

  async addOrderToSyncQueue(localOrder: LocalOrder): Promise<void> {
    const syncItem: SyncQueueItem = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'order_create',
      local_order_id: localOrder.local_order_id,
      data: {
        items: localOrder.items,
        total: localOrder.total,
        order_type: localOrder.order_type,
        table_id: localOrder.table_id
      },
      created_at: new Date().toISOString(),
      retry_count: 0
    };

    await indexedDBManager.addToSyncQueue(syncItem);

    // Start sync if online
    if (this.isOnline) {
      setTimeout(() => this.startSync(), 1000); // Small delay to allow UI to update
    }
  }

  async addOrderUpdateToSyncQueue(localOrderId: string, serverOrderId: string | undefined, updates: any): Promise<void> {
    const syncItem: SyncQueueItem = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'order_update',
      local_order_id: localOrderId,
      data: {
        server_order_id: serverOrderId,
        updates
      },
      created_at: new Date().toISOString(),
      retry_count: 0
    };

    await indexedDBManager.addToSyncQueue(syncItem);

    // Start sync if online
    if (this.isOnline) {
      setTimeout(() => this.startSync(), 1000);
    }
  }

  async addOrderDeleteToSyncQueue(localOrderId: string, serverOrderId: string | undefined): Promise<void> {
    const syncItem: SyncQueueItem = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'order_delete',
      local_order_id: localOrderId,
      data: {
        server_order_id: serverOrderId
      },
      created_at: new Date().toISOString(),
      retry_count: 0
    };

    await indexedDBManager.addToSyncQueue(syncItem);

    // Start sync if online
    if (this.isOnline) {
      setTimeout(() => this.startSync(), 1000);
    }
  }

  getSyncStatus(): { isOnline: boolean; syncInProgress: boolean } {
    return {
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress
    };
  }
}

// Export the class instead of an instance
export { SyncManager };
