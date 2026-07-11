import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";

export const developmentRoutes = new Hono();

// Events Endpoints

// Get all events
developmentRoutes.get("/events", async (c) => {
  try {
    const events = await kv.get("tourism_events") || [];
    return c.json(events);
  } catch (error) {
    console.error('Get events error:', error);
    return c.json({ error: 'Failed to fetch events', details: error.message }, 500);
  }
});

// Get single event
developmentRoutes.get("/events/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const events = await kv.get("tourism_events") || [];
    const event = events.find((e: any) => e.id === id);
    
    if (!event) {
      return c.json({ error: 'Event not found' }, 404);
    }
    
    return c.json(event);
  } catch (error) {
    console.error('Get event error:', error);
    return c.json({ error: 'Failed to fetch event', details: error.message }, 500);
  }
});

// Create event
developmentRoutes.post("/events", async (c) => {
  try {
    const body = await c.req.json();
    const events = await kv.get("tourism_events") || [];
    
    const newEvent = {
      id: `event_${Date.now()}`,
      title: body.title,
      date: body.date,
      time: body.time || '',
      location: body.location || '',
      description: body.description || '',
      category: body.category || 'General',
      status: body.status || 'Scheduled',
      attendees: body.attendees || 0,
      organizer: body.organizer || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    events.push(newEvent);
    await kv.set("tourism_events", events);
    
    return c.json({ success: true, event: newEvent }, 201);
  } catch (error) {
    console.error('Create event error:', error);
    return c.json({ error: 'Failed to create event', details: error.message }, 500);
  }
});

// Update event
developmentRoutes.put("/events/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const events = await kv.get("tourism_events") || [];
    
    const index = events.findIndex((e: any) => e.id === id);
    if (index === -1) {
      return c.json({ error: 'Event not found' }, 404);
    }
    
    events[index] = {
      ...events[index],
      ...body,
      updatedAt: new Date().toISOString(),
    };
    
    await kv.set("tourism_events", events);
    
    return c.json({ success: true, event: events[index] });
  } catch (error) {
    console.error('Update event error:', error);
    return c.json({ error: 'Failed to update event', details: error.message }, 500);
  }
});

// Delete event
developmentRoutes.delete("/events/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const events = await kv.get("tourism_events") || [];
    
    const filteredEvents = events.filter((e: any) => e.id !== id);
    
    if (filteredEvents.length === events.length) {
      return c.json({ error: 'Event not found' }, 404);
    }
    
    await kv.set("tourism_events", filteredEvents);
    
    return c.json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    return c.json({ error: 'Failed to delete event', details: error.message }, 500);
  }
});

// Tourism Packages Endpoints

// Get all packages
developmentRoutes.get("/packages", async (c) => {
  try {
    const packages = await kv.get("tourism_packages") || [];
    return c.json(packages);
  } catch (error) {
    console.error('Get packages error:', error);
    return c.json({ error: 'Failed to fetch packages', details: error.message }, 500);
  }
});

// Create package
developmentRoutes.post("/packages", async (c) => {
  try {
    const body = await c.req.json();
    const packages = await kv.get("tourism_packages") || [];
    
    const newPackage = {
      id: `package_${Date.now()}`,
      name: body.name,
      description: body.description || '',
      price: body.price || 0,
      duration: body.duration || '',
      inclusions: body.inclusions || [],
      status: body.status || 'Active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    packages.push(newPackage);
    await kv.set("tourism_packages", packages);
    
    return c.json({ success: true, package: newPackage }, 201);
  } catch (error) {
    console.error('Create package error:', error);
    return c.json({ error: 'Failed to create package', details: error.message }, 500);
  }
});

// Update package
developmentRoutes.put("/packages/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const packages = await kv.get("tourism_packages") || [];
    
    const index = packages.findIndex((p: any) => p.id === id);
    if (index === -1) {
      return c.json({ error: 'Package not found' }, 404);
    }
    
    packages[index] = {
      ...packages[index],
      ...body,
      updatedAt: new Date().toISOString(),
    };
    
    await kv.set("tourism_packages", packages);
    
    return c.json({ success: true, package: packages[index] });
  } catch (error) {
    console.error('Update package error:', error);
    return c.json({ error: 'Failed to update package', details: error.message }, 500);
  }
});

// Delete package
developmentRoutes.delete("/packages/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const packages = await kv.get("tourism_packages") || [];
    
    const filteredPackages = packages.filter((p: any) => p.id !== id);
    
    if (filteredPackages.length === packages.length) {
      return c.json({ error: 'Package not found' }, 404);
    }
    
    await kv.set("tourism_packages", filteredPackages);
    
    return c.json({ success: true, message: 'Package deleted successfully' });
  } catch (error) {
    console.error('Delete package error:', error);
    return c.json({ error: 'Failed to delete package', details: error.message }, 500);
  }
});
