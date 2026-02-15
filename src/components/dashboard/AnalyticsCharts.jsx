import React from 'react';
import { motion } from 'framer-motion';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import { format, subDays, startOfDay, eachDayOfInterval } from 'date-fns';

const COLORS = {
  purple: '#9333ea',
  cyan: '#06b6d4',
  emerald: '#10b981',
  amber: '#f59e0b',
  red: '#ef4444'
};

export default function AnalyticsCharts({ escrows }) {
  // Volume over time (last 30 days)
  const last30Days = eachDayOfInterval({
    start: subDays(new Date(), 29),
    end: new Date()
  });

  const volumeData = last30Days.map(date => {
    const dayStart = startOfDay(date);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    
    const dayEscrows = escrows.filter(e => {
      const created = new Date(e.created_date);
      return created >= dayStart && created < dayEnd;
    });
    
    return {
      date: format(date, 'MMM d'),
      volume: dayEscrows.reduce((sum, e) => sum + (e.amount || 0), 0),
      count: dayEscrows.length
    };
  });

  // Status distribution
  const statusData = [
    { name: 'Pending', value: escrows.filter(e => e.status === 'pending').length, color: COLORS.amber },
    { name: 'Funded', value: escrows.filter(e => e.status === 'funded').length, color: COLORS.cyan },
    { name: 'Released', value: escrows.filter(e => e.status === 'released').length, color: COLORS.emerald },
    { name: 'Disputed', value: escrows.filter(e => e.status === 'disputed').length, color: COLORS.red },
  ].filter(s => s.value > 0);

  // Top categories by volume
  const categoryVolume = escrows.reduce((acc, e) => {
    const amount = e.amount || 0;
    if (amount >= 20000) acc['$20k+'] = (acc['$20k+'] || 0) + 1;
    else if (amount >= 10000) acc['$10k-20k'] = (acc['$10k-20k'] || 0) + 1;
    else if (amount >= 5000) acc['$5k-10k'] = (acc['$5k-10k'] || 0) + 1;
    else acc['<$5k'] = (acc['<$5k'] || 0) + 1;
    return acc;
  }, {});

  const categoryData = Object.entries(categoryVolume).map(([name, value]) => ({ name, value }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Volume Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-gray-200 rounded-2xl p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Volume</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={volumeData}>
              <defs>
                <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.purple} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS.purple} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis 
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickLine={false}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                formatter={(value) => [`$${value.toLocaleString()}`, 'Volume']}
                contentStyle={{ 
                  borderRadius: '8px', 
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="volume" 
                stroke={COLORS.purple} 
                strokeWidth={2}
                fill="url(#volumeGradient)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Status Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white border border-gray-200 rounded-2xl p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Distribution</h3>
        <div className="h-64 flex items-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={4}
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name) => [value, name]}
                contentStyle={{ 
                  borderRadius: '8px', 
                  border: '1px solid #e5e7eb'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 ml-4">
            {statusData.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-gray-600">{item.name}</span>
                <span className="text-sm font-medium text-gray-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Deal Size Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white border border-gray-200 rounded-2xl p-6 lg:col-span-2"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Deal Size Distribution</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis 
                type="category" 
                dataKey="name" 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                width={70}
              />
              <Tooltip 
                formatter={(value) => [value, 'Escrows']}
                contentStyle={{ 
                  borderRadius: '8px', 
                  border: '1px solid #e5e7eb'
                }}
              />
              <Bar 
                dataKey="value" 
                fill={COLORS.cyan}
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}