# TODO: Inventory Management System Implementation

## Phase 1: Database & Backend Setup

### 1.1 Database Schema Updates
- [ ] Add inventory columns to `menu_items` table:
  ```sql
  ALTER TABLE menu_items ADD COLUMN stock_quantity INT DEFAULT 0;
  ALTER TABLE menu_items ADD COLUMN low_stock_threshold INT DEFAULT 5;
  ALTER TABLE menu_items ADD COLUMN unit_type VARCHAR(20) DEFAULT 'pieces';
  ALTER TABLE menu_items ADD COLUMN ingredients JSON;
  ALTER TABLE menu_items ADD COLUMN supplier_info VARCHAR(255);
  ALTER TABLE menu_items ADD COLUMN last_restocked TIMESTAMP;
  ```

### 1.2 TypeScript Interface Updates
- [ ] Update `src/types/index.ts` to include inventory properties:
  ```typescript
  export interface MenuItem {
    id: number;
    name: string;
    price: number;
    is_available: boolean;
    category: string;
    position?: number;
    // Inventory fields
    stock_quantity?: number;
    low_stock_threshold?: number;
    unit_type?: string;
    ingredients?: Record<string, number>; // ingredient: quantity
    supplier_info?: string;
    last_restocked?: string;
  }
  ```

### 1.3 API Routes Creation
- [ ] Create `/api/inventory/route.ts` - Main inventory CRUD operations
- [ ] Create `/api/inventory/transactions/route.ts` - Stock movement tracking
- [ ] Create `/api/inventory/alerts/route.ts` - Low stock notifications
- [ ] Create `/api/inventory/reports/route.ts` - Analytics and reports

## Phase 2: Frontend Components

### 2.1 Inventory Dashboard Component
- [ ] Create `src/components/InventoryDashboard.tsx`
- [ ] Display stock overview with color-coded alerts
- [ ] Show low stock items prominently
- [ ] Include quick actions for restocking

### 2.2 Inventory Management Interface
- [ ] Create `src/components/InventoryManager.tsx`
- [ ] CRUD operations for inventory items
- [ ] Stock level adjustments
- [ ] Supplier information management
- [ ] Recipe/ingredient tracking

### 2.3 Stock Transaction History
- [ ] Create `src/components/InventoryTransactions.tsx`
- [ ] Track all stock movements (additions, deductions)
- [ ] Filter by date range and item
- [ ] Export functionality

## Phase 3: Integration Features

### 3.1 Order System Integration
- [ ] Modify order processing to deduct stock
- [ ] Add stock availability validation before order placement
- [ ] Implement automatic stock updates when orders are served

### 3.2 Real-time Stock Alerts
- [ ] Create notification system for low stock
- [ ] Email/SMS alerts for critical stock levels
- [ ] Dashboard indicators for urgent restocking needs

### 3.3 Reporting & Analytics
- [ ] Stock consumption reports
- [ ] Popular item analytics
- [ ] Restocking frequency analysis
- [ ] Inventory valuation reports

## Phase 4: Advanced Features

### 4.1 Recipe Management
- [ ] Multi-level ingredient tracking
- [ ] Recipe cost calculation
- [ ] Ingredient substitution tracking

### 4.2 Supplier Management
- [ ] Supplier database
- [ ] Purchase order tracking
- [ ] Supplier performance metrics

### 4.3 Barcode/QR Code Support
- [ ] Item scanning for quick stock updates
- [ ] Mobile inventory management

## Implementation Priority:

**High Priority (Core Functionality):**
1. Database schema updates
2. Basic inventory CRUD operations
3. Stock level tracking
4. Low stock alerts
5. Order system integration

**Medium Priority (Enhanced Features):**
1. Transaction history
2. Reporting system
3. Recipe management
4. Supplier tracking

**Low Priority (Advanced Features):**
1. Barcode scanning
2. Mobile app integration
3. Advanced analytics
4. Multi-location support

## Files to Create/Modify:

### Backend:
- `src/types/index.ts` (update MenuItem interface)
- `src/app/api/inventory/route.ts` (new)
- `src/app/api/inventory/transactions/route.ts` (new)
- `src/app/api/inventory/alerts/route.ts` (new)
- `src/app/api/inventory/reports/route.ts` (new)
- `src/app/api/orders/route.ts` (modify for stock deduction)
- `scripts/init-database.sql` (update schema)

### Frontend:
- `src/app/admin/page.tsx` (update inventory tab)
- `src/components/InventoryDashboard.tsx` (new)
- `src/components/InventoryManager.tsx` (new)
- `src/components/InventoryTransactions.tsx` (new)
- `src/components/StockAlerts.tsx` (new)

## Dependencies:
- No additional npm packages required initially
- May consider adding chart libraries for analytics later

## Testing Plan:
1. Unit tests for inventory calculations
2. Integration tests for order-stock interaction
3. End-to-end tests for inventory management workflow
4. Performance testing for large inventory datasets

## Timeline Estimate:
- Phase 1: 2-3 days
- Phase 2: 3-4 days  
- Phase 3: 2-3 days
- Phase 4: 4-5 days (optional)

## Success Metrics:
- Stock accuracy > 99%
- Low stock detection time < 1 hour
- Order rejection rate due to stockouts < 0.1%
- Inventory management time reduction by 50%

This comprehensive inventory system will transform the admin panel from a basic menu management tool to a complete restaurant inventory management solution.
