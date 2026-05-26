import { useState, useEffect } from 'react';
import { Users, Award, ShoppingBag, Calendar, TrendingUp, MapPin, FileText, Activity, Clock, CheckCircle, AlertCircle, Info, ArrowRight } from 'lucide-react';
import { ModuleType } from '../App';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface DashboardHomeProps {
  setActiveModule: (module: ModuleType) => void;
}

interface DashboardStats {
  visitorArrivals: number;
  visitorTrend: string;
  activeBusinesses: number;
  businessTrend: string;
  otopProducts: number;
  otopTrend: string;
  upcomingEvents: number;
  eventTrend: string;
}

interface ActivityLog {
  id: string;
  action: string;
  detail: string;
  timestamp: string;
  status: 'success' | 'pending' | 'info' | 'warning';
  module: string;
}

export function DashboardHome({ setActiveModule }: DashboardHomeProps) {
  const [stats, setStats] = useState<DashboardStats>({
    visitorArrivals: 0,
    visitorTrend: '+0%',
    activeBusinesses: 0,
    businessTrend: '+0',
    otopProducts: 0,
    otopTrend: '+0',
    upcomingEvents: 0,
    eventTrend: 'This month',
  });
  
  const [recentActivities, setRecentActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Fetch dashboard stats from KV store
      const statsResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-15ff0e9f/dashboard/stats`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Fetch recent activities
      const activitiesResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-15ff0e9f/dashboard/activities`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (activitiesResponse.ok) {
        const activitiesData = await activitiesResponse.json();
        setRecentActivities(activitiesData);
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Set default data on error
      setStats({
        visitorArrivals: 2847,
        visitorTrend: '+12%',
        activeBusinesses: 156,
        businessTrend: '+8',
        otopProducts: 342,
        otopTrend: '+23',
        upcomingEvents: 5,
        eventTrend: 'This month',
      });
      
      setRecentActivities([
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
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  };

  const quickActions = [
    { 
      title: 'Content Management', 
      description: 'Update website content', 
      icon: FileText, 
      module: 'cms' as ModuleType,
      color: 'from-indigo-500 to-indigo-600',
      iconBg: 'bg-indigo-100',
      iconColor: 'text-indigo-600'
    },
    { 
      title: 'OTOP Support', 
      description: 'Manage products & producers', 
      icon: ShoppingBag, 
      module: 'otop' as ModuleType,
      color: 'from-purple-500 to-purple-600',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600'
    },
    { 
      title: 'Business Accreditation', 
      description: 'Process applications', 
      icon: Award, 
      module: 'business' as ModuleType,
      color: 'from-green-500 to-green-600',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600'
    },
    { 
      title: 'Events & Products', 
      description: 'Plan tourism activities', 
      icon: Calendar, 
      module: 'development' as ModuleType,
      color: 'from-orange-500 to-orange-600',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600'
    },
    { 
      title: 'Visitor Services', 
      description: 'Assist tourists & inquiries', 
      icon: MapPin, 
      module: 'visitor' as ModuleType,
      color: 'from-blue-500 to-blue-600',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
  ];

  const statCards = [
    { 
      label: 'Visitor Arrivals', 
      value: stats.visitorArrivals.toLocaleString(), 
      trend: stats.visitorTrend, 
      icon: Users, 
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    { 
      label: 'Active Businesses', 
      value: stats.activeBusinesses.toString(), 
      trend: stats.businessTrend, 
      icon: Award, 
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600'
    },
    { 
      label: 'OTOP Products', 
      value: stats.otopProducts.toString(), 
      trend: stats.otopTrend, 
      icon: ShoppingBag, 
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600'
    },
    { 
      label: 'Upcoming Events', 
      value: stats.upcomingEvents.toString(), 
      trend: stats.eventTrend, 
      icon: Calendar, 
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600'
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Compact Header */}
      <div className="bg-gradient-to-r from-sky-500 to-blue-600 text-white px-4 md:px-6 py-4 md:py-5">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl md:text-2xl mb-1">Welcome, Tourism Officer</h1>
              <p className="text-sm text-sky-100">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="hidden md:flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
              <Activity size={18} />
              <span className="text-sm">System Active</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6">
        {/* Statistics Cards - Compact */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className={`${stat.bgColor} p-2.5 rounded-lg`}>
                    <Icon size={20} className={stat.iconColor} />
                  </div>
                  <div className="text-xs text-green-600 flex items-center gap-1 bg-green-50 px-2 py-1 rounded-full">
                    <TrendingUp size={12} />
                    {stat.trend}
                  </div>
                </div>
                <div>
                  <p className="text-2xl md:text-3xl mb-1">{stat.value}</p>
                  <p className="text-xs md:text-sm text-slate-600">{stat.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Content Grid - 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Left Column - Quick Access (2/3 width) */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            {/* Quick Access Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg md:text-xl">Quick Access</h2>
                <span className="text-xs text-slate-500">{quickActions.length} modules</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.title}
                      onClick={() => setActiveModule(action.module)}
                      className="group bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200 rounded-xl p-4 text-left hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`${action.iconBg} p-3 rounded-lg group-hover:scale-110 transition-transform`}>
                          <Icon size={20} className={action.iconColor} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm md:text-base mb-1 truncate">{action.title}</h3>
                          <p className="text-xs text-slate-600">{action.description}</p>
                        </div>
                        <ArrowRight size={16} className="text-slate-400 group-hover:text-slate-600 group-hover:translate-x-1 transition-all mt-1 flex-shrink-0" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* System Overview - Compact */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6">
              <h2 className="text-lg md:text-xl mb-4">System Overview</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-lg border border-blue-200">
                  <p className="text-2xl mb-1">94%</p>
                  <p className="text-xs text-slate-600">System Health</p>
                </div>
                <div className="text-center p-3 bg-gradient-to-br from-green-50 to-green-100/50 rounded-lg border border-green-200">
                  <p className="text-2xl mb-1">127</p>
                  <p className="text-xs text-slate-600">Pending Tasks</p>
                </div>
                <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-lg border border-purple-200">
                  <p className="text-2xl mb-1">45</p>
                  <p className="text-xs text-slate-600">New Inquiries</p>
                </div>
                <div className="text-center p-3 bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-lg border border-orange-200">
                  <p className="text-2xl mb-1">12</p>
                  <p className="text-xs text-slate-600">Reports Due</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Recent Activity (1/3 width) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6 sticky top-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg md:text-xl">Recent Activity</h2>
                <Clock size={18} className="text-slate-400" />
              </div>
              
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {recentActivities.map((activity) => {
                  const statusConfig = {
                    success: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50' },
                    pending: { icon: AlertCircle, color: 'text-orange-500', bg: 'bg-orange-50' },
                    info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-50' },
                    warning: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50' },
                  };
                  
                  const config = statusConfig[activity.status];
                  const StatusIcon = config.icon;

                  return (
                    <div key={activity.id} className="group hover:bg-slate-50 rounded-lg p-3 -mx-3 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className={`${config.bg} p-2 rounded-lg flex-shrink-0`}>
                          <StatusIcon size={16} className={config.color} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm mb-1">{activity.action}</p>
                          <p className="text-xs text-slate-600 truncate mb-1">{activity.detail}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-500">{getTimeAgo(activity.timestamp)}</span>
                            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{activity.module}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button className="w-full mt-4 text-sm text-sky-600 hover:text-sky-700 py-2 border-t border-slate-200 pt-4">
                View All Activities →
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Performance Metrics */}
        <div className="mt-4 md:mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-sky-500 to-blue-600 text-white rounded-xl p-5 shadow-md">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm opacity-90">Monthly Performance</h3>
              <TrendingUp size={18} />
            </div>
            <p className="text-3xl mb-1">+24%</p>
            <p className="text-xs text-sky-100">Compared to last month</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-5 shadow-md">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm opacity-90">Satisfaction Rate</h3>
              <Users size={18} />
            </div>
            <p className="text-3xl mb-1">4.8/5</p>
            <p className="text-xs text-purple-100">Based on 342 reviews</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-5 shadow-md">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm opacity-90">Revenue Growth</h3>
              <Activity size={18} />
            </div>
            <p className="text-3xl mb-1">₱2.4M</p>
            <p className="text-xs text-green-100">Tourism sector this quarter</p>
          </div>
        </div>
      </div>
    </div>
  );
}