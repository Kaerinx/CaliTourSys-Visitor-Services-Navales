import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { otopRoutes } from "./otop-routes.tsx";
import { businessRoutes } from "./business-routes.tsx";
import { developmentRoutes } from "./development-routes.tsx";
import { visitorRoutes } from "./visitor-routes.tsx";
import { reportsRoutes } from "./reports-routes.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-15ff0e9f/health", (c) => {
  return c.json({ status: "ok" });
});

// Dashboard Statistics Endpoint
app.get("/make-server-15ff0e9f/dashboard/stats", async (c) => {
  try {
    // Try to get stats from KV store, or initialize with defaults
    let stats = await kv.get("dashboard_stats");
    
    if (!stats) {
      // Initialize default stats
      stats = {
        visitorArrivals: 2847,
        visitorTrend: '+12%',
        activeBusinesses: 156,
        businessTrend: '+8',
        otopProducts: 342,
        otopTrend: '+23',
        upcomingEvents: 5,
        eventTrend: 'This month',
        lastUpdated: new Date().toISOString(),
      };
      await kv.set("dashboard_stats", stats);
    }
    
    return c.json(stats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return c.json({ 
      error: 'Failed to fetch dashboard stats',
      details: error.message 
    }, 500);
  }
});

// Dashboard Activities Endpoint
app.get("/make-server-15ff0e9f/dashboard/activities", async (c) => {
  try {
    // Get activities from KV store
    let activities = await kv.get("dashboard_activities");
    
    if (!activities || !Array.isArray(activities)) {
      // Initialize default activities
      activities = [
        { 
          id: '1',
          action: 'New business application', 
          detail: 'Seaside Resort - Under Review', 
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), 
          status: 'pending',
          module: 'Business Accreditation'
        },
        { 
          id: '2',
          action: 'OTOP product approved', 
          detail: 'Handwoven Basket by Maria Santos', 
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), 
          status: 'success',
          module: 'OTOP Support'
        },
        { 
          id: '3',
          action: 'Event published', 
          detail: 'Calabanga Festival 2025', 
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), 
          status: 'success',
          module: 'Product Development'
        },
        { 
          id: '4',
          action: 'Visitor inquiry received', 
          detail: 'Tourist Spot Information Request', 
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), 
          status: 'info',
          module: 'Visitor Services'
        },
        { 
          id: '5',
          action: 'Content updated', 
          detail: 'Museum visiting hours modified', 
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), 
          status: 'info',
          module: 'Content Management'
        },
      ];
      await kv.set("dashboard_activities", activities);
    }
    
    // Return most recent 10 activities
    const recentActivities = activities.slice(0, 10);
    return c.json(recentActivities);
  } catch (error) {
    console.error('Dashboard activities error:', error);
    return c.json({ 
      error: 'Failed to fetch dashboard activities',
      details: error.message 
    }, 500);
  }
});

// Update Dashboard Statistics (Officer action)
app.post("/make-server-15ff0e9f/dashboard/stats", async (c) => {
  try {
    const body = await c.req.json();
    
    const stats = {
      visitorArrivals: body.visitorArrivals || 0,
      visitorTrend: body.visitorTrend || '+0%',
      activeBusinesses: body.activeBusinesses || 0,
      businessTrend: body.businessTrend || '+0',
      otopProducts: body.otopProducts || 0,
      otopTrend: body.otopTrend || '+0',
      upcomingEvents: body.upcomingEvents || 0,
      eventTrend: body.eventTrend || 'This month',
      lastUpdated: new Date().toISOString(),
    };
    
    await kv.set("dashboard_stats", stats);
    
    return c.json({ 
      success: true, 
      message: 'Dashboard stats updated successfully',
      stats 
    });
  } catch (error) {
    console.error('Update dashboard stats error:', error);
    return c.json({ 
      error: 'Failed to update dashboard stats',
      details: error.message 
    }, 500);
  }
});

// Add Activity Log (Officer action)
app.post("/make-server-15ff0e9f/dashboard/activities", async (c) => {
  try {
    const body = await c.req.json();
    
    // Get existing activities
    let activities = await kv.get("dashboard_activities") || [];
    
    // Create new activity
    const newActivity = {
      id: `activity_${Date.now()}`,
      action: body.action,
      detail: body.detail,
      timestamp: new Date().toISOString(),
      status: body.status || 'info',
      module: body.module || 'System',
    };
    
    // Add to beginning of array
    activities.unshift(newActivity);
    
    // Keep only last 50 activities
    if (activities.length > 50) {
      activities = activities.slice(0, 50);
    }
    
    await kv.set("dashboard_activities", activities);
    
    return c.json({ 
      success: true, 
      message: 'Activity logged successfully',
      activity: newActivity 
    });
  } catch (error) {
    console.error('Add activity log error:', error);
    return c.json({ 
      error: 'Failed to add activity log',
      details: error.message 
    }, 500);
  }
});

// Add OTOP Routes
app.route("/make-server-15ff0e9f/otop", otopRoutes);

// Add Business Routes
app.route("/make-server-15ff0e9f/business", businessRoutes);

// Add Development Routes
app.route("/make-server-15ff0e9f/development", developmentRoutes);

// Add Visitor Routes
app.route("/make-server-15ff0e9f/visitor", visitorRoutes);

// Add Reports Routes
app.route("/make-server-15ff0e9f/reports", reportsRoutes);

Deno.serve(app.fetch);