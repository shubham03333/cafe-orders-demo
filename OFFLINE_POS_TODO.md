# OFFLINE_POS_TODO.md

## Production-Grade Offline-First POS System Redesign

### Current Problems Analysis
1. **Duplicate orders**: Sync engine doesn't prevent duplicates when offline→online transitions occur
2. **Duplicate payments**: Payment processing lacks idempotency and atomic transactions
3. **Inconsistent sales**: Sales updates happen outside transactions, causing race conditions
4. **API calls during offline**: Network checks are scattered, not centralized
5. **Race conditions**: Polling + retries create conflicting operations
6. **State inconsistency**: UI, IndexedDB, and server states diverge
7. **No atomic operations**: Order status + payment + sales updates aren't transactional
8. **Polling violations**: Continues polling when offline
9. **No unique IDs**: Orders lack globally unique, deterministic IDs
10. **Sync failures**: No retry logic, conflict resolution, or exactly-once semantics

---

## 🏗️ ARCHITECTURE OVERVIEW

### Core Principles
- **OFFLINE-FIRST**: All operations check offline status BEFORE any network calls
- **SINGLE SOURCE OF TRUTH**: IndexedDB is the only state source
- **ATOMIC TRANSACTIONS**: Every user action is a single IndexedDB transaction
- **EXACTLY-ONCE SYNC**: Deterministic sync with conflict resolution
- **IDEMPOTENT APIs**: Server operations are safe to retry

### Data Flow Architecture
```
User Action → Offline Check → IndexedDB Transaction → UI Update → Sync Queue → Background Sync
```

### IndexedDB Schema Redesign

#### Object Stores
```javascript
// Orders store - single source of truth
orders: {
  keyPath: 'id', // UUID v4
  indexes: {
    'sync_status': ['sync_status'],
    'status': ['status'],
    'created_at': ['created_at'],
    'server_id': ['server_id'], // for conflict resolution
    'local_id': ['local_id'] // for local operations
  }
}

// Sync Queue - deterministic ordering
sync_queue: {
  keyPath: 'id',
  indexes: {
    'status': ['status'],
    'created_at': ['created_at'],
    'operation_type': ['operation_type']
  }
}

// Sales Ledger - append-only, immutable
sales_ledger: {
  keyPath: 'id',
  indexes: {
    'date': ['date'],
    'order_id': ['order_id'],
    'type': ['type'] // 'sale', 'refund', 'adjustment'
  }
}

// Cache stores (read-only from server)
menu_cache: { keyPath: 'id', indexes: { 'last_updated': ['last_updated'] } }
tables_cache: { keyPath: 'id', indexes: { 'last_updated': ['last_updated'] } }
```

#### Order Document Structure
```javascript
{
  id: "uuid-v4", // Globally unique
  local_id: "local_1234567890", // For backward compatibility
  server_id: null, // Set after sync
  order_number: null, // Assigned by server
  status: "pending|preparing|ready|served|cancelled",
  payment_status: "pending|paid|failed|refunded",
  payment_mode: "cash|online|null",
  items: [...],
  total: 150,
  order_type: "DINE_IN|TAKEAWAY|DELIVERY",
  table_id: "T001",
  table_code: "T001",
  table_name: "Table 1",
  customer_info: {...},
  created_at: "2024-01-01T10:00:00Z",
  updated_at: "2024-01-01T10:00:00Z",
  created_by: "staff_id",
  sync_status: "pending|syncing|synced|failed",
  sync_attempts: 0,
  last_sync_attempt: null,
  version: 1, // For conflict resolution
  source: "offline|online" // Track origin
}
```

### State Ownership Rules
- **React State**: Derived from IndexedDB, never primary source
- **IndexedDB**: Single source of truth for all data
- **Server**: Mirror of IndexedDB, updated via sync
- **UI Updates**: Always from IndexedDB changes, never direct state mutations

---

## 📋 IMPLEMENTATION PLAN

### Phase 1: Database Schema Migration
- [ ] Create new IndexedDB schema with version bump
- [ ] Migrate existing data to new structure
- [ ] Add data validation and integrity checks
- [ ] Create migration rollback capability

### Phase 2: Core Infrastructure
- [ ] Implement `OfflineManager` class for centralized offline detection
- [ ] Create `TransactionManager` for atomic operations
- [ ] Implement `IdGenerator` for deterministic UUIDs
- [ ] Build `StateManager` for IndexedDB ↔ React state sync

### Phase 3: Order Lifecycle Engine
- [ ] Redesign `OrderService` with atomic transactions
- [ ] Implement order creation with conflict prevention
- [ ] Add order status transitions with validation
- [ ] Create order editing with proper versioning

### Phase 4: Payment & Sales Engine
- [ ] Build atomic payment processing
- [ ] Implement sales ledger with append-only design
- [ ] Add payment idempotency checks
- [ ] Create sales reconciliation logic

### Phase 5: Sync Engine Redesign
- [ ] Implement deterministic sync queue processing
- [ ] Add conflict resolution strategies
- [ ] Create retry logic with exponential backoff
- [ ] Build sync status tracking and error handling

### Phase 6: API Layer Hardening
- [ ] Make all server APIs idempotent
- [ ] Add request deduplication
- [ ] Implement optimistic updates
- [ ] Create offline operation queuing

