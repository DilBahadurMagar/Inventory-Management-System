"use client"

import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { TrendingUp, Package, DollarSign, AlertTriangle, Download } from 'lucide-react';
import { fetchItems as apiFetchItems, fetchLocations as apiFetchLocations } from '../api';
import { mockInventoryChart, mockCategoryBreakdown } from '../data/mockData';
import { Breadcrumb } from '../layouts/Breadcrumb';
import { CardSkeleton } from '../components/ui/SkeletonLoader';
import type { InventoryItem, Location } from '../types';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#f43f5e', '#60a5fa', '#34d399', '#fbbf24'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="font-semibold text-gray-300 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>{p.name ?? p.dataKey}: <span className="text-white font-medium">{p.value}</span></p>
      ))}
    </div>
  );
};

export function ReportsPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([apiFetchItems(), apiFetchLocations()]).then(([itemsRes, locs]) => {
      if (!cancelled) {
        setItems(itemsRes.items);
        setLocations(locs);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  const statusBreakdown = [
    { name: 'Active', value: items.filter(i => i.status === 'active').length, color: '#10b981' },
    { name: 'Inactive', value: items.filter(i => i.status === 'inactive').length, color: '#6b7280' },
    { name: 'Maintenance', value: items.filter(i => i.status === 'maintenance').length, color: '#f59e0b' },
    { name: 'Low Stock', value: items.filter(i => i.status === 'low_stock').length, color: '#f97316' },
    { name: 'Retired', value: items.filter(i => i.status === 'retired').length, color: '#f43f5e' },
  ].filter(s => s.value > 0);

  const locationBreakdown = locations.map(loc => ({
    name: (loc.name.split('\u2014').pop() || loc.name).trim().substring(0, 18),
    count: items.filter(i => i.locationId === loc.id).length,
    capacity: loc.capacity,
  }));

  const totalValue = items.reduce((sum, i) => sum + i.purchasePrice * i.quantity, 0);

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div>
        <Breadcrumb />
        <div className="flex items-center justify-between mt-1">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Reports</h1>
            <p className="text-sm text-gray-500 mt-0.5">Analytics and insights across your inventory</p>
          </div>
          <button className="btn-secondary"><Download size={14} /> Export Report</button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              { label: 'Total Assets', value: items.length, icon: <Package size={18} />, color: 'text-blue-400 bg-blue-500/10' },
              { label: 'Active Assets', value: items.filter(i => i.status === 'active').length, icon: <TrendingUp size={18} />, color: 'text-emerald-400 bg-emerald-500/10' },
              { label: 'Portfolio Value', value: `$${(totalValue / 1000).toFixed(0)}K`, icon: <DollarSign size={18} />, color: 'text-amber-400 bg-amber-500/10' },
              { label: 'Alerts', value: items.filter(i => i.status === 'low_stock' || i.status === 'maintenance').length, icon: <AlertTriangle size={18} />, color: 'text-rose-400 bg-rose-500/10' },
            ].map(card => (
              <div key={card.label} className="glass-card p-5">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${card.color} mb-3`}>{card.icon}</div>
                <p className="text-2xl font-bold text-white">{card.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="glass-card p-6">
              <h2 className="text-sm font-semibold text-gray-200 mb-5">Inventory Growth Trend</h2>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={mockInventoryChart} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linear.gradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="value" name="Total" stroke="#3b82f6" fill="url(#totalGrad)" strokeWidth={2.5} dot={{ fill: '#3b82f6', r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="glass-card p-6">
              <h2 className="text-sm font-semibold text-gray-200 mb-5">Status Distribution</h2>
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="50%" height={180}>
                  <PieChart>
                    <Pie data={statusBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                      {statusBreakdown.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2.5 flex-1">
                  {statusBreakdown.map(s => (
                    <div key={s.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                        <span className="text-gray-400">{s.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${items.length ? Math.round((s.value / items.length) * 100) : 0}%`, backgroundColor: s.color }} />
                        </div>
                        <span className="text-gray-300 font-medium w-6 text-right">{s.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="glass-card p-6">
              <h2 className="text-sm font-semibold text-gray-200 mb-5">Assets by Category</h2>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={mockCategoryBreakdown} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" name="Assets" radius={[0, 4, 4, 0]}>
                    {mockCategoryBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="glass-card p-6">
              <h2 className="text-sm font-semibold text-gray-200 mb-5">Location Utilization</h2>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={locationBreakdown} margin={{ top: 0, right: 10, bottom: 30, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Items" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="capacity" name="Capacity" fill="#1e2436" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
