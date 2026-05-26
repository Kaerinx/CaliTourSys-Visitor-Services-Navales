import { useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Download, FileText, Calendar, TrendingUp, Users, ShoppingBag, Award } from 'lucide-react';

const visitorData = [
  { month: 'Jan', visitors: 2340 },
  { month: 'Feb', visitors: 2680 },
  { month: 'Mar', visitors: 3120 },
  { month: 'Apr', visitors: 2890 },
  { month: 'May', visitors: 3450 },
  { month: 'Jun', visitors: 3890 },
];

const businessData = [
  { category: 'Hotels', count: 45 },
  { category: 'Resorts', count: 32 },
  { category: 'Restaurants', count: 79 },
];

const heatmapData = [
  { day: 'Mon', week1: 120, week2: 145, week3: 132, week4: 156 },
  { day: 'Tue', week1: 98, week2: 112, week3: 105, week4: 134 },
  { day: 'Wed', week1: 134, week2: 156, week3: 148, week4: 167 },
  { day: 'Thu', week1: 145, week2: 167, week3: 159, week4: 178 },
  { day: 'Fri', week1: 189, week2: 198, week3: 203, week4: 215 },
  { day: 'Sat', week1: 267, week2: 289, week3: 276, week4: 298 },
  { day: 'Sun', week1: 234, week2: 245, week3: 239, week4: 256 },
];

