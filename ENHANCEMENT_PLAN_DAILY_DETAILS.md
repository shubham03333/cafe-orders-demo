# Enhancement Plan: Daily Breakdown Order Details

## Objective
Add functionality to show detailed order information when clicking on a daily breakdown row, including:
- Dish name
- Quantity sold
- Revenue per dish
- Organized in columns: Dish Name | Quantity | Revenue

## Implementation Steps

### 1. Backend API Enhancement
- Create new API endpoint `/api/daily-orders/{date}` to fetch orders for a specific date
- Return structured data with dish details, quantities, and revenue

### 2. Frontend Component Updates
- Add state to track selected date and order details
- Create modal/dialog component to display order details
- Add click handler to daily breakdown rows
- Implement loading states and error handling

### 3. UI/UX Improvements
- Design modal layout with clear column structure
- Add sorting capabilities for the order details
- Include total summary for the selected date
- Ensure responsive design

## API Endpoint Structure
```
GET /api/daily-orders/{date}
Response: {
  date: string,
  total_orders: number,
  total_revenue: number,
  order_details: Array<{
    dish_name: string,
    quantity: number,
    revenue: number,
    price_per_unit: number
  }>
}
```

## Frontend Component Changes
- Add `selectedDate` state
- Add `orderDetails` state
- Add `showOrderModal` state
- Add click handler for daily breakdown rows
- Create OrderDetailsModal component
