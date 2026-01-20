# Sales Fix TODO

## Problem
Sales amount is being added twice:
1. When order is placed (POST /api/orders)
2. When order is served (PUT /api/orders/[id] with status 'served')

## Solution
Remove sales update from POST method, keep only in PUT method when status changes to 'served'

## Steps
- [x] Remove sales update logic from src/app/api/orders/route.ts (POST method)
- [x] Verify PUT method in src/app/api/orders/[id]/route.ts has correct sales update logic
- [ ] Test the fix to ensure sales are only updated when orders are served

## Files to Modify
- src/app/api/orders/route.ts