export function ReportingModule() {
  const [dateRange, setDateRange] = useState('This Month');
  const [selectedCategory, setSelectedCategory] = useState('All');

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl mb-2">Reports & Analytics</h2>
          <p className="text-sm text-slate-600">Tourism performance overview</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white border border-slate-300 px-4 py-2 rounded-lg hover:bg-slate-50 flex items-center gap-2 text-sm">
            <FileText size={18} />
            <span className="hidden md:inline">Generate PDF</span>
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm">
            <Download size={18} />
            <span className="hidden md:inline">Export Excel</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Users size={20} className="text-blue-600" />
            </div>
          </div>
          <p className="text-2xl mb-1">2,847</p>
          <p className="text-sm text-slate-600">Visitor Arrivals</p>
          <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
            <TrendingUp size={12} />
            <span>+12% vs last month</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <Award size={20} className="text-green-600" />
            </div>
          </div>
          <p className="text-2xl mb-1">156</p>
          <p className="text-sm text-slate-600">Active Businesses</p>
          <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
            <TrendingUp size={12} />
            <span>+8 new this month</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="bg-purple-100 p-2 rounded-lg">
              <ShoppingBag size={20} className="text-purple-600" />
            </div>
          </div>
          <p className="text-2xl mb-1">342</p>
          <p className="text-sm text-slate-600">OTOP Products</p>
          <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
            <TrendingUp size={12} />
            <span>+23 added</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="bg-orange-100 p-2 rounded-lg">
              <Calendar size={20} className="text-orange-600" />
            </div>
          </div>
          <p className="text-2xl mb-1">5</p>
          <p className="text-sm text-slate-600">Upcoming Events</p>
          <div className="flex items-center gap-1 mt-2 text-xs text-slate-600">
            <span>This month</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm mb-2 text-slate-700">Date Range</label>
            <select 
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>This Week</option>
              <option>This Month</option>
              <option>Last 3 Months</option>
              <option>Last 6 Months</option>
              <option>This Year</option>
              <option>Custom Range</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm mb-2 text-slate-700">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>All Categories</option>
              <option>Visitor Arrivals</option>
              <option>Business Performance</option>
              <option>OTOP Products</option>
              <option>Events</option>
            </select>
          </div>
        </div>
      </div>

      {/* Visitor Trends Chart */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h3 className="text-lg mb-4">Visitor Arrival Trends</h3>
        <div className="w-full" style={{ height: '320px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={visitorData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="month" 
                stroke="#64748b"
                style={{ fontSize: '14px' }}
              />
              <YAxis 
                stroke="#64748b"
                style={{ fontSize: '14px' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '12px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="visitors" 
                stroke="#2563eb" 
                strokeWidth={3}
                dot={{ fill: '#2563eb', r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Business Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h3 className="text-lg mb-4">Business Distribution</h3>
          <div className="w-full" style={{ height: '256px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={businessData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="category" 
                  stroke="#64748b"
                  style={{ fontSize: '14px' }}
                />
                <YAxis 
                  stroke="#64748b"
                  style={{ fontSize: '14px' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '12px'
                  }}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {businessData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#10b981', '#3b82f6', '#f59e0b'][index]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h3 className="text-lg mb-4">Summary Statistics</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <p className="text-sm text-slate-600 mb-1">Average Daily Visitors</p>
                <p className="text-2xl text-blue-700">95</p>
              </div>
              <div className="bg-blue-600 p-3 rounded-lg">
                <Users size={24} className="text-white" />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div>
                <p className="text-sm text-slate-600 mb-1">Accreditation Rate</p>
                <p className="text-2xl text-green-700">87%</p>
              </div>
              <div className="bg-green-600 p-3 rounded-lg">
                <Award size={24} className="text-white" />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
              <div>
                <p className="text-sm text-slate-600 mb-1">OTOP Growth Rate</p>
                <p className="text-2xl text-purple-700">+18%</p>
              </div>
              <div className="bg-purple-600 p-3 rounded-lg">
                <ShoppingBag size={24} className="text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Arrivals Heatmap */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h3 className="text-lg mb-4">Visitor Arrivals Heatmap (Weekly Pattern)</h3>
        <p className="text-sm text-slate-600 mb-4">Peak visitor days highlighted in darker shades</p>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left text-sm p-2 text-slate-600">Day</th>
                <th className="text-center text-sm p-2 text-slate-600">Week 1</th>
                <th className="text-center text-sm p-2 text-slate-600">Week 2</th>
                <th className="text-center text-sm p-2 text-slate-600">Week 3</th>
                <th className="text-center text-sm p-2 text-slate-600">Week 4</th>
              </tr>
            </thead>
            <tbody>
              {heatmapData.map((row) => (
                <tr key={row.day}>
                  <td className="p-2 text-sm">{row.day}</td>
                  <td className="p-2">
                    <div className={`py-3 rounded text-center text-sm ${getHeatColor(row.week1)}`}>
                      {row.week1}
                    </div>
                  </td>
                  <td className="p-2">
                    <div className={`py-3 rounded text-center text-sm ${getHeatColor(row.week2)}`}>
                      {row.week2}
                    </div>
                  </td>
                  <td className="p-2">
                    <div className={`py-3 rounded text-center text-sm ${getHeatColor(row.week3)}`}>
                      {row.week3}
                    </div>
                  </td>
                  <td className="p-2">
                    <div className={`py-3 rounded text-center text-sm ${getHeatColor(row.week4)}`}>
                      {row.week4}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-center gap-4 mt-6 text-sm">
          <span className="text-slate-600">Low</span>
          <div className="flex gap-1">
            <div className="w-6 h-6 bg-blue-100 rounded" />
            <div className="w-6 h-6 bg-blue-200 rounded" />
            <div className="w-6 h-6 bg-blue-400 rounded" />
            <div className="w-6 h-6 bg-blue-600 rounded" />
            <div className="w-6 h-6 bg-blue-800 rounded" />
          </div>
          <span className="text-slate-600">High</span>
        </div>
      </div>

      {/* Recent Reports */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h3 className="text-lg mb-4">Recent Reports</h3>
        <div className="space-y-3">
          {[
            { name: 'Monthly Tourism Report - June 2025', date: 'June 30, 2025', type: 'PDF' },
            { name: 'OTOP Product Performance Q2', date: 'June 28, 2025', type: 'Excel' },
            { name: 'Business Accreditation Summary', date: 'June 25, 2025', type: 'PDF' },
            { name: 'Visitor Satisfaction Survey Results', date: 'June 20, 2025', type: 'PDF' },
          ].map((report, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <FileText className="text-blue-600 flex-shrink-0" size={20} />
                <div className="min-w-0">
                  <p className="text-sm truncate">{report.name}</p>
                  <p className="text-xs text-slate-600">{report.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                <span className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded">{report.type}</span>
                <button className="p-2 hover:bg-white rounded-lg transition-colors">
                  <Download size={18} className="text-slate-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function getHeatColor(value: number): string {
  if (value < 120) return 'bg-blue-100 text-slate-700';
  if (value < 150) return 'bg-blue-200 text-slate-700';
  if (value < 180) return 'bg-blue-400 text-white';
  if (value < 220) return 'bg-blue-600 text-white';
  return 'bg-blue-800 text-white';
}