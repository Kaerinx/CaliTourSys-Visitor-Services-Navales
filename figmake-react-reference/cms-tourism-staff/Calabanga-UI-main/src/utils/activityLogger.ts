import { projectId, publicAnonKey } from './supabase/info';

export type ActivityStatus = 'success' | 'pending' | 'info' | 'warning';

export interface ActivityLog {
  action: string;
  detail: string;
  status: ActivityStatus;
  module: string;
}

export async function logActivity(activity: ActivityLog): Promise<void> {
  try {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-15ff0e9f/dashboard/activities`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(activity),
      }
    );

    if (!response.ok) {
      console.error('Failed to log activity:', await response.text());
    }
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}

export async function updateDashboardStats(stats: {
  visitorArrivals?: number;
  visitorTrend?: string;
  activeBusinesses?: number;
  businessTrend?: string;
  otopProducts?: number;
  otopTrend?: string;
  upcomingEvents?: number;
  eventTrend?: string;
}): Promise<void> {
  try {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-15ff0e9f/dashboard/stats`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(stats),
      }
    );

    if (!response.ok) {
      console.error('Failed to update dashboard stats:', await response.text());
    }
  } catch (error) {
    console.error('Error updating dashboard stats:', error);
  }
}
