# Inventory Refresh Fix - Implementation Plan

## Objective
Fix the inventory refresh issue where data becomes invisible during 5-second polling refreshes. Data should remain visible while refresh happens in background.

## Steps to Complete

### 1. [ ] Modify InventoryDashboard.tsx
- [ ] Add `isRefreshing` state to track background refresh status
- [ ] Update `fetchInventory()` function to accept `isBackgroundRefresh` parameter
- [ ] Modify polling logic to use `isRefreshing` state instead of `loading` for background refreshes
- [ ] Add subtle visual indicator for refresh status
- [ ] Update UI to keep data visible during refreshes

### 2. [ ] Test the implementation
- [ ] Verify data remains visible during background refreshes
- [ ] Ensure polling still works correctly every 5 seconds
- [ ] Confirm error handling remains functional
- [ ] Test both menu items and raw materials tabs

## Expected Outcome
- Inventory data remains visible during background refreshes
- Subtle visual feedback for refresh status instead of hiding data
- 5-second polling functionality maintained
- No disruption to user experience
