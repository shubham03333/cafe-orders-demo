# Offline Dashboard Fixes

## Issues to Fix
- [ ] Pending orders show 0 offline
- [ ] Sales show 0 offline
- [ ] Table states disappear offline
- [ ] Served orders show none offline
- [ ] Payment processing fails offline

## Implementation Plan
1. [ ] Fix fetchDailySales to load sales data from local storage when offline
2. [ ] Fix fetchTables logic to load from cache when offline
3. [ ] Ensure served orders are properly stored locally when marked as served
4. [ ] Add offline handling for payment processing (store payment locally and sync later)
5. [ ] Add local storage for daily sales data
6. [ ] Update IndexedDB to store sales data
7. [ ] Update SyncManager to handle sales data sync

## Files to Modify
- src/components/CafeOrderSystem.tsx
- src/lib/indexeddb.ts
- src/lib/syncManager.ts (if exists)
