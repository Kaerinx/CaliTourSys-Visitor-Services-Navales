# Supabase Integration Guide
## Calabanga Tourism Management System

This guide explains how all modules are integrated with Supabase for real-time data persistence.

---

## 🗄️ Backend Architecture

### Server Structure
```
/supabase/functions/server/
├── index.tsx              # Main server with route mounting
├── kv_store.tsx          # Protected KV utilities
├── otop-routes.tsx       # OTOP product routes
├── business-routes.tsx   # Business accreditation routes
├── development-routes.tsx # Events & packages routes
├── visitor-routes.tsx    # Visitor services routes
└── reports-routes.tsx    # Reports generation routes
```

### API Base URL
```
https://{projectId}.supabase.co/functions/v1/make-server-15ff0e9f
```

---

## 📦 Available APIs

### 1. OTOP Support Module

#### Products
- `GET /otop/products` - Get all products
- `GET /otop/products/:id` - Get single product
- `POST /otop/products` - Create product
- `PUT /otop/products/:id` - Update product
- `DELETE /otop/products/:id` - Delete product

#### Categories
- `GET /otop/categories` - Get all categories
- `POST /otop/categories` - Create category
- `PUT /otop/categories/:id` - Update category
- `DELETE /otop/categories/:id` - Delete category

**Data Structure:**
```typescript
{
  id: string,
  name: string,
  category: string,
  price: string,
  producer: string,
  description: string,
  stockLevel: number,
  status: 'Published' | 'Pending Review' | 'Draft' | 'Archived',
  submittedDate: ISO timestamp,
  createdAt: ISO timestamp,
  updatedAt: ISO timestamp
}
```

### 2. Business Accreditation Module

- `GET /business/businesses` - Get all businesses
- `GET /business/businesses/:id` - Get single business
- `POST /business/businesses` - Create application
- `PUT /business/businesses/:id` - Update business
- `DELETE /business/businesses/:id` - Delete business
- `POST /business/businesses/:id/approve` - Approve application
- `POST /business/businesses/:id/reject` - Reject application

**Data Structure:**
```typescript
{
  id: string,
  name: string,
  type: string,
  owner: string,
  location: string,
  contact: string,
  email: string,
  status: 'Approved' | 'Pending Review' | 'Rejected',
  applicationDate: ISO timestamp,
  accreditationNumber: string | null,
  expiryDate: ISO timestamp | null,
  permitNumber: string | null,
  documents: array,
  notes: string,
  createdAt: ISO timestamp,
  updatedAt: ISO timestamp
}
```

### 3. Product Development Module

#### Events
- `GET /development/events` - Get all events
- `GET /development/events/:id` - Get single event
- `POST /development/events` - Create event
- `PUT /development/events/:id` - Update event
- `DELETE /development/events/:id` - Delete event

#### Tourism Packages
- `GET /development/packages` - Get all packages
- `POST /development/packages` - Create package
- `PUT /development/packages/:id` - Update package
- `DELETE /development/packages/:id` - Delete package

**Event Data Structure:**
```typescript
{
  id: string,
  title: string,
  date: ISO timestamp,
  time: string,
  location: string,
  description: string,
  category: string,
  status: 'Scheduled' | 'Ongoing' | 'Completed' | 'Cancelled',
  attendees: number,
  organizer: string,
  createdAt: ISO timestamp,
  updatedAt: ISO timestamp
}
```

### 4. Visitor Services Module

#### Tourist Spots
- `GET /visitor/spots` - Get all spots
- `GET /visitor/spots/:id` - Get single spot

#### Inquiries
- `GET /visitor/inquiries` - Get all inquiries
- `GET /visitor/inquiries/:id` - Get single inquiry
- `POST /visitor/inquiries` - Create inquiry
- `PUT /visitor/inquiries/:id` - Update inquiry
- `DELETE /visitor/inquiries/:id` - Delete inquiry
- `POST /visitor/inquiries/:id/respond` - Respond to inquiry

#### Analytics
- `GET /visitor/analytics/stats` - Get visitor statistics
- `POST /visitor/analytics/stats` - Update statistics

**Inquiry Data Structure:**
```typescript
{
  id: string,
  name: string,
  email: string,
  phone: string,
  subject: string,
  message: string,
  status: 'New' | 'In Progress' | 'Responded' | 'Closed',
  priority: 'Low' | 'Normal' | 'High' | 'Urgent',
  assignedTo: string | null,
  response: string | null,
  respondedAt: ISO timestamp | null,
  respondedBy: string | null,
  createdAt: ISO timestamp,
  updatedAt: ISO timestamp
}
```

### 5. Reporting Module

- `GET /reports/all` - Get all generated reports
- `GET /reports/:id` - Get single report
- `DELETE /reports/:id` - Delete report
- `POST /reports/generate/otop` - Generate OTOP report
- `POST /reports/generate/business` - Generate Business report
- `POST /reports/generate/events` - Generate Events report
- `POST /reports/generate/visitor` - Generate Visitor report
- `GET /reports/analytics/summary` - Get analytics summary

