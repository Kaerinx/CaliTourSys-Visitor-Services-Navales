import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";

export const reportsRoutes = new Hono();

// Reports Generation Endpoints

// Get all reports
reportsRoutes.get("/all", async (c) => {
  try {
    const reports = await kv.get("generated_reports") || [];
    return c.json(reports);
  } catch (error) {
    console.error('Get reports error:', error);
    return c.json({ error: 'Failed to fetch reports', details: error.message }, 500);
  }
});

// Get single report
reportsRoutes.get("/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const reports = await kv.get("generated_reports") || [];
    const report = reports.find((r: any) => r.id === id);
    
    if (!report) {
      return c.json({ error: 'Report not found' }, 404);
    }
    
    return c.json(report);
  } catch (error) {
    console.error('Get report error:', error);
    return c.json({ error: 'Failed to fetch report', details: error.message }, 500);
  }
});

// Generate OTOP report
reportsRoutes.post("/generate/otop", async (c) => {
  try {
    const body = await c.req.json();
    const products = await kv.get("otop_products") || [];
    
    // Filter by date range if provided
    let filteredProducts = products;
    if (body.startDate && body.endDate) {
      filteredProducts = products.filter((p: any) => {
        const productDate = new Date(p.submittedDate || p.createdAt);
        return productDate >= new Date(body.startDate) && productDate <= new Date(body.endDate);
      });
    }
    
    const report = {
      id: `report_${Date.now()}`,
      type: 'OTOP',
      title: `OTOP Products Report - ${new Date().toLocaleDateString()}`,
      dateRange: body.dateRange || 'All Time',
      startDate: body.startDate || null,
      endDate: body.endDate || null,
      data: {
        totalProducts: filteredProducts.length,
        byCategory: {},
        byStatus: {},
        products: filteredProducts,
      },
      generatedAt: new Date().toISOString(),
      generatedBy: body.generatedBy || 'Tourism Officer',
    };
    
    // Count by category
    filteredProducts.forEach((p: any) => {
      report.data.byCategory[p.category] = (report.data.byCategory[p.category] || 0) + 1;
      report.data.byStatus[p.status] = (report.data.byStatus[p.status] || 0) + 1;
    });
    
    // Save report
    const reports = await kv.get("generated_reports") || [];
    reports.unshift(report);
    await kv.set("generated_reports", reports);
    
    return c.json({ success: true, report });
  } catch (error) {
    console.error('Generate OTOP report error:', error);
    return c.json({ error: 'Failed to generate OTOP report', details: error.message }, 500);
  }
});

// Generate Business report
reportsRoutes.post("/generate/business", async (c) => {
  try {
    const body = await c.req.json();
    const businesses = await kv.get("businesses") || [];
    
    // Filter by date range if provided
    let filteredBusinesses = businesses;
    if (body.startDate && body.endDate) {
      filteredBusinesses = businesses.filter((b: any) => {
        const businessDate = new Date(b.applicationDate || b.createdAt);
        return businessDate >= new Date(body.startDate) && businessDate <= new Date(body.endDate);
      });
    }
    
    const report = {
      id: `report_${Date.now()}`,
      type: 'Business',
      title: `Business Accreditation Report - ${new Date().toLocaleDateString()}`,
      dateRange: body.dateRange || 'All Time',
      startDate: body.startDate || null,
      endDate: body.endDate || null,
      data: {
        totalBusinesses: filteredBusinesses.length,
        byType: {},
        byStatus: {},
        businesses: filteredBusinesses,
      },
      generatedAt: new Date().toISOString(),
      generatedBy: body.generatedBy || 'Tourism Officer',
    };
    
    // Count by type and status
    filteredBusinesses.forEach((b: any) => {
      report.data.byType[b.type] = (report.data.byType[b.type] || 0) + 1;
      report.data.byStatus[b.status] = (report.data.byStatus[b.status] || 0) + 1;
    });
    
    // Save report
    const reports = await kv.get("generated_reports") || [];
    reports.unshift(report);
    await kv.set("generated_reports", reports);
    
    return c.json({ success: true, report });
  } catch (error) {
    console.error('Generate Business report error:', error);
    return c.json({ error: 'Failed to generate business report', details: error.message }, 500);
  }
});