### Phase 7: UI State Management
- [ ] Replace direct React state with IndexedDB-derived state
- [ ] Implement real-time UI updates from database changes
- [ ] Add offline indicator and sync status displays
- [ ] Create conflict resolution UI components

### Phase 8: Testing & Validation
- [ ] Unit tests for all atomic operations
- [ ] Integration tests for offline/online transitions
- [ ] Load testing for concurrent operations
- [ ] End-to-end sync reliability tests

---

## 🔧 DETAILED TASKS

### Database Schema Changes
1. **Create new IndexedDB version (v4)**
   - Add orders store with proper indexes
   - Add sync_queue with deterministic ordering
   - Add sales_ledger as append-only store
   - Add cache stores with TTL

2. **Data Migration Script**
   - Migrate existing localOrders to new orders format
   - Convert syncQueue to new structure
   - Initialize sales_ledger from existing data
   - Validate data integrity post-migration

### Refactor Tasks

#### Delete These Functions (Unsafe)
- [ ] `fetchOrders()` - polling-based, replace with subscription
- [ ] `fetchDailySales()` - direct API calls, replace with local calculation
- [ ] `updateOrderStatus()` - non-atomic, replace with transactional updates
- [ ] `handlePaymentModeSelection()` - scattered logic, consolidate in PaymentService

#### Rewrite These Functions (Unsafe)
- [ ] `placeOrder()` - make atomic with transaction manager
- [ ] `saveEditedOrder()` - add versioning and conflict resolution
- [ ] `deleteOrder()` - implement soft deletes with sync
- [ ] `generateSalesReport()` - use local sales_ledger instead of API

#### New Functions to Create
- [ ] `OfflineManager.isOffline()` - centralized offline detection
- [ ] `TransactionManager.run()` - atomic operation wrapper
- [ ] `OrderService.create()` - atomic order creation
- [ ] `OrderService.updateStatus()` - atomic status changes
- [ ] `PaymentService.process()` - atomic payment processing
- [ ] `SalesService.record()` - append-only sales recording
- [ ] `SyncEngine.processQueue()` - deterministic sync processing

### Sync Engine Tasks
1. **Queue Management**
   - Implement priority-based queuing
   - Add operation deduplication
   - Create queue persistence across app restarts

2. **Conflict Resolution**
   - Server-wins strategy for conflicts
   - Client-wins for offline-created data
   - Manual resolution for complex conflicts

3. **Retry Logic**
   - Exponential backoff (1s, 2s, 4s, 8s, 16s max)
   - Maximum retry count (5 attempts)
   - Circuit breaker for failing operations

4. **Status Tracking**
   - Real-time sync progress indicators
   - Failed operation notifications
   - Manual retry capabilities

### Testing Checklist
- [ ] Offline order creation works
- [ ] Offline payment processing works
- [ ] Sales totals update correctly offline
- [ ] Online sync doesn't create duplicates
- [ ] Conflict resolution works
- [ ] UI updates from database changes
- [ ] Network recovery sync works
- [ ] Multiple device sync works
- [ ] Data integrity maintained across restarts

---

## 🎯 SUCCESS CRITERIA

### Functional Requirements
- ✅ Zero duplicate orders in offline→online transitions
- ✅ Zero duplicate payments and sales records
- ✅ Sales amounts always accurate offline and online
- ✅ No API calls when offline
- ✅ No race conditions from polling + retries
- ✅ Consistent state across UI, IndexedDB, and server
- ✅ Atomic transactions for all user actions
- ✅ Exactly-once sync semantics
- ✅ Polling stops when offline, resumes when online
- ✅ Offline operations behave identically to online

### Performance Requirements
- ✅ Sub-100ms response for all user actions
- ✅ Sync completes within 5 seconds of reconnection
- ✅ UI remains responsive during sync operations
- ✅ Memory usage stays under 50MB during normal operation

### Reliability Requirements
- ✅ 99.9% uptime for offline operations
- ✅ Zero data loss during network interruptions
- ✅ Automatic recovery from all failure scenarios
- ✅ Backward compatibility with existing data

---

## 🚀 IMPLEMENTATION SEQUENCE

1. **Week 1**: Database migration and core infrastructure
2. **Week 2**: Order lifecycle and payment engines
3. **Week 3**: Sync engine and API hardening
4. **Week 4**: UI state management and testing
5. **Week 5**: Production deployment and monitoring

---

## 📊 MONITORING & METRICS

### Key Metrics to Track
- Sync success rate (>99.9%)
- Duplicate detection rate (0%)
- Offline operation success rate (>99.9%)
- Average sync time (<5 seconds)
- Transaction failure rate (<0.1%)
- Data consistency score (100%)

### Alert Conditions
- Sync failure rate >1%
- Duplicate detection >0
- Offline operation failure >1%
- Sync time >30 seconds
- Transaction failure >1%

---

## 🔒 SAFETY MEASURES

### Rollback Strategy
- Feature flags for gradual rollout
- Database migration rollback scripts
- API versioning for backward compatibility
- Monitoring dashboards for early detection

### Data Integrity
- Checksums for all critical data
- Transaction log for audit trail
- Backup before any schema changes
- Validation at all data boundaries

This redesign transforms the POS system into a production-grade, offline-first application that behaves exactly like Toast, Square, and other leading POS systems.
