import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";

export const visitorRoutes = new Hono();

// Tourist Spots Endpoints

// Get all tourist spots
visitorRoutes.get("/spots", async (c) => {
  try {
    const spots = await kv.get("tourist_spots") || [];
    return c.json(spots);
  } catch (error) {
    console.error('Get tourist spots error:', error);
    return c.json({ error: 'Failed to fetch tourist spots', details: error.message }, 500);
  }
});

// Get single tourist spot
visitorRoutes.get("/spots/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const spots = await kv.get("tourist_spots") || [];
    const spot = spots.find((s: any) => s.id === id);
    
    if (!spot) {
      return c.json({ error: 'Tourist spot not found' }, 404);
    }
    
    return c.json(spot);
  } catch (error) {
    console.error('Get tourist spot error:', error);
    return c.json({ error: 'Failed to fetch tourist spot', details: error.message }, 500);
  }
});

// Inquiries Endpoints

// Get all inquiries
visitorRoutes.get("/inquiries", async (c) => {
  try {
    const inquiries = await kv.get("visitor_inquiries") || [];
    return c.json(inquiries);
  } catch (error) {
    console.error('Get inquiries error:', error);
    return c.json({ error: 'Failed to fetch inquiries', details: error.message }, 500);
  }
});

// Get single inquiry
visitorRoutes.get("/inquiries/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const inquiries = await kv.get("visitor_inquiries") || [];
    const inquiry = inquiries.find((i: any) => i.id === id);
    
    if (!inquiry) {
      return c.json({ error: 'Inquiry not found' }, 404);
    }
    
    return c.json(inquiry);
  } catch (error) {
    console.error('Get inquiry error:', error);
    return c.json({ error: 'Failed to fetch inquiry', details: error.message }, 500);
  }
});

// Create inquiry
visitorRoutes.post("/inquiries", async (c) => {
  try {
    const body = await c.req.json();
    const inquiries = await kv.get("visitor_inquiries") || [];
    
    const newInquiry = {
      id: `inquiry_${Date.now()}`,
      name: body.name,
      email: body.email || '',
      phone: body.phone || '',
      subject: body.subject,
      message: body.message,
      status: body.status || 'New',
      priority: body.priority || 'Normal',
      assignedTo: body.assignedTo || null,
      response: body.response || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    inquiries.push(newInquiry);
    await kv.set("visitor_inquiries", inquiries);
    
    return c.json({ success: true, inquiry: newInquiry }, 201);
  } catch (error) {
    console.error('Create inquiry error:', error);
    return c.json({ error: 'Failed to create inquiry', details: error.message }, 500);
  }
});

// Update inquiry
visitorRoutes.put("/inquiries/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const inquiries = await kv.get("visitor_inquiries") || [];
    
    const index = inquiries.findIndex((i: any) => i.id === id);
    if (index === -1) {
      return c.json({ error: 'Inquiry not found' }, 404);
    }
    
    inquiries[index] = {
      ...inquiries[index],
      ...body,
      updatedAt: new Date().toISOString(),
    };
    
    await kv.set("visitor_inquiries", inquiries);
    
    return c.json({ success: true, inquiry: inquiries[index] });
  } catch (error) {
    console.error('Update inquiry error:', error);
    return c.json({ error: 'Failed to update inquiry', details: error.message }, 500);
  }
});

// Delete inquiry
visitorRoutes.delete("/inquiries/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const inquiries = await kv.get("visitor_inquiries") || [];
    
    const filteredInquiries = inquiries.filter((i: any) => i.id !== id);
    
    if (filteredInquiries.length === inquiries.length) {
      return c.json({ error: 'Inquiry not found' }, 404);
    }
    
    await kv.set("visitor_inquiries", filteredInquiries);
    
    return c.json({ success: true, message: 'Inquiry deleted successfully' });
  } catch (error) {
    console.error('Delete inquiry error:', error);
    return c.json({ error: 'Failed to delete inquiry', details: error.message }, 500);
  }
});

// Respond to inquiry
visitorRoutes.post("/inquiries/:id/respond", async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const inquiries = await kv.get("visitor_inquiries") || [];
    
    const index = inquiries.findIndex((i: any) => i.id === id);
    if (index === -1) {
      return c.json({ error: 'Inquiry not found' }, 404);
    }
    
    inquiries[index] = {
      ...inquiries[index],
      status: 'Responded',
      response: body.response,
      respondedAt: new Date().toISOString(),
      respondedBy: body.respondedBy || 'Tourism Officer',
      updatedAt: new Date().toISOString(),
    };
    
    await kv.set("visitor_inquiries", inquiries);
    
    return c.json({ success: true, inquiry: inquiries[index] });
  } catch (error) {
    console.error('Respond to inquiry error:', error);
    return c.json({ error: 'Failed to respond to inquiry', details: error.message }, 500);
  }
});

// Visitor Analytics Endpoints

// Get visitor statistics
visitorRoutes.get("/analytics/stats", async (c) => {
  try {
    const stats = await kv.get("visitor_analytics") || {
      totalVisitors: 0,
      todayVisitors: 0,
      weekVisitors: 0,
      monthVisitors: 0,
      topSpots: [],
      lastUpdated: new Date().toISOString(),
    };
    
    return c.json(stats);
  } catch (error) {
    console.error('Get visitor analytics error:', error);
    return c.json({ error: 'Failed to fetch visitor analytics', details: error.message }, 500);
  }
});

// Update visitor statistics
visitorRoutes.post("/analytics/stats", async (c) => {
  try {
    const body = await c.req.json();
    
    const stats = {
      totalVisitors: body.totalVisitors || 0,
      todayVisitors: body.todayVisitors || 0,
      weekVisitors: body.weekVisitors || 0,
      monthVisitors: body.monthVisitors || 0,
      topSpots: body.topSpots || [],
      lastUpdated: new Date().toISOString(),
    };
    
    await kv.set("visitor_analytics", stats);
    
    return c.json({ success: true, stats });
  } catch (error) {
    console.error('Update visitor analytics error:', error);
    return c.json({ error: 'Failed to update visitor analytics', details: error.message }, 500);
  }
});
