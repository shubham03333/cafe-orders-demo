# Offline Support Implementation Plan

## Current Status
- ✅ PWA manifest present
- ✅ Service worker exists but not registered
- ✅ IndexedDB implemented with stores for orders, sync queue, and tables
- ✅ SyncManager class exists for background syncing
- ✅ Offline status detection hook exists
- ✅ Some offline order creation logic in CafeOrderSystem
- ❌ No menu data caching for offline
- ❌ No service worker registration
- ❌ No API response caching in service worker
- ❌ No offline menu/table data loading
- ❌ No automatic sync on reconnection

## Implementation Steps

### 1. Register Service Worker
- [x] Add service worker registration to layout.tsx
- [x] Handle registration errors gracefully

### 2. Update Service Worker for API Caching
- [x] Modify sw.js to cache menu API responses
- [x] Cache table API responses
- [x] Cache system settings if any
- [x] Implement cache-first strategy for static assets

### 3. Implement Menu Data Caching
- [x] Add menu store to IndexedDB schema
- [x] Create functions to save/load menu data
- [x] Update CafeOrderSystem to cache menu data on fetch

### 4. Implement Table Data Caching
- [x] Add table caching functions
- [x] Update CafeOrderSystem to cache table data

### 5. Update CafeOrderSystem for Offline Loading
- [x] Modify fetchMenu to load from cache when offline
- [x] Modify fetchTables to load from cache when offline
- [x] Add offline indicators in UI

### 6. Enhance Sync Manager
- [x] Ensure SyncManager handles all offline operations
- [x] Add automatic sync on reconnection
- [x] Handle sync conflicts gracefully

### 7. Add Offline UI Indicators
- [x] Show offline/online status in header
- [x] Indicate when data is from cache
- [x] Show sync status for pending orders

### 8. Testing
- [ ] Test offline order creation
- [ ] Test offline menu/table loading
- [ ] Test sync on reconnection
- [ ] Test printing offline
- [ ] Test no duplicate orders on sync