// Generate Events report
reportsRoutes.post("/generate/events", async (c) => {
  try {
    const body = await c.req.json();
    const events = await kv.get("tourism_events") || [];
    
    // Filter by date range if provided
    let filteredEvents = events;
    if (body.startDate && body.endDate) {
      filteredEvents = events.filter((e: any) => {
        const eventDate = new Date(e.date);
        return eventDate >= new Date(body.startDate) && eventDate <= new Date(body.endDate);
      });
    }
    
    const report = {
      id: `report_${Date.now()}`,
      type: 'Events',
      title: `Tourism Events Report - ${new Date().toLocaleDateString()}`,
      dateRange: body.dateRange || 'All Time',
      startDate: body.startDate || null,
      endDate: body.endDate || null,
      data: {
        totalEvents: filteredEvents.length,
        byCategory: {},
        byStatus: {},
        totalAttendees: 0,
        events: filteredEvents,
      },
      generatedAt: new Date().toISOString(),
      generatedBy: body.generatedBy || 'Tourism Officer',
    };
    
    // Count by category and status, calculate total attendees
    filteredEvents.forEach((e: any) => {
      report.data.byCategory[e.category] = (report.data.byCategory[e.category] || 0) + 1;
      report.data.byStatus[e.status] = (report.data.byStatus[e.status] || 0) + 1;
      report.data.totalAttendees += e.attendees || 0;
    });
    
    // Save report
    const reports = await kv.get("generated_reports") || [];
    reports.unshift(report);
    await kv.set("generated_reports", reports);
    
    return c.json({ success: true, report });
  } catch (error) {
    console.error('Generate Events report error:', error);
    return c.json({ error: 'Failed to generate events report', details: error.message }, 500);
  }
});

// Generate Visitor report
reportsRoutes.post("/generate/visitor", async (c) => {
  try {
    const body = await c.req.json();
    const analytics = await kv.get("visitor_analytics") || {};
    const inquiries = await kv.get("visitor_inquiries") || [];
    
    // Filter inquiries by date range if provided
    let filteredInquiries = inquiries;
    if (body.startDate && body.endDate) {
      filteredInquiries = inquiries.filter((i: any) => {
        const inquiryDate = new Date(i.createdAt);
        return inquiryDate >= new Date(body.startDate) && inquiryDate <= new Date(body.endDate);
      });
    }
    
    const report = {
      id: `report_${Date.now()}`,
      type: 'Visitor',
      title: `Visitor Services Report - ${new Date().toLocaleDateString()}`,
      dateRange: body.dateRange || 'All Time',
      startDate: body.startDate || null,
      endDate: body.endDate || null,
      data: {
        totalVisitors: analytics.totalVisitors || 0,
        monthVisitors: analytics.monthVisitors || 0,
        totalInquiries: filteredInquiries.length,
        byStatus: {},
        topSpots: analytics.topSpots || [],
        inquiries: filteredInquiries,
      },
      generatedAt: new Date().toISOString(),
      generatedBy: body.generatedBy || 'Tourism Officer',
    };
    
    // Count inquiries by status
    filteredInquiries.forEach((i: any) => {
      report.data.byStatus[i.status] = (report.data.byStatus[i.status] || 0) + 1;
    });
    
    // Save report
    const reports = await kv.get("generated_reports") || [];
    reports.unshift(report);
    await kv.set("generated_reports", reports);
    
    return c.json({ success: true, report });
  } catch (error) {
    console.error('Generate Visitor report error:', error);
    return c.json({ error: 'Failed to generate visitor report', details: error.message }, 500);
  }
});

// Delete report
reportsRoutes.delete("/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const reports = await kv.get("generated_reports") || [];
    
    const filteredReports = reports.filter((r: any) => r.id !== id);
    
    if (filteredReports.length === reports.length) {
      return c.json({ error: 'Report not found' }, 404);
    }
    
    await kv.set("generated_reports", filteredReports);
    
    return c.json({ success: true, message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Delete report error:', error);
    return c.json({ error: 'Failed to delete report', details: error.message }, 500);
  }
});

// Get analytics summary
reportsRoutes.get("/analytics/summary", async (c) => {
  try {
    const products = await kv.get("otop_products") || [];
    const businesses = await kv.get("businesses") || [];
    const events = await kv.get("tourism_events") || [];
    const inquiries = await kv.get("visitor_inquiries") || [];
    const analytics = await kv.get("visitor_analytics") || {};
    
    const summary = {
      otop: {
        total: products.length,
        published: products.filter((p: any) => p.status === 'Published').length,
        pending: products.filter((p: any) => p.status === 'Pending Review').length,
      },
      business: {
        total: businesses.length,
        approved: businesses.filter((b: any) => b.status === 'Approved').length,
        pending: businesses.filter((b: any) => b.status === 'Pending Review').length,
      },
      events: {
        total: events.length,
        upcoming: events.filter((e: any) => e.status === 'Scheduled').length,
        completed: events.filter((e: any) => e.status === 'Completed').length,
      },
      visitors: {
        total: analytics.totalVisitors || 0,
        month: analytics.monthVisitors || 0,
        inquiries: inquiries.length,
        newInquiries: inquiries.filter((i: any) => i.status === 'New').length,
      },
    };
    
    return c.json(summary);
  } catch (error) {
    console.error('Get analytics summary error:', error);
    return c.json({ error: 'Failed to fetch analytics summary', details: error.message }, 500);
  }
});