**Report Data Structure:**
```typescript
{
  id: string,
  type: 'OTOP' | 'Business' | 'Events' | 'Visitor',
  title: string,
  dateRange: string,
  startDate: ISO timestamp | null,
  endDate: ISO timestamp | null,
  data: object,
  generatedAt: ISO timestamp,
  generatedBy: string
}
```

---

## 🔧 Frontend Usage

### Import API Utilities
```typescript
import { otopAPI, businessAPI, developmentAPI, visitorAPI, reportsAPI } from '../utils/api';
import { logActivity } from '../utils/activityLogger';
```

### Example: Fetch Data
```typescript
const [products, setProducts] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  loadProducts();
}, []);

const loadProducts = async () => {
  try {
    const data = await otopAPI.getProducts();
    setProducts(data);
  } catch (error) {
    console.error('Failed to load products:', error);
  } finally {
    setLoading(false);
  }
};
```

### Example: Create Data
```typescript
const handleCreateProduct = async (productData) => {
  try {
    const result = await otopAPI.createProduct(productData);
    
    // Log activity
    await logActivity({
      action: 'Product created',
      detail: `${productData.name} added to catalog`,
      status: 'success',
      module: 'OTOP Support'
    });
    
    // Refresh list
    loadProducts();
  } catch (error) {
    console.error('Failed to create product:', error);
    alert('Error creating product');
  }
};
```

### Example: Update Data
```typescript
const handleUpdateProduct = async (id, updates) => {
  try {
    const result = await otopAPI.updateProduct(id, updates);
    
    await logActivity({
      action: 'Product updated',
      detail: `${updates.name} modified`,
      status: 'success',
      module: 'OTOP Support'
    });
    
    loadProducts();
  } catch (error) {
    console.error('Failed to update product:', error);
  }
};
```

### Example: Delete Data
```typescript
const handleDeleteProduct = async (id, productName) => {
  if (!confirm(`Delete ${productName}?`)) return;
  
  try {
    await otopAPI.deleteProduct(id);
    
    await logActivity({
      action: 'Product deleted',
      detail: `${productName} removed from catalog`,
      status: 'warning',
      module: 'OTOP Support'
    });
    
    loadProducts();
  } catch (error) {
    console.error('Failed to delete product:', error);
  }
};
```

---

## 🎯 Activity Logging

All module actions should log activities to the dashboard:

```typescript
import { logActivity } from '../utils/activityLogger';

// Success action
await logActivity({
  action: 'Business approved',
  detail: 'Seaside Resort - Accreditation ACC-123456',
  status: 'success',
  module: 'Business Accreditation'
});

// Pending action
await logActivity({
  action: 'Application submitted',
  detail: 'New hotel registration pending review',
  status: 'pending',
  module: 'Business Accreditation'
});

// Info action
await logActivity({
  action: 'Event scheduled',
  detail: 'Calabanga Festival 2025 - March 15',
  status: 'info',
  module: 'Product Development'
});

// Warning action
await logActivity({
  action: 'Product archived',
  detail: 'Out of stock - Bamboo Basket',
  status: 'warning',
  module: 'OTOP Support'
});
```

---

## 📊 Dashboard Stats Update

Modules can update dashboard statistics:

```typescript
import { updateDashboardStats } from '../utils/activityLogger';

// After creating/deleting products
const products = await otopAPI.getProducts();
await updateDashboardStats({
  otopProducts: products.length,
  otopTrend: '+5'
});

// After approving businesses
const businesses = await businessAPI.getBusinesses();
const approved = businesses.filter(b => b.status === 'Approved');
await updateDashboardStats({
  activeBusinesses: approved.length,
  businessTrend: '+2'
});

// After creating events
const events = await developmentAPI.getEvents();
const upcoming = events.filter(e => e.status === 'Scheduled');
await updateDashboardStats({
  upcomingEvents: upcoming.length,
  eventTrend: 'This month'
});
```

---

## ✅ Integration Checklist

For each module:

1. ✅ Import API utilities (`import { otopAPI } from '../utils/api'`)
2. ✅ Create state for data and loading (`useState`)
3. ✅ Load data on mount (`useEffect`)
4. ✅ Handle errors gracefully (`try/catch`)
5. ✅ Log activities for all CRUD operations
6. ✅ Update dashboard stats when relevant
7. ✅ Show loading states
8. ✅ Display error messages to user
9. ✅ Refresh data after mutations
10. ✅ Test all operations

---

## 🔒 Data Storage

All data is stored in Supabase KV store with these keys:

- `otop_products` - Array of OTOP products
- `otop_categories` - Array of OTOP categories
- `businesses` - Array of business applications
- `tourism_events` - Array of tourism events
- `tourism_packages` - Array of tourism packages
- `visitor_inquiries` - Array of visitor inquiries
- `tourist_spots` - Array of tourist spots
- `visitor_analytics` - Visitor statistics object
- `generated_reports` - Array of generated reports
- `dashboard_stats` - Dashboard statistics object
- `dashboard_activities` - Array of activity logs

---

## 🚀 Next Steps

1. Update each module component to use the API utilities
2. Replace mock data with real Supabase data
3. Add loading states and error handling
4. Integrate activity logging
5. Test all CRUD operations
6. Verify dashboard updates correctly

---

**All APIs are ready and functional!** 🎉

The backend is fully deployed and waiting for frontend integration.
