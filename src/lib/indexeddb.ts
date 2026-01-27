import { LocalOrder, SyncQueueItem, LocalTable, MenuItem, Table } from '@/types';

const STORES = {
  ORDERS: 'localOrders',
  SYNC: 'syncQueue',
  TABLES: 'localTables',
  MENU: 'menuData',
  TABLE_DATA: 'tableData',
  SALES: 'salesData'
} as const;

class IndexedDBManager {
  private db: IDBDatabase | null = null;
  private readonly dbName = 'cafe-orders-db';
  private readonly dbVersion = 3;

  async init(): Promise<void> {
    if (this.db) return; // Prevent double init during Fast Refresh

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('IndexedDB error:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        this.db = db;

        // Create object stores
        if (!db.objectStoreNames.contains(STORES.ORDERS)) {
          const ordersStore = db.createObjectStore(STORES.ORDERS, { keyPath: 'local_order_id' });
          ordersStore.createIndex('sync_status', 'sync_status', { unique: false });
          ordersStore.createIndex('created_at', 'created_at', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.SYNC)) {
          const syncStore = db.createObjectStore(STORES.SYNC, { keyPath: 'id', autoIncrement: true });
          syncStore.createIndex('type', 'type', { unique: false });
          syncStore.createIndex('created_at', 'created_at', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.TABLES)) {
          const tablesStore = db.createObjectStore(STORES.TABLES, { keyPath: 'id' });
          tablesStore.createIndex('last_updated', 'last_updated', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.MENU)) {
          const menuStore = db.createObjectStore(STORES.MENU, { keyPath: 'id' });
          menuStore.createIndex('last_updated', 'last_updated', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.TABLE_DATA)) {
          const tableDataStore = db.createObjectStore(STORES.TABLE_DATA, { keyPath: 'id' });
          tableDataStore.createIndex('last_updated', 'last_updated', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.SALES)) {
          const salesDataStore = db.createObjectStore(STORES.SALES, { keyPath: 'id' });
          salesDataStore.createIndex('last_updated', 'last_updated', { unique: false });
        }

        console.log('IndexedDB schema created');
      };
    });
  }

  private ensureStore(storeName: string) {
    if (!this.db) {
      throw new Error('DB not initialized');
    }
    if (!this.db.objectStoreNames.contains(storeName)) {
      throw new Error(`IndexedDB store missing: ${storeName}`);
    }
  }

  // Local Orders CRUD
  async saveLocalOrder(order: LocalOrder): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.ORDERS], 'readwrite');
      this.ensureStore(STORES.ORDERS);
      const store = transaction.objectStore(STORES.ORDERS);
      const request = store.put(order);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getLocalOrder(localOrderId: string): Promise<LocalOrder | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.ORDERS], 'readonly');
      this.ensureStore(STORES.ORDERS);
      const store = transaction.objectStore(STORES.ORDERS);
      const request = store.get(localOrderId);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllLocalOrders(): Promise<LocalOrder[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.ORDERS], 'readonly');
      this.ensureStore(STORES.ORDERS);
      const store = transaction.objectStore(STORES.ORDERS);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingSyncOrders(): Promise<LocalOrder[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.ORDERS], 'readonly');
      this.ensureStore(STORES.ORDERS);
      const store = transaction.objectStore(STORES.ORDERS);
      const index = store.index('sync_status');
      const request = index.getAll('pending');

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async updateLocalOrder(localOrderId: string, updates: Partial<LocalOrder>): Promise<void> {
    if (!this.db) await this.init();

    const existingOrder = await this.getLocalOrder(localOrderId);
    if (!existingOrder) throw new Error('Order not found');

    const updatedOrder = { ...existingOrder, ...updates, updated_at: new Date().toISOString() };
    await this.saveLocalOrder(updatedOrder);
  }

  async deleteLocalOrder(localOrderId: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.ORDERS], 'readwrite');
      this.ensureStore(STORES.ORDERS);
      const store = transaction.objectStore(STORES.ORDERS);
      const request = store.delete(localOrderId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Sync Queue CRUD
  async addToSyncQueue(item: SyncQueueItem): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.SYNC], 'readwrite');
      this.ensureStore(STORES.SYNC);
      const store = transaction.objectStore(STORES.SYNC);
      const request = store.put(item);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getSyncQueue(): Promise<SyncQueueItem[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.SYNC], 'readonly');
      this.ensureStore(STORES.SYNC);
      const store = transaction.objectStore(STORES.SYNC);
      const index = store.index('created_at');
      const request = index.getAll();

      request.onsuccess = () => {
        const items = request.result || [];
        // Sort by creation time
        items.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        resolve(items);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async removeFromSyncQueue(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.SYNC], 'readwrite');
      this.ensureStore(STORES.SYNC);
      const store = transaction.objectStore(STORES.SYNC);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async updateSyncQueueItem(id: string, updates: Partial<SyncQueueItem>): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.SYNC], 'readwrite');
      this.ensureStore(STORES.SYNC);
      const store = transaction.objectStore(STORES.SYNC);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const existingItem = getRequest.result;
        if (!existingItem) {
          reject(new Error('Sync queue item not found'));
          return;
        }

        const updatedItem = { ...existingItem, ...updates };
        const putRequest = store.put(updatedItem);

        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // Local Tables CRUD
  async saveLocalTable(table: LocalTable): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.TABLES], 'readwrite');
      this.ensureStore(STORES.TABLES);
      const store = transaction.objectStore(STORES.TABLES);
      const request = store.put(table);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getLocalTable(id: number): Promise<LocalTable | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.TABLES], 'readonly');
      this.ensureStore(STORES.TABLES);
      const store = transaction.objectStore(STORES.TABLES);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllLocalTables(): Promise<LocalTable[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.TABLES], 'readonly');
      this.ensureStore(STORES.TABLES);
      const store = transaction.objectStore(STORES.TABLES);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  // Menu Data CRUD
  async saveMenuData(menuItems: MenuItem[]): Promise<void> {
    if (!this.db) await this.init();

    const menuData = {
      id: 'menu',
      data: menuItems,
      last_updated: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['menuData'], 'readwrite');
      const store = transaction.objectStore('menuData');
      const request = store.put(menuData);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getMenuData(): Promise<MenuItem[] | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['menuData'], 'readonly');
      const store = transaction.objectStore('menuData');
      const request = store.get('menu');

      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.data : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Table Data CRUD
  async saveTableData(tables: Table[]): Promise<void> {
    if (!this.db) await this.init();

    const tableData = {
      id: 'tables',
      data: tables,
      last_updated: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.TABLE_DATA], 'readwrite');
      this.ensureStore(STORES.TABLE_DATA);
      const store = transaction.objectStore(STORES.TABLE_DATA);
      const request = store.put(tableData);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getTableData(): Promise<Table[] | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.TABLE_DATA], 'readonly');
      this.ensureStore(STORES.TABLE_DATA);
      const store = transaction.objectStore(STORES.TABLE_DATA);
      const request = store.get('tables');

      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.data : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Sales Data CRUD
  async saveSalesData(salesData: any): Promise<void> {
    if (!this.db) await this.init();

    const salesDataWithMeta = {
      id: 'sales',
      data: salesData,
      last_updated: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.SALES], 'readwrite');
      this.ensureStore(STORES.SALES);
      const store = transaction.objectStore(STORES.SALES);
      const request = store.put(salesDataWithMeta);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getSalesData(): Promise<any | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.SALES], 'readonly');
      this.ensureStore(STORES.SALES);
      const store = transaction.objectStore(STORES.SALES);
      const request = store.get('sales');

      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.data : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Utility methods
  async clearAllData(): Promise<void> {
    if (!this.db) await this.init();

    const stores = Object.values(STORES);
    const promises = stores.map(storeName => {
      return new Promise<void>((resolve, reject) => {
        const transaction = this.db!.transaction([storeName], 'readwrite');
        this.ensureStore(storeName);
        const store = transaction.objectStore(storeName);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });

    await Promise.all(promises);
  }

  async getStorageStats(): Promise<{
    ordersCount: number;
    syncQueueCount: number;
    tablesCount: number;
  }> {
    if (!this.db) await this.init();

    const [orders, syncItems, tables] = await Promise.all([
      this.getAllLocalOrders(),
      this.getSyncQueue(),
      this.getAllLocalTables()
    ]);

    return {
      ordersCount: orders.length,
      syncQueueCount: syncItems.length,
      tablesCount: tables.length
    };
  }
}

export const indexedDBManager = new IndexedDBManager();
