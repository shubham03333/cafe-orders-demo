import { v4 as uuidv4 } from 'uuid';

/* =========================
   TYPES
========================= */

export interface Order {
  id: string;
  server_id?: string;
  order_number?: string;

  status: 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_mode?: 'cash' | 'online';

  items: any[];
  total: number;

  order_type: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
  table_id?: string;
  table_code?: string;
  table_name?: string;

  customer_info?: any;

  created_at: string;
  updated_at: string;

  sync_status: 'pending' | 'syncing' | 'synced' | 'failed';
  sync_attempts: number;
  last_sync_attempt?: string;

  version: number;
  source: 'offline' | 'online';
}

export interface SyncQueueItem {
  id: string;
  operation_type: 'create_order' | 'update_order' | 'delete_order' | 'payment';
  order_id: string;
  data: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  retry_count: number;
  last_attempt?: string;
  error_message?: string;
  priority: number;
}

export interface SalesLedgerEntry {
  id: string;
  order_id: string;
  amount: number;
  payment_mode: 'cash' | 'online';
  date: string;
  type: 'sale' | 'refund' | 'adjustment';
  created_at: string;
  synced: boolean;
}

/* =========================
   STORES
========================= */

const STORES = {
  ORDERS: 'orders',
  SYNC_QUEUE: 'sync_queue',
  SALES_LEDGER: 'sales_ledger'
} as const;

/* =========================
   HELPERS
========================= */

function req<T = any>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}




/* =========================
   MANAGER
========================= */

class IndexedDBManagerV2 {
  private db: IDBDatabase | null = null;
  private readonly dbName = 'cafe-orders-db-v2';
  private readonly dbVersion = 1;

  async init(): Promise<void> {
    if (this.db) return;

    this.db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(STORES.ORDERS)) {
          const store = db.createObjectStore(STORES.ORDERS, { keyPath: 'id' });
          store.createIndex('sync_status', 'sync_status');
          store.createIndex('status', 'status');
          store.createIndex('server_id', 'server_id');
        }

        if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
          const store = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id' });
          store.createIndex('status', 'status');
          store.createIndex('created_at', 'created_at');
          store.createIndex('priority', 'priority');
        }

        if (!db.objectStoreNames.contains(STORES.SALES_LEDGER)) {
          const store = db.createObjectStore(STORES.SALES_LEDGER, { keyPath: 'id' });
          store.createIndex('order_id', 'order_id');
          store.createIndex('date', 'date');
          store.createIndex('synced', 'synced');
        }
      };
    });
  }
async getAllOrders(): Promise<Order[]> {
  return this.runTransaction([STORES.ORDERS], 'readonly', async (tx) => {
    const store = tx.objectStore(STORES.ORDERS);
    return new Promise<Order[]>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  });
}

  async runTransaction<T>(
    stores: string[],
    mode: IDBTransactionMode,
    fn: (tx: IDBTransaction) => Promise<T>
  ): Promise<T> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(stores, mode);
      fn(tx).then(resolve).catch(reject);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(new Error('Transaction aborted'));
    });
  }

  /* =========================
     ORDERS
  ========================= */

  async saveOrder(order: Order): Promise<void> {
    await this.runTransaction([STORES.ORDERS], 'readwrite', async (tx) => {
      await req(tx.objectStore(STORES.ORDERS).put(order));
    });
  }

  async getOrder(id: string): Promise<Order | null> {
    return this.runTransaction([STORES.ORDERS], 'readonly', async (tx) => {
      return req<Order | null>(tx.objectStore(STORES.ORDERS).get(id));
    });
  }

  async updateOrder(id: string, updates: Partial<Order>): Promise<void> {
    await this.runTransaction([STORES.ORDERS], 'readwrite', async (tx) => {
      const store = tx.objectStore(STORES.ORDERS);
      const existing = await req<Order | null>(store.get(id));
      if (!existing) throw new Error('Order not found');

      await req(
        store.put({
          ...existing,
          ...updates,
          updated_at: new Date().toISOString(),
          version: existing.version + 1
        })
      );
    });
  }

  /* =========================
     SYNC QUEUE
  ========================= */

  async addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'created_at'>): Promise<string> {
    const id = uuidv4();
    await this.runTransaction([STORES.SYNC_QUEUE], 'readwrite', async (tx) => {
      await req(
        tx.objectStore(STORES.SYNC_QUEUE).put({
          ...item,
          id,
          created_at: new Date().toISOString()
        })
      );
    });
    return id;
  }

  async getPendingSyncItems(): Promise<SyncQueueItem[]> {
    return this.runTransaction([STORES.SYNC_QUEUE], 'readonly', async (tx) => {
      const items = await req<SyncQueueItem[]>(
        tx.objectStore(STORES.SYNC_QUEUE).index('status').getAll('pending')
      );

      return items.sort((a, b) => {
        if (a.priority !== b.priority) return b.priority - a.priority;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
    });
  }

  async updateSyncQueueItem(id: string, updates: Partial<SyncQueueItem>): Promise<void> {
    await this.runTransaction([STORES.SYNC_QUEUE], 'readwrite', async (tx) => {
      const store = tx.objectStore(STORES.SYNC_QUEUE);
      const existing = await req<SyncQueueItem | null>(store.get(id));
      if (!existing) throw new Error('Sync item not found');

      await req(store.put({ ...existing, ...updates }));
    });
  }

  async removeFromSyncQueue(id: string): Promise<void> {
    await this.runTransaction([STORES.SYNC_QUEUE], 'readwrite', async (tx) => {
      await req(tx.objectStore(STORES.SYNC_QUEUE).delete(id));
    });
  }

  /* =========================
     SALES LEDGER
  ========================= */

  async addSalesEntry(entry: Omit<SalesLedgerEntry, 'id' | 'created_at'>): Promise<string> {
    return this.runTransaction([STORES.SALES_LEDGER], 'readwrite', async (tx) => {
      const store = tx.objectStore(STORES.SALES_LEDGER);

      const existing = await req<SalesLedgerEntry[]>(
        store.index('order_id').getAll(entry.order_id)
      );

      if (existing.some(e => e.type === 'sale')) {
        return existing[0].id;
      }

      const id = uuidv4();
      await req(
        store.put({
          ...entry,
          id,
          created_at: new Date().toISOString()
        })
      );
      return id;
    });
  }

  async getSalesForDate(date: string): Promise<SalesLedgerEntry[]> {
    return this.runTransaction([STORES.SALES_LEDGER], 'readonly', async (tx) => {
      return req(
        tx.objectStore(STORES.SALES_LEDGER).index('date').getAll(date)
      );
    });
  }

  async getUnsyncedSales(): Promise<SalesLedgerEntry[]> {
    return this.runTransaction([STORES.SALES_LEDGER], 'readonly', async (tx) => {
      return req(
        tx.objectStore(STORES.SALES_LEDGER)
          .index('synced')
          .getAll(IDBKeyRange.only(false))
      );
    });
  }
}



export const indexedDBManagerV2 = new IndexedDBManagerV2();
