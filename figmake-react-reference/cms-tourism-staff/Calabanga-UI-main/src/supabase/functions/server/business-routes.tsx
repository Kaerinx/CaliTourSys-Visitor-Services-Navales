import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";

export const businessRoutes = new Hono();

// Business Applications Endpoints

// Get all businesses
businessRoutes.get("/businesses", async (c) => {
  try {
    const businesses = await kv.get("businesses") || [];
    return c.json(businesses);
  } catch (error) {
    console.error('Get businesses error:', error);
    return c.json({ error: 'Failed to fetch businesses', details: error.message }, 500);
  }
});

// Get single business
businessRoutes.get("/businesses/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const businesses = await kv.get("businesses") || [];
    const business = businesses.find((b: any) => b.id === id);
    
    if (!business) {
      return c.json({ error: 'Business not found' }, 404);
    }
    
    return c.json(business);
  } catch (error) {
    console.error('Get business error:', error);
    return c.json({ error: 'Failed to fetch business', details: error.message }, 500);
  }
});

// Create business application
businessRoutes.post("/businesses", async (c) => {
  try {
    const body = await c.req.json();
    const businesses = await kv.get("businesses") || [];
    
    const newBusiness = {
      id: `business_${Date.now()}`,
      name: body.name,
      type: body.type,
      owner: body.owner,
      location: body.location,
      contact: body.contact || '',
      email: body.email || '',
      status: body.status || 'Pending Review',
      applicationDate: body.applicationDate || new Date().toISOString(),
      accreditationNumber: body.accreditationNumber || null,
      expiryDate: body.expiryDate || null,
      permitNumber: body.permitNumber || null,
      documents: body.documents || [],
      notes: body.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    businesses.push(newBusiness);
    await kv.set("businesses", businesses);
    
    return c.json({ success: true, business: newBusiness }, 201);
  } catch (error) {
    console.error('Create business error:', error);
    return c.json({ error: 'Failed to create business application', details: error.message }, 500);
  }
});

// Update business
businessRoutes.put("/businesses/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const businesses = await kv.get("businesses") || [];
    
    const index = businesses.findIndex((b: any) => b.id === id);
    if (index === -1) {
      return c.json({ error: 'Business not found' }, 404);
    }
    
    businesses[index] = {
      ...businesses[index],
      ...body,
      updatedAt: new Date().toISOString(),
    };
    
    await kv.set("businesses", businesses);
    
    return c.json({ success: true, business: businesses[index] });
  } catch (error) {
    console.error('Update business error:', error);
    return c.json({ error: 'Failed to update business', details: error.message }, 500);
  }
});

// Delete business
businessRoutes.delete("/businesses/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const businesses = await kv.get("businesses") || [];
    
    const filteredBusinesses = businesses.filter((b: any) => b.id !== id);
    
    if (filteredBusinesses.length === businesses.length) {
      return c.json({ error: 'Business not found' }, 404);
    }
    
    await kv.set("businesses", filteredBusinesses);
    
    return c.json({ success: true, message: 'Business deleted successfully' });
  } catch (error) {
    console.error('Delete business error:', error);
    return c.json({ error: 'Failed to delete business', details: error.message }, 500);
  }
});

// Approve business application
businessRoutes.post("/businesses/:id/approve", async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const businesses = await kv.get("businesses") || [];
    
    const index = businesses.findIndex((b: any) => b.id === id);
    if (index === -1) {
      return c.json({ error: 'Business not found' }, 404);
    }
    
    const accreditationNumber = body.accreditationNumber || `ACC-${Date.now()}`;
    const expiryDate = body.expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    
    businesses[index] = {
      ...businesses[index],
      status: 'Approved',
      accreditationNumber,
      expiryDate,
      approvedDate: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await kv.set("businesses", businesses);
    
    return c.json({ success: true, business: businesses[index] });
  } catch (error) {
    console.error('Approve business error:', error);
    return c.json({ error: 'Failed to approve business', details: error.message }, 500);
  }
});

// Reject business application
businessRoutes.post("/businesses/:id/reject", async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const businesses = await kv.get("businesses") || [];
    
    const index = businesses.findIndex((b: any) => b.id === id);
    if (index === -1) {
      return c.json({ error: 'Business not found' }, 404);
    }
    
    businesses[index] = {
      ...businesses[index],
      status: 'Rejected',
      rejectionReason: body.reason || 'Not specified',
      rejectedDate: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await kv.set("businesses", businesses);
    
    return c.json({ success: true, business: businesses[index] });
  } catch (error) {
    console.error('Reject business error:', error);
    return c.json({ error: 'Failed to reject business', details: error.message }, 500);
  }
});
