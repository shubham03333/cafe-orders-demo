# OFFLINE POS FIX TODO

## EXACT BUGS FOUND

### 1. Sales Not Updating Offline
- **Bug**: When serving order offline, sales amount does NOT update immediately
- **Location**: `CafeOrderSystem.tsx:handlePaymentModeSelection()`
- **Root Cause**: Sales update happens outside IndexedDB transaction, not atomic with order status change

### 2. Duplicate Orders on Sync
- **Bug**: Same order appears twice after internet reconnect (#007 and #007 both pending)
- **Location**: `sync-manager-v2.ts:executeOperation()` and `updateLocalData()`
- **Root Cause**: Sync uses INSERT instead of UPSERT, no reconciliation by local_id, retry logic creates duplicates

### 3. Offline Orders Re-created Instead of Updated
- **Bug**: Offline-served orders are re-created on server instead of updated
- **Location**: `sync-manager-v2.ts:executeOperation()` for 'create_order'
- **Root Cause**: No distinction between create vs update operations, always calls POST

### 4. Orders Not Marked as Synced
- **Bug**: Offline served orders remain in pending sync state
- **Location**: `sync-manager-v2.ts:updateLocalData()`
- **Root Cause**: Sync status not properly updated after successful operations

### 5. API Calls During Offline
- **Bug**: App still calls online APIs while offline
- **Location**: Multiple locations in `CafeOrderSystem.tsx`
- **Root Cause**: Offline detection uses `navigator.onLine` but doesn't prevent API calls

### 6. Incorrect Sales Totals After Sync
- **Bug**: Sales totals become incorrect after sync
- **Location**: `payment-service.ts:process()` and sync reconciliation
- **Root Cause**: Sales ledger entries duplicated during sync, no deduplication by local_id

## ROOT CAUSE EXPLANATION

### Core Issue: Non-Atomic Operations
- Order status updates, sales updates, and sync queue additions happen separately
- No transaction rollback on failure
- Race conditions between UI updates and sync operations

### Sync Design Flaws
- No idempotent operations (retry creates duplicates)
- No reconciliation algorithm to merge server and local data
- Matching by order_number instead of local_id
- Sync queue doesn't distinguish between create vs update operations

### Offline Detection Problems
- `navigator.onLine` is unreliable for actual connectivity
- No circuit breaker pattern to prevent API calls during outages
- Fallback logic still attempts online operations

### Data Consistency Issues
- Multiple sources of truth (IndexedDB + Server)
- No conflict resolution strategy
- Sales calculations happen in multiple places

## STEP-BY-STEP FIXES

### Phase 1: Atomic Transactions
1. **Rewrite PaymentService.process()** to use single IndexedDB transaction
2. **Move sales update inside transaction** with order status change
3. **Add rollback logic** for failed operations

### Phase 2: Sync Algorithm Overhaul
1. **Implement UPSERT API endpoints** on server side
2. **Change sync operations to use local_id matching**
3. **Add reconciliation algorithm** in sync-manager
4. **Implement idempotent operations** with deduplication

### Phase 3: Offline-First Architecture
1. **Replace navigator.onLine with proper offline detection**
2. **Implement circuit breaker pattern**
3. **Ensure ZERO API calls during offline**
4. **Make IndexedDB the single source of truth**

### Phase 4: Data Reconciliation
1. **Add server data fetch during sync**
2. **Implement merge algorithm by local_id**
3. **Handle conflicts with local-wins strategy**
4. **Update sync status correctly**

## FUNCTIONS TO REWRITE

### 1. PaymentService.process()
```typescript
// BEFORE: Separate operations
await indexedDBManagerV2.updateOrder(orderId, { payment_status: 'paid' });
await indexedDBManagerV2.addSalesEntry({...});

// AFTER: Single atomic transaction
await indexedDBManagerV2.runTransaction([...], 'readwrite', async (tx) => {
  // Update order status
  // Add sales entry
  // Add sync queue item
  // All or nothing
});
```

### 2. SyncManagerV2.executeOperation()
```typescript
// BEFORE: Always POST for create_order
case 'create_order':
  const response = await fetch('/api/orders', { method: 'POST' });

// AFTER: UPSERT with local_id
case 'create_order':
  const response = await fetch('/api/orders', {
    method: 'POST',
    body: JSON.stringify({ local_id: item.data.local_id, ... })
  });
```

### 3. SyncManagerV2.updateLocalData()
```typescript
// BEFORE: Simple updates
case 'create_order':
  await updateOrder(item.order_id, { server_id: result.id });

// AFTER: Reconciliation
case 'create_order':
  await reconcileOrder(item.order_id, result);
```

### 4. CafeOrderSystem.handlePaymentModeSelection()
```typescript
// BEFORE: Separate offline/online logic
if (isOffline) {
  // Update local
  // Update sales
  // Queue sync
}

// AFTER: Always use PaymentService.process()
await PaymentService.process(orderId, paymentMode);
```

## INDEXEDDB TRANSACTION DESIGN

### Atomic Order Serving Transaction
```typescript
async serveOrderAtomically(orderId: string, paymentMode: 'cash' | 'online') {
  return indexedDBManagerV2.runTransaction(
    [STORES.ORDERS, STORES.SALES_LEDGER, STORES.SYNC_QUEUE],
    'readwrite',
    async (tx) => {
      // 1. Update order status to 'served'
      const orderStore = tx.objectStore(STORES.ORDERS);
      const order = await orderStore.get(orderId);
      order.status = 'served';
      order.payment_status = 'paid';
      order.payment_mode = paymentMode;
      order.served_at = new Date().toISOString();
      await orderStore.put(order);

      // 2. Add sales ledger entry
      const salesStore = tx.objectStore(STORES.SALES_LEDGER);
      const salesEntry = {
        id: uuidv4(),
        order_id: orderId,
        amount: order.total,
        payment_mode,
        date: new Date().toISOString().split('T')[0],
        type: 'sale',
        synced: false
      };
      await salesStore.add(salesEntry);

      // 3. Add sync queue item
      const syncStore = tx.objectStore(STORES.SYNC_QUEUE);
      const syncItem = {
        id: uuidv4(),
        operation_type: 'payment',
        order_id: orderId,
        data: { payment_mode, local_id: order.id },
        status: 'pending'
      };
      await syncStore.add(syncItem);

      return { order, salesEntry, syncItem };
    }
  );
}
```

### Sync Reconciliation Transaction
```typescript
async reconcileWithServer(serverOrders: any[]) {
  return indexedDBManagerV2.runTransaction(
    [STORES.ORDERS, STORES.SALES_LEDGER],
    'readwrite',
    async (tx) => {
      const orderStore = tx.objectStore(STORES.ORDERS);

      for (const serverOrder of serverOrders) {
        // Find local order by local_id
        const localOrder = await orderStore.index('local_id').get(serverOrder.local_id);

        if (localOrder) {
          // Update with server data if local is older
          if (new Date(serverOrder.updated_at) > new Date(localOrder.updated_at)) {
            await orderStore.put({
              ...localOrder,
              server_id: serverOrder.id,
              order_number: serverOrder.order_number,
              sync_status: 'synced'
            });
          }
        } else {
          // Create local copy of server order
          await orderStore.add({
            ...serverOrder,
            id: serverOrder.local_id || serverOrder.id,
            sync_status: 'synced'
          });
        }
      }
    }
  );
}
```

## SYNC ALGORITHM STEPS

### 1. Initial Sync Check
```
Online detected →
  Fetch server orders →
  Reconcile with local data →
  Process pending sync queue →
  Update UI
```

### 2. Sync Queue Processing
```
For each pending item:
  if operation_type == 'create_order':
    POST /api/orders with local_id
    if success: update local with server_id
    if conflict: GET /api/orders?local_id=X, update local

  if operation_type == 'payment':
    PUT /api/orders/{server_id}/pay
    if success: mark synced
    if not found: retry create_order first

  if operation_type == 'update_order':
    PUT /api/orders/{server_id}
    if success: mark synced
```

### 3. Reconciliation Algorithm
```
Server data received:
  For each server order:
    Find local by local_id
    If exists:
      If server newer: update local (server wins for some fields)
      If local newer: keep local, queue update to server
    Else:
      Create local copy

  For each local order:
    If not in server: queue create
    If server has different data: resolve conflict
```

### 4. Conflict Resolution
```
Order conflicts:
  - Status: local wins (user actions take precedence)
  - Payment: server wins (financial data)
  - Items: merge, local additions win
  - Timestamps: newest wins

Sales conflicts:
  - Deduplicate by order_id + date + amount
  - Server sales win for historical data
```

## TESTING CHECKLIST

### Offline → Online → Refresh Tests
- [ ] Serve order offline → sales updates instantly
- [ ] Refresh page offline → data remains correct
- [ ] Go online → order syncs once (no duplicates)
- [ ] Sales total remains correct after sync
- [ ] Order appears with correct server order number
- [ ] Sync status shows 'synced'

### Edge Cases
- [ ] Multiple offline orders sync correctly
- [ ] Sync interruption and resume works
- [ ] Server changes during offline period merge correctly
- [ ] Payment mode changes sync properly
- [ ] Order edits offline sync correctly
- [ ] Delete operations sync correctly

### Performance Tests
- [ ] Large number of pending orders sync efficiently
- [ ] Memory usage stays within limits during sync
- [ ] UI remains responsive during sync operations
- [ ] Battery usage acceptable during sync

### Error Recovery Tests
- [ ] Network drops during sync → resumes correctly
- [ ] Server errors → retry logic works
- [ ] Invalid data → graceful degradation
- [ ] Storage full → appropriate error messages

## IMPLEMENTATION PRIORITY

1. **HIGH**: Fix atomic transactions (PaymentService)
2. **HIGH**: Implement UPSERT APIs on server
3. **HIGH**: Fix sync to use local_id matching
4. **MEDIUM**: Add reconciliation algorithm
5. **MEDIUM**: Improve offline detection
6. **LOW**: Add conflict resolution UI
7. **LOW**: Performance optimizations

## SUCCESS CRITERIA

- ✅ Offline serve updates sales immediately
- ✅ No duplicate orders after sync
- ✅ Deterministic offline → online transition
- ✅ Sales totals always accurate
- ✅ Zero data loss during connectivity issues
- ✅ UI shows correct state at all times
- ✅ Sync is fast and reliable
